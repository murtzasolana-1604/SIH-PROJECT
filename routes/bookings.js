const db = require("../database");
const {
    DEFAULT_CUSTOMER_RADIUS_KM,
    DEFAULT_WORKER_RADIUS_KM,
    COOPERATIVE_COMMISSION_RATE,
    WORKER_PAYOUT_RATE,
    ALLOWED_RADII_KM,
    calculateHaversineDistance,
    calculatePricingBreakdown
} = require("../config/businessRules");

// Flat local pricing table (kept here so we never have to touch
// or guess at routes/services.js).
const SERVICE_PRICES = {
    Electrician: 249,
    Plumber: 279,
    Carpenter: 349,
    Painter: 319,
    Cleaner: 249,
    Driver: 449,
    Caregiver: 399,
    Technician: 299
};
const DEFAULT_PRICE = 299;

// =========================
// GET / CREATE BOOKINGS
// =========================
async function bookingsRoute(req, res) {

    if (req.method === "GET") {

        const { phone, service, status, assignedWorkerId, workerId, workerPhone, lat, lng, radiusKm } = req.query;

        let query = `
            SELECT b.*,
                   w.name AS worker_name,
                   w.phone AS worker_phone,
                   w.skill AS worker_skill,
                   w.location AS worker_location,
                   w.latitude AS worker_lat,
                   w.longitude AS worker_lng
            FROM bookings b
            LEFT JOIN workers w ON b.assigned_worker_id = w.id
            WHERE 1=1
        `;
        const params = [];

        if (phone) { query += " AND b.customer_phone = ?"; params.push(phone); }
        if (service) { query += " AND b.service = ?"; params.push(service); }
        if (status) { query += " AND b.status = ?"; params.push(status); }
        if (assignedWorkerId) { query += " AND b.assigned_worker_id = ?"; params.push(assignedWorkerId); }

        query += " ORDER BY b.is_emergency DESC, b.id DESC";

        let bookings = await db.prepare(query).all(...params);

        // Location-aware filtering for workers looking at available jobs
        let workerLocation = null;
        if (workerId || workerPhone) {
            const wSql = workerId ? "SELECT * FROM workers WHERE id = ?" : "SELECT * FROM workers WHERE phone = ?";
            const wParam = workerId ? Number(workerId) : workerPhone;
            const wRow = await db.prepare(wSql).get(wParam);
            if (wRow && wRow.latitude && wRow.longitude) {
                workerLocation = { lat: Number(wRow.latitude), lng: Number(wRow.longitude), radiusKm: Number(radiusKm) || DEFAULT_WORKER_RADIUS_KM };
            }
        } else if (lat !== undefined && lng !== undefined && String(lat).trim() !== "" && String(lng).trim() !== "") {
            workerLocation = { lat: Number(lat), lng: Number(lng), radiusKm: Number(radiusKm) || DEFAULT_WORKER_RADIUS_KM };
        }

        // Process distance and worker-side customer radius filtering
        if (workerLocation && !isNaN(workerLocation.lat) && !isNaN(workerLocation.lng)) {
            const filteredBookings = [];
            for (const b of bookings) {
                let distKm = null;
                if (b.customer_lat && b.customer_lng) {
                    distKm = calculateHaversineDistance(workerLocation.lat, workerLocation.lng, b.customer_lat, b.customer_lng);
                }

                // If job is pending and distance is known, enforce worker service radius (default 20 km)
                // Emergency bookings allow expanded radius up to 50 km
                const maxAllowedRadius = b.is_emergency == 1 ? Math.max(workerLocation.radiusKm, 50) : workerLocation.radiusKm;
                
                if (b.status === "Pending") {
                    if (distKm !== null && distKm > maxAllowedRadius) {
                        continue; // Exclude jobs outside worker radius
                    }
                }

                const bWithDist = {
                    ...b,
                    distance_km: distKm,
                    distance_m: distKm !== null ? Math.round(distKm * 1000) : null,
                    distance_label: distKm !== null ? `${distKm} km away` : null
                };

                // Privacy protection: Mask customer phone if job is pending (not yet assigned to this worker)
                const isAssignedToThisWorker = assignedWorkerId && String(b.assigned_worker_id) === String(assignedWorkerId);
                if (b.status === "Pending" && !isAssignedToThisWorker) {
                    const rawPh = String(b.customer_phone || "");
                    bWithDist.customer_phone_masked = rawPh.length >= 10 
                        ? `+91 ${rawPh.slice(0, 2)}******${rawPh.slice(-2)}` 
                        : "Masked for Privacy";
                    // Only mask public phone on pending list
                    bWithDist.customer_phone = bWithDist.customer_phone_masked;
                }

                filteredBookings.push(bWithDist);
            }
            bookings = filteredBookings;
        } else {
            // Even without worker coords, calculate distance between assigned worker and customer if both exist
            bookings = bookings.map(b => {
                let distKm = null;
                if (b.customer_lat && b.customer_lng && b.worker_lat && b.worker_lng) {
                    distKm = calculateHaversineDistance(b.worker_lat, b.worker_lng, b.customer_lat, b.customer_lng);
                }
                return {
                    ...b,
                    distance_km: distKm,
                    distance_label: distKm !== null ? `${distKm} km away` : null
                };
            });
        }

        return res.json({ success: true, count: bookings.length, bookings });
    }

    if (req.method === "POST") {

        const {
            service, customerName, customerPhone, address,
            bookingDate, bookingTime, isEmergency, customerLat, customerLng, emergencyType
        } = req.body;

        if (!service || !customerName || !customerPhone || !address || !bookingDate || !bookingTime) {
            return res.status(400).json({ success: false, message: "All booking fields are required." });
        }

        const result = await db.prepare(`
            INSERT INTO bookings
            (service, customer_name, customer_phone, address, booking_date, booking_time, is_emergency, customer_lat, customer_lng, emergency_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            service, customerName, customerPhone, address, bookingDate, bookingTime,
            isEmergency ? 1 : 0,
            customerLat || null,
            customerLng || null,
            emergencyType || null
        );

        const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid);

        return res.status(201).json({ success: true, message: "Booking created successfully!", booking });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
}


// =========================
// WORKER ACCEPTS A PENDING BOOKING
// =========================
async function acceptBooking(req, res) {

    const bookingId = Number(req.params.id);
    const { workerId } = req.body;

    if (!workerId) {
        return res.status(400).json({ success: false, message: "workerId is required." });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Pending") {
        return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
    }

    await db.prepare("UPDATE bookings SET assigned_worker_id = ?, status = 'Assigned', dispatched_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(workerId, bookingId);

    const updated = await db.prepare(`
        SELECT b.*, w.name AS worker_name, w.phone AS worker_phone, w.skill AS worker_skill
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        WHERE b.id = ?
    `).get(bookingId);

    return res.json({ success: true, message: "Job accepted!", booking: updated });
}

// =========================
// WORKER STARTS AN ASSIGNED JOB
// =========================
async function startBooking(req, res) {
    const bookingId = Number(req.params.id);
    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Assigned") {
        return res.status(400).json({ success: false, message: `Only assigned bookings can be started. Current status: ${booking.status}.` });
    }

    await db.prepare("UPDATE bookings SET status = 'In Progress' WHERE id = ?").run(bookingId);

    const updated = await db.prepare(`
        SELECT b.*, w.name AS worker_name, w.phone AS worker_phone, w.skill AS worker_skill
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        WHERE b.id = ?
    `).get(bookingId);

    return res.json({ success: true, message: "Job started and marked In Progress.", booking: updated });
}

// =========================
// CUSTOMER OR ADMIN CANCELS A BOOKING
// =========================
async function cancelBooking(req, res) {
    const bookingId = Number(req.params.id);
    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status === "Completed") {
        return res.status(400).json({ success: false, message: "Completed bookings cannot be cancelled." });
    }

    if (booking.status === "Cancelled") {
        return res.status(400).json({ success: false, message: "Booking is already cancelled." });
    }

    await db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(bookingId);

    const updated = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ success: true, message: "Booking cancelled successfully.", booking: updated });
}

// =========================
// MARK A BOOKING COMPLETE + AUTO-GENERATE INVOICE
// =========================
async function completeBooking(req, res) {

    const bookingId = Number(req.params.id);

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status === "Completed") {
        return res.status(400).json({ success: false, message: "Booking is already completed." });
    }

    await db.prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?").run(bookingId);

    let invoice = await db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);

    if (!invoice) {
        // Dynamic price lookup from services table (supports demand multiplier & scarcity bonus)
        let basePrice = SERVICE_PRICES[booking.service] || DEFAULT_PRICE;
        try {
            const serviceRow = await db.prepare("SELECT * FROM services WHERE LOWER(name) = LOWER(?)").get(booking.service);
            if (serviceRow) {
                const mult = Number(serviceRow.demand_multiplier) || 1.0;
                const bonus = serviceRow.is_high_demand ? (Number(serviceRow.scarcity_bonus) || 0) : 0;
                basePrice = Math.round((Number(serviceRow.base_price) * mult) + bonus);
            }
        } catch (e) {
            console.warn("Service price dynamic lookup fallback:", e.message);
        }

        const pricing = calculatePricingBreakdown(basePrice, booking.is_emergency == 1);
        const serviceCharge = pricing.totalAmount;
        const cooperativeShare = pricing.cooperativeShare;
        const workerEarning = pricing.workerEarning;

        const result = await db.prepare(`
            INSERT INTO invoices (booking_id, service_charge, cooperative_share, worker_earning, total_amount)
            VALUES (?, ?, ?, ?, ?)
        `).run(bookingId, serviceCharge, cooperativeShare, workerEarning, serviceCharge);

        invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(result.lastInsertRowid);
    }

    const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ success: true, message: "Booking marked complete.", booking: updatedBooking, invoice });
}


module.exports = {
    bookingsRoute,
    acceptBooking,
    startBooking,
    completeBooking,
    cancelBooking,
    SERVICE_PRICES,
    DEFAULT_PRICE
};
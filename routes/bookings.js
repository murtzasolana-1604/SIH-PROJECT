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
                   w.longitude AS worker_lng,
                   w.profile_photo AS worker_photo,
                   w.verified AS worker_verified,
                   COALESCE((SELECT ROUND(CAST(AVG(stars) AS numeric), 1) FROM ratings WHERE worker_id = w.id), 4.8) AS worker_avg_rating
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

        // Authorization context for location privacy
        const reqWorkerId = Number(assignedWorkerId || workerId || req.headers["x-worker-id"]);
        const reqCustomerPhone = String(phone || "").trim();
        const isAdmin = Boolean(req.headers.authorization && req.headers.authorization.includes("Bearer"));

        // Helper to enforce customer privacy
        function sanitizeBookingPrivacy(b) {
            const isCustomerOwner = reqCustomerPhone && String(b.customer_phone).trim() === reqCustomerPhone;
            const isAssignedWorkerActive = reqWorkerId && Number(b.assigned_worker_id) === reqWorkerId && ['Assigned', 'Confirmed', 'In Progress', 'In_Progress'].includes(b.status);

            if (isAdmin || isCustomerOwner || isAssignedWorkerActive) {
                return b; // Authorized to view customer details & coordinates
            }

            // Unassigned / public / pending caller: Mask phone and coordinates
            const rawPh = String(b.customer_phone || "");
            const masked = rawPh.length >= 10 ? `+91 ${rawPh.slice(0, 2)}******${rawPh.slice(-2)}` : "Masked for Privacy";
            return {
                ...b,
                customer_phone: masked,
                customer_phone_masked: masked,
                customer_lat: null,
                customer_lng: null
            };
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

                filteredBookings.push(sanitizeBookingPrivacy(bWithDist));
            }
            bookings = filteredBookings;
        } else {
            // Even without worker coords, calculate distance between assigned worker and customer if both exist
            bookings = bookings.map(b => {
                let distKm = null;
                if (b.customer_lat && b.customer_lng && b.worker_lat && b.worker_lng) {
                    distKm = calculateHaversineDistance(b.worker_lat, b.worker_lng, b.customer_lat, b.customer_lng);
                }
                const bWithDist = {
                    ...b,
                    distance_km: distKm,
                    distance_label: distKm !== null ? `${distKm} km away` : null
                };
                return sanitizeBookingPrivacy(bWithDist);
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
    const { workerId, expectedArrival } = req.body;

    if (!workerId) {
        return res.status(400).json({ success: false, message: "workerId is required." });
    }

    const numWorkerId = Number(workerId);

    // CRITICAL BUSINESS RULE: A worker can have ONLY ONE ACTIVE BOOKING at a time.
    // Concurrency-safe check across all active booking states
    const activeBooking = await db.prepare(`
        SELECT id, service, status, customer_name, booking_date, booking_time 
        FROM bookings 
        WHERE assigned_worker_id = ? 
          AND status IN ('Assigned', 'Confirmed', 'In Progress', 'In_Progress')
        LIMIT 1
    `).get(numWorkerId);

    if (activeBooking) {
        return res.status(400).json({
            success: false,
            message: "Worker already has an active booking. Complete or cancel the current booking before accepting another job.",
            activeBookingId: activeBooking.id,
            activeBookingStatus: activeBooking.status
        });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Pending") {
        return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
    }

    // Determine expected arrival
    let arrivalStr = (expectedArrival || "").trim();
    if (!arrivalStr) {
        const targetMins = Number(booking.target_response_mins) || 35;
        const arrDate = new Date(Date.now() + targetMins * 60 * 1000);
        let hrs = arrDate.getHours();
        const mins = String(arrDate.getMinutes()).padStart(2, "0");
        const ampm = hrs >= 12 ? "PM" : "AM";
        hrs = hrs % 12 || 12;
        arrivalStr = `${hrs}:${mins} ${ampm} (Estimated arrival)`;
    }

    // Concurrency-safe atomic conditional update on pending status AND worker has no active booking
    const updateResult = await db.prepare(`
        UPDATE bookings 
        SET assigned_worker_id = ?, 
            status = 'Assigned', 
            dispatched_at = CURRENT_TIMESTAMP,
            expected_arrival = ?
        WHERE id = ? 
          AND status = 'Pending'
          AND NOT EXISTS (
              SELECT 1 FROM bookings b2 
              WHERE b2.assigned_worker_id = ? 
                AND b2.status IN ('Assigned', 'Confirmed', 'In Progress', 'In_Progress')
          )
    `).run(numWorkerId, arrivalStr, bookingId, numWorkerId);

    if (!updateResult || updateResult.changes === 0) {
        const concurrentActive = await db.prepare(`
            SELECT id, status FROM bookings 
            WHERE assigned_worker_id = ? AND status IN ('Assigned', 'Confirmed', 'In Progress', 'In_Progress')
            LIMIT 1
        `).get(numWorkerId);

        if (concurrentActive) {
            return res.status(400).json({
                success: false,
                message: "Worker already has an active booking. Complete or cancel the current booking before accepting another job.",
                activeBookingId: concurrentActive.id,
                activeBookingStatus: concurrentActive.status
            });
        }

        return res.status(400).json({
            success: false,
            message: "Booking is no longer pending or has already been accepted."
        });
    }

    // Set worker is_available = 0 (Busy)
    await db.prepare("UPDATE workers SET is_available = 0 WHERE id = ?").run(numWorkerId);

    const updated = await db.prepare(`
        SELECT b.*, w.name AS worker_name, w.phone AS worker_phone, w.skill AS worker_skill, w.profile_photo AS worker_photo, w.verified AS worker_verified,
               COALESCE((SELECT ROUND(CAST(AVG(stars) AS numeric), 1) FROM ratings WHERE worker_id = w.id), 4.8) AS worker_avg_rating
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        WHERE b.id = ?
    `).get(bookingId);

    // Send or prepare WhatsApp confirmation
    let whatsappNotification = null;
    try {
        const notificationService = require("../services/notificationService");
        whatsappNotification = await notificationService.sendBookingConfirmation({
            bookingId: updated.id,
            service: updated.service,
            customerName: updated.customer_name,
            customerPhone: updated.customer_phone,
            workerName: updated.worker_name,
            workerPhone: updated.worker_phone,
            expectedArrival: updated.expected_arrival,
            address: updated.address
        });
    } catch (waErr) {
        console.warn("[WhatsApp Notification Warning]:", waErr.message);
    }

    return res.json({ 
        success: true, 
        message: "Job accepted!", 
        booking: updated,
        expectedArrival: arrivalStr,
        whatsappNotification 
    });
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
        SELECT b.*, w.name AS worker_name, w.phone AS worker_phone, w.skill AS worker_skill, w.profile_photo AS worker_photo
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

    // Free the worker if one was assigned and has no other active jobs
    if (booking.assigned_worker_id) {
        const remainingActive = await db.prepare(`
            SELECT COUNT(*) AS count 
            FROM bookings 
            WHERE assigned_worker_id = ? 
              AND status IN ('Assigned', 'Confirmed', 'In Progress', 'In_Progress')
              AND id != ?
        `).get(booking.assigned_worker_id, bookingId);

        if (!remainingActive || Number(remainingActive.count) === 0) {
            await db.prepare("UPDATE workers SET is_available = 1 WHERE id = ?").run(booking.assigned_worker_id);
        }
    }

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

    // Free the worker so they become AVAILABLE again!
    if (booking.assigned_worker_id) {
        const remainingActive = await db.prepare(`
            SELECT COUNT(*) AS count 
            FROM bookings 
            WHERE assigned_worker_id = ? 
              AND status IN ('Assigned', 'Confirmed', 'In Progress', 'In_Progress')
              AND id != ?
        `).get(booking.assigned_worker_id, bookingId);

        if (!remainingActive || Number(remainingActive.count) === 0) {
            await db.prepare("UPDATE workers SET is_available = 1 WHERE id = ?").run(booking.assigned_worker_id);
        }
    }

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
            INSERT INTO invoices (booking_id, service_charge, cooperative_share, worker_earning, tip_amount, total_amount)
            VALUES (?, ?, ?, ?, 0, ?)
        `).run(bookingId, serviceCharge, cooperativeShare, workerEarning, serviceCharge);

        invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(result.lastInsertRowid);
    }

    const updatedBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ success: true, message: "Booking marked complete.", booking: updatedBooking, invoice });
}

// =========================
// GET CUSTOMER EXACT LOCATION (ASSIGNED WORKER ONLY)
// =========================
async function getCustomerLocation(req, res) {
    const bookingId = Number(req.params.id);
    const workerId = Number(req.query.workerId || req.headers["x-worker-id"]);

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Privacy security check: Only the worker assigned to this confirmed/in-progress booking can view customer location
    if (!workerId || Number(booking.assigned_worker_id) !== workerId) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Precise customer coordinates are restricted strictly to the assigned worker."
        });
    }

    if (!["Assigned", "Confirmed", "In Progress", "In_Progress"].includes(booking.status)) {
        return res.status(403).json({
            success: false,
            message: `Customer location navigation is only accessible during active service delivery. Current status: ${booking.status}.`
        });
    }

    const lat = booking.customer_lat;
    const lng = booking.customer_lng;

    if (lat === null || lat === undefined || lng === null || lng === undefined || (Number(lat) === 0 && Number(lng) === 0)) {
        return res.json({
            success: true,
            coordinatesAvailable: false,
            customerName: booking.customer_name,
            address: booking.address,
            message: "Customer location coordinates are unavailable for this booking.",
            googleMapsUrl: null
        });
    }

    // Dynamic Google Maps Directions URL
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;

    return res.json({
        success: true,
        coordinatesAvailable: true,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        address: booking.address,
        customerLat: lat,
        customerLng: lng,
        googleMapsUrl,
        expectedArrival: booking.expected_arrival
    });
}

// =========================
// UPDATE EXPECTED ARRIVAL TIME
// =========================
async function updateExpectedArrival(req, res) {
    const bookingId = Number(req.params.id);
    const { workerId, expectedArrival } = req.body;

    if (!expectedArrival || typeof expectedArrival !== "string") {
        return res.status(400).json({ success: false, message: "expectedArrival string is required." });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (workerId && Number(booking.assigned_worker_id) !== Number(workerId)) {
        return res.status(403).json({ success: false, message: "Only the assigned worker can update expected arrival." });
    }

    await db.prepare("UPDATE bookings SET expected_arrival = ? WHERE id = ?").run(expectedArrival.trim(), bookingId);
    const updated = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ 
        success: true, 
        message: "Expected arrival updated.", 
        expectedArrival: updated.expected_arrival, 
        booking: updated 
    });
}

module.exports = {
    bookingsRoute,
    acceptBooking,
    startBooking,
    completeBooking,
    cancelBooking,
    getCustomerLocation,
    updateExpectedArrival,
    SERVICE_PRICES,
    DEFAULT_PRICE
};
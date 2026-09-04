const db = require("../database");

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
function bookingsRoute(req, res) {

    if (req.method === "GET") {

        const { phone, service, status, assignedWorkerId } = req.query;

        let query = `
            SELECT b.*,
                   w.name AS worker_name,
                   w.phone AS worker_phone,
                   w.skill AS worker_skill,
                   w.location AS worker_location
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

        const bookings = db.prepare(query).all(...params);

        return res.json({ success: true, bookings });
    }

    if (req.method === "POST") {

        const {
            service, customerName, customerPhone, address,
            bookingDate, bookingTime, isEmergency, customerLat, customerLng, emergencyType
        } = req.body;

        if (!service || !customerName || !customerPhone || !address || !bookingDate || !bookingTime) {
            return res.status(400).json({ success: false, message: "All booking fields are required." });
        }

        const result = db.prepare(`
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

        const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid);

        return res.status(201).json({ success: true, message: "Booking created successfully!", booking });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
}

// =========================
// WORKER ACCEPTS A PENDING BOOKING
// =========================
function acceptBooking(req, res) {

    const bookingId = Number(req.params.id);
    const { workerId } = req.body;

    if (!workerId) {
        return res.status(400).json({ success: false, message: "workerId is required." });
    }

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Pending") {
        return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });
    }

    db.prepare("UPDATE bookings SET assigned_worker_id = ?, status = 'Assigned', dispatched_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(workerId, bookingId);

    const updated = db.prepare(`
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
function startBooking(req, res) {
    const bookingId = Number(req.params.id);
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Assigned") {
        return res.status(400).json({ success: false, message: `Only assigned bookings can be started. Current status: ${booking.status}.` });
    }

    db.prepare("UPDATE bookings SET status = 'In Progress' WHERE id = ?").run(bookingId);

    const updated = db.prepare(`
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
function cancelBooking(req, res) {
    const bookingId = Number(req.params.id);
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status === "Completed") {
        return res.status(400).json({ success: false, message: "Completed bookings cannot be cancelled." });
    }

    if (booking.status === "Cancelled") {
        return res.status(400).json({ success: false, message: "Booking is already cancelled." });
    }

    db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(bookingId);

    const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ success: true, message: "Booking cancelled successfully.", booking: updated });
}

// =========================
// MARK A BOOKING COMPLETE + AUTO-GENERATE INVOICE
// =========================
function completeBooking(req, res) {

    const bookingId = Number(req.params.id);

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status === "Completed") {
        return res.status(400).json({ success: false, message: "Booking is already completed." });
    }

    db.prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?").run(bookingId);

    let invoice = db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);

    if (!invoice) {
        // Dynamic price lookup from services table (supports demand multiplier & scarcity bonus)
        let basePrice = SERVICE_PRICES[booking.service] || DEFAULT_PRICE;
        try {
            const serviceRow = db.prepare("SELECT * FROM services WHERE name = ? COLLATE NOCASE").get(booking.service);
            if (serviceRow) {
                const mult = Number(serviceRow.demand_multiplier) || 1.0;
                const bonus = serviceRow.is_high_demand ? (Number(serviceRow.scarcity_bonus) || 0) : 0;
                basePrice = Math.round((Number(serviceRow.base_price) * mult) + bonus);
            }
        } catch (e) {
            console.warn("Service price dynamic lookup fallback:", e.message);
        }

        const emergencySurcharge = (booking.is_emergency == 1) ? 50 : 0;
        const serviceCharge = basePrice + emergencySurcharge;
        const cooperativeShare = Math.round(serviceCharge * 0.15 * 100) / 100;
        const workerEarning = Math.round((serviceCharge - cooperativeShare) * 100) / 100;

        const result = db.prepare(`
            INSERT INTO invoices (booking_id, service_charge, cooperative_share, worker_earning, total_amount)
            VALUES (?, ?, ?, ?, ?)
        `).run(bookingId, serviceCharge, cooperativeShare, workerEarning, serviceCharge);

        invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(result.lastInsertRowid);
    }

    const updatedBooking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

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
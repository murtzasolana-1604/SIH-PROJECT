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

        let query = "SELECT * FROM bookings WHERE 1=1";
        const params = [];

        if (phone) { query += " AND customer_phone = ?"; params.push(phone); }
        if (service) { query += " AND service = ?"; params.push(service); }
        if (status) { query += " AND status = ?"; params.push(status); }
        if (assignedWorkerId) { query += " AND assigned_worker_id = ?"; params.push(assignedWorkerId); }

        query += " ORDER BY is_emergency DESC, id DESC";

        const bookings = db.prepare(query).all(...params);

        return res.json({ success: true, bookings });
    }

    if (req.method === "POST") {

        const {
            service, customerName, customerPhone, address,
            bookingDate, bookingTime, isEmergency, customerLat, customerLng
        } = req.body;

        if (!service || !customerName || !customerPhone || !address || !bookingDate || !bookingTime) {
            return res.status(400).json({ success: false, message: "All booking fields are required." });
        }

        const result = db.prepare(`
            INSERT INTO bookings
            (service, customer_name, customer_phone, address, booking_date, booking_time, is_emergency, customer_lat, customer_lng)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            service, customerName, customerPhone, address, bookingDate, bookingTime,
            isEmergency ? 1 : 0,
            customerLat || null,
            customerLng || null
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

    db.prepare("UPDATE bookings SET assigned_worker_id = ?, status = 'Assigned' WHERE id = ?")
        .run(workerId, bookingId);

    const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ success: true, message: "Job accepted!", booking: updated });
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
        const serviceCharge = SERVICE_PRICES[booking.service] || DEFAULT_PRICE;
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

module.exports = { bookingsRoute, acceptBooking, completeBooking };
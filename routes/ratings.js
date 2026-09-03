const db = require("../database");

function addRating(req, res) {

    const { bookingId, stars, comment } = req.body;

    if (!bookingId || !stars || stars < 1 || stars > 5) {
        return res.status(400).json({ success: false, message: "bookingId and stars (1-5) are required." });
    }

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Completed") {
        return res.status(400).json({ success: false, message: "You can only rate a completed booking." });
    }

    if (!booking.assigned_worker_id) {
        return res.status(400).json({ success: false, message: "This booking has no assigned worker to rate." });
    }

    const existing = db.prepare("SELECT * FROM ratings WHERE booking_id = ?").get(bookingId);
    if (existing) {
        return res.status(400).json({ success: false, message: "This booking has already been rated." });
    }

    db.prepare("INSERT INTO ratings (booking_id, worker_id, stars, comment) VALUES (?, ?, ?, ?)")
        .run(bookingId, booking.assigned_worker_id, stars, comment || "");

    return res.status(201).json({ success: true, message: "Thank you for your rating!" });
}

function getRatings(req, res) {

    const { workerId } = req.query;

    if (workerId) {
        const ratings = db.prepare("SELECT * FROM ratings WHERE worker_id = ? ORDER BY id DESC").all(workerId);
        const avgRow = db.prepare("SELECT AVG(stars) AS avg, COUNT(*) AS count FROM ratings WHERE worker_id = ?").get(workerId);

        return res.json({
            success: true,
            average: avgRow.avg ? Math.round(avgRow.avg * 10) / 10 : null,
            count: avgRow.count,
            ratings
        });
    }

    const ratings = db.prepare("SELECT * FROM ratings ORDER BY id DESC").all();
    return res.json({ success: true, ratings });
}

module.exports = { addRating, getRatings };
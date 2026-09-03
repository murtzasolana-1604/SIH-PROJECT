const db = require("../database");

// =========================
// DASHBOARD STATS
// =========================
function getStats(req, res) {

    const totalWorkers = db.prepare("SELECT COUNT(*) AS c FROM workers").get().c;
    const verifiedWorkers = db.prepare("SELECT COUNT(*) AS c FROM workers WHERE verified = 1").get().c;
    const totalCustomers = db.prepare("SELECT COUNT(DISTINCT customer_phone) AS c FROM bookings").get().c;
    const totalBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings").get().c;
    const pendingBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'Pending'").get().c;
    const completedBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'Completed'").get().c;

    return res.json({
        success: true,
        stats: {
            totalWorkers, verifiedWorkers, totalCustomers,
            totalBookings, pendingBookings, completedBookings
        }
    });
}

// =========================
// ALL WORKERS (for verify/reject screen)
// =========================
function getAllWorkers(req, res) {
    const workers = db.prepare("SELECT * FROM workers ORDER BY verified ASC, id DESC").all();
    return res.json({ success: true, workers });
}

// =========================
// APPROVE / REJECT A WORKER
// =========================
function verifyWorker(req, res) {

    const { workerId, action } = req.body;

    if (!workerId || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ success: false, message: "workerId and a valid action are required." });
    }

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);

    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    if (action === "approve") {
        db.prepare("UPDATE workers SET verified = 1 WHERE id = ?").run(workerId);
        const updated = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
        return res.json({ success: true, message: "Worker approved.", worker: updated });
    }

    db.prepare("DELETE FROM workers WHERE id = ?").run(workerId);
    return res.json({ success: true, message: "Worker application rejected and removed." });
}

// =========================
// ADMIN MANUALLY ASSIGNS A WORKER TO A BOOKING
// =========================
function assignWorker(req, res) {

    const { bookingId, workerId } = req.body;

    if (!bookingId || !workerId) {
        return res.status(400).json({ success: false, message: "bookingId and workerId are required." });
    }

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    db.prepare("UPDATE bookings SET assigned_worker_id = ?, status = 'Assigned' WHERE id = ?")
        .run(workerId, bookingId);

    const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.json({ success: true, message: "Worker assigned.", booking: updated });
}

// =========================
// RULE-BASED WORKER MATCHING — NOT machine learning.
// Scores verified + rating + location text match + current workload.
// =========================
function matchWorkers(req, res) {

    const bookingId = Number(req.params.bookingId);

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const candidates = db.prepare("SELECT * FROM workers WHERE skill = ?").all(booking.service);

    const scored = candidates.map(worker => {

        let score = 0;
        const reasons = [];

        if (worker.verified) { score += 50; reasons.push("Verified (+50)"); }

        const avgRatingRow = db.prepare(`
            SELECT AVG(r.stars) AS avg
            FROM ratings r
            JOIN bookings b ON b.id = r.booking_id
            WHERE b.assigned_worker_id = ?
        `).get(worker.id);

        const avgRating = avgRatingRow.avg || 5;
        score += avgRating * 10;
        reasons.push(`Rating ${avgRating.toFixed(1)} (+${(avgRating * 10).toFixed(0)})`);

        if (
            worker.location &&
            booking.address &&
            booking.address.toLowerCase().includes(worker.location.toLowerCase())
        ) {
            score += 20;
            reasons.push("Location matches address (+20)");
        }

        const activeJobs = db.prepare(`
            SELECT COUNT(*) AS c FROM bookings
            WHERE assigned_worker_id = ? AND status = 'Assigned'
        `).get(worker.id).c;

        score -= activeJobs * 10;
        if (activeJobs > 0) reasons.push(`Already has ${activeJobs} active job(s) (-${activeJobs * 10})`);

        return { ...worker, matchScore: Math.round(score), reasons };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
        success: true,
        note: "Rule-based scoring (verification + rating + location + current load) — not machine learning.",
        matches: scored
    });
}

module.exports = { getStats, getAllWorkers, verifyWorker, assignWorker, matchWorkers };
const db = require("../database");

// Helper: Anonymize customer name for public trust & privacy (e.g., "Ramesh Sharma" -> "Ramesh S.")
function anonymizeName(fullName) {
    if (!fullName) return "Verified Customer";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

// Helper: Format rating object with parsed tags & anonymized customer
function formatRatingRow(row) {
    let parsedTags = [];
    if (row.tags) {
        try {
            parsedTags = Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags);
        } catch (e) {
            parsedTags = String(row.tags).split(",").map(t => t.trim()).filter(Boolean);
        }
    }

    return {
        id: row.id,
        booking_id: row.booking_id,
        worker_id: row.worker_id,
        worker_name: row.worker_name,
        customer_name: anonymizeName(row.customer_name),
        service: row.service,
        stars: row.stars,
        comment: row.comment || "",
        tags: parsedTags,
        created_at: row.created_at
    };
}

// =========================
// SUBMIT RATING & REVIEWS
// =========================
function addRating(req, res) {
    const { bookingId, workerId, stars, comment, tags } = req.body;

    const numStars = Number(stars);
    if (!bookingId || isNaN(numStars) || numStars < 1 || numStars > 5) {
        return res.status(400).json({ success: false, message: "bookingId and a star rating between 1 and 5 are required." });
    }

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Completed") {
        return res.status(400).json({ success: false, message: "You can only rate a completed cooperative booking." });
    }

    const targetWorkerId = workerId ? Number(workerId) : booking.assigned_worker_id;
    if (!targetWorkerId) {
        return res.status(400).json({ success: false, message: "This booking has no assigned worker to rate." });
    }

    const existing = db.prepare("SELECT * FROM ratings WHERE booking_id = ?").get(bookingId);
    if (existing) {
        return res.status(409).json({ success: false, message: "This booking has already been rated." });
    }

    let tagsStr = "";
    if (Array.isArray(tags)) {
        tagsStr = JSON.stringify(tags);
    } else if (typeof tags === "string") {
        tagsStr = tags.trim();
    }

    const result = db.prepare(`
        INSERT INTO ratings (booking_id, worker_id, stars, comment, tags)
        VALUES (?, ?, ?, ?, ?)
    `).run(bookingId, targetWorkerId, numStars, (comment || "").trim(), tagsStr);

    const created = db.prepare(`
        SELECT r.*, b.customer_name, b.service, w.name AS worker_name
        FROM ratings r
        LEFT JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN workers w ON r.worker_id = w.id
        WHERE r.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
        success: true,
        message: "Thank you! Your cooperative feedback has been verified and recorded.",
        rating: formatRatingRow(created)
    });
}

// =========================
// GET RATINGS & BREAKDOWNS
// =========================
function getRatings(req, res) {
    const { workerId, bookingId, limit } = req.query;

    // 1. Single booking rating check
    if (bookingId) {
        const rating = db.prepare(`
            SELECT r.*, b.customer_name, b.service, w.name AS worker_name
            FROM ratings r
            LEFT JOIN bookings b ON r.booking_id = b.id
            LEFT JOIN workers w ON r.worker_id = w.id
            WHERE r.booking_id = ?
        `).get(Number(bookingId));

        if (rating) {
            return res.json({
                success: true,
                rated: true,
                rating: formatRatingRow(rating)
            });
        }
        return res.json({ success: true, rated: false });
    }

    // 2. Specific worker ratings & distribution
    if (workerId) {
        const id = Number(workerId);
        const rows = db.prepare(`
            SELECT r.*, b.customer_name, b.service, w.name AS worker_name
            FROM ratings r
            LEFT JOIN bookings b ON r.booking_id = b.id
            LEFT JOIN workers w ON r.worker_id = w.id
            WHERE r.worker_id = ?
            ORDER BY r.id DESC
        `).all(id);

        const avgRow = db.prepare(`
            SELECT AVG(stars) AS avg, COUNT(*) AS count
            FROM ratings
            WHERE worker_id = ?
        `).get(id);

        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        rows.forEach(r => {
            if (breakdown[r.stars] !== undefined) {
                breakdown[r.stars]++;
            }
        });

        return res.json({
            success: true,
            average: avgRow.avg ? Math.round(avgRow.avg * 10) / 10 : null,
            count: avgRow.count,
            breakdown,
            ratings: rows.map(formatRatingRow)
        });
    }

    // 3. Platform-wide latest reviews
    const max = Math.min(Number(limit) || 20, 100);
    const allRows = db.prepare(`
        SELECT r.*, b.customer_name, b.service, w.name AS worker_name
        FROM ratings r
        LEFT JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN workers w ON r.worker_id = w.id
        ORDER BY r.id DESC
        LIMIT ?
    `).all(max);

    return res.json({
        success: true,
        ratings: allRows.map(formatRatingRow)
    });
}

module.exports = { addRating, getRatings };
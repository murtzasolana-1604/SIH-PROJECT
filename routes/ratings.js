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
async function addRating(req, res) {
    const { bookingId, workerId, stars, comment, tags } = req.body;

    const numStars = Number(stars);
    if (!bookingId || isNaN(numStars) || numStars < 1 || numStars > 5) {
        return res.status(400).json({ success: false, message: "bookingId and a star rating between 1 and 5 are required." });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
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

    const existing = await db.prepare("SELECT * FROM ratings WHERE booking_id = ?").get(bookingId);
    if (existing) {
        return res.status(409).json({ success: false, message: "This booking has already been rated." });
    }

    let tagsStr = "";
    if (Array.isArray(tags)) {
        tagsStr = JSON.stringify(tags);
    } else if (typeof tags === "string") {
        tagsStr = tags.trim();
    }

    const result = await db.prepare(`
        INSERT INTO ratings (booking_id, worker_id, stars, comment, tags)
        VALUES (?, ?, ?, ?, ?)
    `).run(bookingId, targetWorkerId, numStars, (comment || "").trim(), tagsStr);

    // Synchronize onto bookings table for unified two-way record
    try {
        await db.prepare(`
            UPDATE bookings 
            SET customer_rating = ?, customer_feedback = ?, customer_tags = ? 
            WHERE id = ?
        `).run(numStars, (comment || "").trim(), tagsStr, bookingId);
    } catch (e) {
        console.warn("Sync rating to booking warning:", e.message);
    }

    const created = await db.prepare(`
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

// ============================================
// WORKER RATES CUSTOMER (TWO-WAY FEEDBACK)
// ============================================
async function addCustomerRating(req, res) {
    const { bookingId, workerId, stars, comment, tags } = req.body;

    const numStars = Number(stars);
    if (!bookingId || isNaN(numStars) || numStars < 1 || numStars > 5) {
        return res.status(400).json({ success: false, message: "bookingId and a star rating between 1 and 5 are required." });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Completed") {
        return res.status(400).json({ success: false, message: "You can only rate a customer after the job is Completed." });
    }

    if (workerId && Number(booking.assigned_worker_id) !== Number(workerId)) {
        return res.status(403).json({ success: false, message: "Only the worker assigned to this booking can rate the customer." });
    }

    if (booking.worker_rating) {
        return res.status(409).json({ success: false, message: "Customer has already been rated for this booking." });
    }

    let tagsStr = "";
    if (Array.isArray(tags)) {
        tagsStr = JSON.stringify(tags);
    } else if (typeof tags === "string") {
        tagsStr = tags.trim();
    }

    await db.prepare(`
        UPDATE bookings
        SET worker_rating = ?,
            worker_feedback = ?,
            worker_tags = ?,
            worker_rated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(numStars, (comment || "").trim(), tagsStr, bookingId);

    const updated = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);

    return res.status(201).json({
        success: true,
        message: "Thank you! Your feedback for the customer has been recorded.",
        customerRating: {
            bookingId: updated.id,
            customerName: anonymizeName(updated.customer_name),
            stars: updated.worker_rating,
            comment: updated.worker_feedback,
            tags: tagsStr,
            ratedAt: updated.worker_rated_at
        }
    });
}

// ============================================
// GET CUSTOMER RATING SUMMARY & STATS
// ============================================
async function getCustomerRatingsSummary(req, res) {
    const phone = req.query.phone || req.query.customerPhone;

    if (!phone) {
        return res.status(400).json({ success: false, message: "phone parameter is required." });
    }

    const rows = await db.prepare(`
        SELECT worker_rating, worker_feedback, worker_tags, worker_rated_at, booking_date, service
        FROM bookings
        WHERE customer_phone = ? AND worker_rating IS NOT NULL
        ORDER BY id DESC
    `).all(phone);

    const totalBookingsRow = await db.prepare(`
        SELECT COUNT(*) AS count FROM bookings WHERE customer_phone = ? AND status = 'Completed'
    `).get(phone);

    const completedBookings = totalBookingsRow ? totalBookingsRow.count : 0;

    if (rows.length === 0) {
        return res.json({
            success: true,
            hasRatings: false,
            customerPhone: phone,
            completedBookings,
            summary: {
                avgRating: 5.0,
                ratingCount: 0,
                completedBookings,
                recentFeedback: []
            }
        });
    }

    const totalStars = rows.reduce((sum, r) => sum + Number(r.worker_rating), 0);
    const avgRating = Math.round((totalStars / rows.length) * 10) / 10;

    const recentFeedback = rows.slice(0, 5).map(r => {
        let parsedTags = [];
        if (r.worker_tags) {
            try {
                parsedTags = r.worker_tags.startsWith("[") ? JSON.parse(r.worker_tags) : r.worker_tags.split(",");
            } catch (e) {
                parsedTags = [r.worker_tags];
            }
        }
        return {
            stars: r.worker_rating,
            comment: r.worker_feedback || "Cooperative customer",
            tags: parsedTags,
            date: r.booking_date
        };
    });

    return res.json({
        success: true,
        hasRatings: true,
        customerPhone: phone,
        summary: {
            avgRating,
            ratingCount: rows.length,
            completedBookings,
            ratingLabel: `⭐ ${avgRating} • Cooperative Customer`,
            recentFeedback
        }
    });
}

// =========================
// GET RATINGS & BREAKDOWNS
// =========================
async function getRatings(req, res) {
    const { workerId, bookingId, limit } = req.query;

    // 1. Single booking rating check
    if (bookingId) {
        const rating = await db.prepare(`
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
        return res.json({ success: true, rated: false, message: "No review submitted yet." });
    }

    // 2. Specific worker ratings & distribution
    if (workerId) {
        const rows = await db.prepare(`
            SELECT r.*, b.customer_name, b.service, w.name AS worker_name
            FROM ratings r
            LEFT JOIN bookings b ON r.booking_id = b.id
            LEFT JOIN workers w ON r.worker_id = w.id
            WHERE r.worker_id = ?
            ORDER BY r.id DESC
        `).all(Number(workerId));

        const avgRow = await db.prepare(`
            SELECT AVG(stars) AS avg, COUNT(*) AS count
            FROM ratings
            WHERE worker_id = ?
        `).get(Number(workerId));

        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
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
    const allRows = await db.prepare(`
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


module.exports = { 
    addRating, 
    getRatings, 
    addCustomerRating, 
    getCustomerRatingsSummary 
};
const db = require("../database");

// =========================
// DASHBOARD STATS & COOPERATIVE METRICS
// =========================
function getStats(req, res) {
    const totalWorkers = db.prepare("SELECT COUNT(*) AS c FROM workers").get().c;
    const verifiedWorkers = db.prepare("SELECT COUNT(*) AS c FROM workers WHERE verified = 1").get().c;
    const pendingWorkers = db.prepare("SELECT COUNT(*) AS c FROM workers WHERE verified = 0").get().c;
    const availableWorkers = db.prepare("SELECT COUNT(*) AS c FROM workers WHERE is_available = 1").get().c;

    const totalCustomers = db.prepare("SELECT COUNT(DISTINCT customer_phone) AS c FROM bookings").get().c;
    const totalBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings").get().c;
    const pendingBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'Pending'").get().c;
    const inProgressBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'In Progress'").get().c;
    const completedBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'Completed'").get().c;
    const emergencyBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE is_emergency = 1").get().c;

    // Financial & Welfare aggregates from invoices
    const financial = db.prepare(`
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_gmv,
            COALESCE(SUM(cooperative_share), 0) AS total_welfare,
            COALESCE(SUM(worker_earning), 0) AS total_worker_payout
        FROM invoices
    `).get();

    return res.json({
        success: true,
        stats: {
            totalWorkers,
            verifiedWorkers,
            pendingWorkers,
            availableWorkers,
            totalCustomers,
            totalBookings,
            pendingBookings,
            inProgressBookings,
            completedBookings,
            emergencyBookings,
            totalGMV: Math.round(financial.total_gmv * 100) / 100,
            totalWelfareFund: Math.round(financial.total_welfare * 100) / 100,
            totalWorkerPayout: Math.round(financial.total_worker_payout * 100) / 100
        }
    });
}

// =========================
// ALL WORKERS (with rating & job metrics)
// =========================
function getAllWorkers(req, res) {
    const workers = db.prepare(`
        SELECT w.*,
               s.name AS society_name,
               s.reg_number AS society_reg_number,
               s.cluster_zone AS society_cluster,
               ROUND(COALESCE(AVG(r.stars), 0), 1) AS avg_rating,
               COUNT(r.id) AS rating_count,
               (SELECT COUNT(*) FROM bookings b WHERE b.assigned_worker_id = w.id AND b.status = 'Completed') AS completed_jobs
        FROM workers w
        LEFT JOIN societies s ON w.society_id = s.id
        LEFT JOIN ratings r ON r.worker_id = w.id
        GROUP BY w.id
        ORDER BY w.verified ASC, w.id DESC
    `).all();

    return res.json({ success: true, workers });
}

// =========================
// ALL BOOKINGS (Admin view with filtering)
// =========================
function getAllBookings(req, res) {
    const { status, emergency } = req.query;

    let sql = `
        SELECT b.*,
               w.name AS worker_name,
               w.phone AS worker_phone,
               w.skill AS worker_skill,
               s.name AS society_name,
               s.reg_number AS society_reg_number,
               s.cluster_zone AS society_cluster
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        LEFT JOIN societies s ON (w.society_id = s.id OR b.society_id = s.id)
    `;
    const conditions = [];
    const params = [];

    if (status) {
        conditions.push("b.status = ?");
        params.push(status);
    }
    if (emergency !== undefined && emergency !== "") {
        conditions.push("b.is_emergency = ?");
        params.push(Number(emergency));
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY b.is_emergency DESC, b.id DESC";

    const bookings = db.prepare(sql).all(...params);
    return res.json({ success: true, bookings });
}

// =========================
// APPROVE / REJECT A WORKER
// =========================
function verifyWorker(req, res) {
    const { workerId, action } = req.body;

    if (!workerId || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ success: false, message: "workerId and a valid action ('approve' or 'reject') are required." });
    }

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const adminName = req.admin ? req.admin.name : "Federation Administrator";

    if (action === "approve") {
        const certId = worker.ncct_cert_id || `NCCT-COOP-2026-${String(workerId).padStart(4, "0")}`;
        const badgeLevel = worker.badge_level || "Level 1: Certified Tradesperson";
        const hash = db.generateWorkerVerificationHash
            ? db.generateWorkerVerificationHash(worker.id, worker.phone, worker.skill, certId)
            : "5d1bb55f89860587527547cec71b9c9a99baebd1648267a28ba3805342f1615e";

        db.prepare(`
            UPDATE workers 
            SET verified = 1, 
                ncct_cert_id = ?, 
                badge_level = ?, 
                verification_hash = ?, 
                verified_at = CURRENT_TIMESTAMP, 
                verified_by_admin = ?, 
                badge_status = 'Active' 
            WHERE id = ?
        `).run(certId, badgeLevel, hash, adminName, workerId);

        db.prepare(`
            INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
            VALUES (?, 'ISSUED', ?, ?, 'Cooperative member verified and NCCT digital badge issued by federation admin.')
        `).run(workerId, badgeLevel, adminName);

        const updated = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
        return res.json({
            success: true,
            message: `Worker ${updated.name} verified as NCCT cooperative certified member (${certId}).`,
            worker: updated
        });
    }

    // Action === "reject"
    db.prepare(`
        UPDATE workers 
        SET verified = 0, badge_status = 'Revoked' 
        WHERE id = ?
    `).run(workerId);

    db.prepare(`
        INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
        VALUES (?, 'REVOKED', ?, ?, 'Verification and NCCT certification revoked by administrator.')
    `).run(workerId, worker.badge_level || "Unverified", adminName);

    const hasBookings = db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE assigned_worker_id = ?").get(workerId).c;
    if (hasBookings === 0) {
        db.prepare("DELETE FROM workers WHERE id = ?").run(workerId);
        return res.json({ success: true, message: "Worker application rejected and removed." });
    }

    return res.json({
        success: true,
        message: "Worker verification and certification revoked (record retained due to existing booking history)."
    });
}

// =========================
// ISSUE OR UPGRADE NCCT CERTIFICATION BADGE (Phase 17)
// =========================
function issueWorkerBadge(req, res) {
    const workerId = Number(req.params.id);
    const { badgeLevel, kycDocType, kycDocNumber, notes } = req.body;

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const adminName = req.admin ? req.admin.name : "Federation Administrator";
    const certId = worker.ncct_cert_id || `NCCT-COOP-2026-${String(workerId).padStart(4, "0")}`;
    const level = badgeLevel || worker.badge_level || "Level 1: Certified Tradesperson";
    const docType = kycDocType || worker.kyc_doc_type || "Aadhaar / National ID";
    const docNum = kycDocNumber || worker.kyc_doc_number || `XXXX-XXXX-${worker.phone.slice(-4)}`;

    const hash = db.generateWorkerVerificationHash
        ? db.generateWorkerVerificationHash(worker.id, worker.phone, worker.skill, certId)
        : "5d1bb55f89860587527547cec71b9c9a99baebd1648267a28ba3805342f1615e";

    db.prepare(`
        UPDATE workers 
        SET verified = 1,
            ncct_cert_id = ?,
            badge_level = ?,
            verification_hash = ?,
            verified_at = CURRENT_TIMESTAMP,
            verified_by_admin = ?,
            kyc_doc_type = ?,
            kyc_doc_number = ?,
            badge_status = 'Active'
        WHERE id = ?
    `).run(certId, level, hash, adminName, docType, docNum, workerId);

    const auditAction = worker.verified === 1 ? "LEVEL_UPGRADED" : "ISSUED";
    db.prepare(`
        INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
        VALUES (?, ?, ?, ?, ?)
    `).run(workerId, auditAction, level, adminName, notes || "Statutory NCCT Certification credential issued.");

    const updated = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    return res.json({
        success: true,
        message: `NCCT digital badge (${level}) successfully issued to ${updated.name}.`,
        worker: updated
    });
}

// =========================
// REVOKE / SUSPEND NCCT BADGE (Phase 17)
// =========================
function revokeWorkerBadge(req, res) {
    const workerId = Number(req.params.id);
    const { reason } = req.body;

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const adminName = req.admin ? req.admin.name : "Federation Administrator";

    db.prepare(`
        UPDATE workers 
        SET verified = 0, badge_status = 'Suspended'
        WHERE id = ?
    `).run(workerId);

    db.prepare(`
        INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
        VALUES (?, 'SUSPENDED', ?, ?, ?)
    `).run(workerId, worker.badge_level || "Level 1", adminName, reason || "Certification suspended by administrator.");

    return res.json({
        success: true,
        message: `Worker ${worker.name}'s NCCT certification has been suspended.`
    });
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

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    db.prepare("UPDATE bookings SET assigned_worker_id = ?, status = 'Assigned' WHERE id = ?")
        .run(workerId, bookingId);

    const updated = db.prepare(`
        SELECT b.*, w.name AS worker_name, w.phone AS worker_phone
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        WHERE b.id = ?
    `).get(bookingId);

    return res.json({
        success: true,
        message: `Assigned ${worker.name} (${worker.skill}) to Booking #${bookingId}.`,
        booking: updated
    });
}

// =========================
// RULE-BASED WORKER MATCHING
// Scores: Verified (+50) + Rating (+10/star) + Online (+10) + Location (+20) + GPS Proximity (+15..+30) - Active Workload (-10/job)
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

        // 1. Cooperative Verification (+50)
        if (worker.verified) {
            score += 50;
            reasons.push("NCCT Verified (+50)");
        } else {
            reasons.push("Pending Review (+0)");
        }

        // 2. Average Rating (+10 per star)
        const avgRatingRow = db.prepare(`
            SELECT AVG(stars) AS avg, COUNT(*) AS cnt
            FROM ratings
            WHERE worker_id = ?
        `).get(worker.id);

        const avgRating = avgRatingRow.avg || 4.5;
        score += avgRating * 10;
        reasons.push(`Rating ${avgRating.toFixed(1)}★ (+${Math.round(avgRating * 10)})`);

        // 3. Real-time Availability
        if (worker.is_available === 0) {
            score -= 40;
            reasons.push("Currently Busy / On Leave (-40)");
        } else {
            score += 10;
            reasons.push("Available Online (+10)");
        }

        // 4. Location text matching
        if (
            worker.location &&
            booking.address &&
            booking.address.toLowerCase().includes(worker.location.toLowerCase())
        ) {
            score += 20;
            reasons.push("Area match (+20)");
        }

        // 5. GPS Proximity (if coords exist)
        if (worker.latitude && worker.longitude && booking.customer_lat && booking.customer_lng) {
            const dLat = (worker.latitude - booking.customer_lat) * 111;
            const dLng = (worker.longitude - booking.customer_lng) * 111 * Math.cos(booking.customer_lat * Math.PI / 180);
            const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

            if (distKm < 5) {
                score += 30;
                reasons.push(`Nearby GPS (${distKm.toFixed(1)} km) (+30)`);
            } else if (distKm < 15) {
                score += 15;
                reasons.push(`Within radius (${distKm.toFixed(1)} km) (+15)`);
            }
        }

        // 6. Current active workload
        const activeJobs = db.prepare(`
            SELECT COUNT(*) AS c FROM bookings
            WHERE assigned_worker_id = ? AND status IN ('Assigned', 'In Progress')
        `).get(worker.id).c;

        if (activeJobs > 0) {
            score -= activeJobs * 15;
            reasons.push(`${activeJobs} active job(s) (-${activeJobs * 15})`);
        } else {
            score += 10;
            reasons.push("Queue free (+10)");
        }

        return { ...worker, matchScore: Math.round(score), reasons };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
        success: true,
        note: "Rule-based scoring (NCCT verification, member ratings, GPS proximity, real-time availability, queue load).",
        matches: scored
    });
}

module.exports = {
    getStats,
    getAllWorkers,
    getAllBookings,
    verifyWorker,
    issueWorkerBadge,
    revokeWorkerBadge,
    assignWorker,
    matchWorkers
};
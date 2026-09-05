const db = require("../database");

// =========================
// DASHBOARD STATS & COOPERATIVE METRICS
// =========================
// =========================
// DASHBOARD STATS & COOPERATIVE METRICS
// =========================
async function getStats(req, res) {
    const totalWorkers = (await db.prepare("SELECT COUNT(*) AS c FROM workers").get())?.c || 0;
    const verifiedWorkers = (await db.prepare("SELECT COUNT(*) AS c FROM workers WHERE verified = 1").get())?.c || 0;
    const pendingWorkers = (await db.prepare("SELECT COUNT(*) AS c FROM workers WHERE verified = 0").get())?.c || 0;
    const availableWorkers = (await db.prepare("SELECT COUNT(*) AS c FROM workers WHERE is_available = 1").get())?.c || 0;

    const totalCustomers = (await db.prepare("SELECT COUNT(DISTINCT customer_phone) AS c FROM bookings").get())?.c || 0;
    const totalBookings = (await db.prepare("SELECT COUNT(*) AS c FROM bookings").get())?.c || 0;
    const pendingBookings = (await db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'Pending'").get())?.c || 0;
    const inProgressBookings = (await db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'In Progress'").get())?.c || 0;
    const completedBookings = (await db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'Completed'").get())?.c || 0;
    const emergencyBookings = (await db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE is_emergency = 1").get())?.c || 0;

    // Financial & Welfare aggregates from invoices
    const financial = (await db.prepare(`
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_gmv,
            COALESCE(SUM(cooperative_share), 0) AS total_welfare,
            COALESCE(SUM(worker_earning), 0) AS total_worker_payout
        FROM invoices
    `).get()) || { total_gmv: 0, total_welfare: 0, total_worker_payout: 0 };

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
async function getAllWorkers(req, res) {
    const workers = await db.prepare(`
        SELECT w.*,
               s.name AS society_name,
               s.reg_number AS society_reg_number,
               s.cluster_zone AS society_cluster,
               COALESCE((SELECT ROUND(CAST(AVG(r.stars) AS numeric), 1) FROM ratings r WHERE r.worker_id = w.id), 4.5) AS avg_rating,
               COALESCE((SELECT COUNT(*) FROM ratings r WHERE r.worker_id = w.id), 0) AS rating_count,
               COALESCE((SELECT COUNT(*) FROM bookings b WHERE b.assigned_worker_id = w.id AND b.status = 'Completed'), 0) AS completed_jobs
        FROM workers w
        LEFT JOIN societies s ON w.society_id = s.id
        ORDER BY w.verified ASC, w.id DESC
    `).all();

    return res.json({ success: true, workers });
}

// =========================
// ALL BOOKINGS (Admin view with filtering)
// =========================
async function getAllBookings(req, res) {
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

    const bookings = await db.prepare(sql).all(...params);
    return res.json({ success: true, bookings });
}

// =========================
// APPROVE / REJECT A WORKER
// =========================
async function verifyWorker(req, res) {
    const { workerId, action } = req.body;

    if (!workerId || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ success: false, message: "workerId and a valid action ('approve' or 'reject') are required." });
    }

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
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

        await db.prepare(`
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

        await db.prepare(`
            INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
            VALUES (?, 'ISSUED', ?, ?, 'Cooperative member verified and NCCT digital badge issued by federation admin.')
        `).run(workerId, badgeLevel, adminName);

        const updated = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
        return res.json({
            success: true,
            message: `Worker ${updated.name} verified as NCCT cooperative certified member (${certId}).`,
            worker: updated
        });
    }

    // Action === "reject"
    await db.prepare(`
        UPDATE workers 
        SET verified = 0, badge_status = 'Revoked' 
        WHERE id = ?
    `).run(workerId);

    await db.prepare(`
        INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
        VALUES (?, 'REVOKED', ?, ?, 'Verification and NCCT certification revoked by administrator.')
    `).run(workerId, worker.badge_level || "Unverified", adminName);

    const hasBookingsRow = await db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE assigned_worker_id = ?").get(workerId);
    const hasBookings = hasBookingsRow ? hasBookingsRow.c : 0;
    if (hasBookings === 0) {
        await db.prepare("DELETE FROM workers WHERE id = ?").run(workerId);
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
async function issueWorkerBadge(req, res) {
    const workerId = Number(req.params.id);
    const { badgeLevel, kycDocType, kycDocNumber, notes } = req.body;

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
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

    await db.prepare(`
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
    await db.prepare(`
        INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
        VALUES (?, ?, ?, ?, ?)
    `).run(workerId, auditAction, level, adminName, notes || "Statutory NCCT Certification credential issued.");

    const updated = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    return res.json({
        success: true,
        message: `NCCT digital badge (${level}) successfully issued to ${updated.name}.`,
        worker: updated
    });
}

// =========================
// REVOKE / SUSPEND NCCT BADGE (Phase 17)
// =========================
async function revokeWorkerBadge(req, res) {
    const workerId = Number(req.params.id);
    const { reason } = req.body;

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const adminName = req.admin ? req.admin.name : "Federation Administrator";

    await db.prepare(`
        UPDATE workers 
        SET verified = 0, badge_status = 'Suspended'
        WHERE id = ?
    `).run(workerId);

    await db.prepare(`
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
async function assignWorker(req, res) {
    const { bookingId, workerId } = req.body;

    if (!bookingId || !workerId) {
        return res.status(400).json({ success: false, message: "bookingId and workerId are required." });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    await db.prepare("UPDATE bookings SET assigned_worker_id = ?, status = 'Assigned' WHERE id = ?")
        .run(workerId, bookingId);

    const updated = await db.prepare(`
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
async function matchWorkers(req, res) {
    const bookingId = Number(req.params.bookingId);

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const candidates = await db.prepare("SELECT * FROM workers WHERE skill = ?").all(booking.service);

    const scored = await Promise.all(candidates.map(async worker => {
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
        const avgRatingRow = await db.prepare(`
            SELECT AVG(stars) AS avg, COUNT(*) AS cnt
            FROM ratings
            WHERE worker_id = ?
        `).get(worker.id);

        const avgRating = (avgRatingRow && avgRatingRow.avg !== null && avgRatingRow.avg !== undefined) ? Number(avgRatingRow.avg) : 4.5;
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
        const activeJobsRow = await db.prepare(`
            SELECT COUNT(*) AS c FROM bookings
            WHERE assigned_worker_id = ? AND status IN ('Assigned', 'In Progress')
        `).get(worker.id);
        const activeJobs = activeJobsRow ? Number(activeJobsRow.c) : 0;

        if (activeJobs > 0) {
            score -= activeJobs * 15;
            reasons.push(`${activeJobs} active job(s) (-${activeJobs * 15})`);
        } else {
            score += 10;
            reasons.push("Queue free (+10)");
        }

        return { ...worker, matchScore: Math.round(score), reasons };
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
        success: true,
        note: "Rule-based scoring (NCCT verification, member ratings, GPS proximity, real-time availability, queue load).",
        matches: scored
    });
}

// ============================================================
// PHASE 18: COOPERATIVE WELFARE & PMSBY POOL ADMIN HANDLERS
// ============================================================

async function getAdminClaims(req, res) {
    const claims = await db.prepare(`
        SELECT c.*, 
               w.name as worker_name, 
               w.phone as worker_phone, 
               w.skill as worker_skill,
               s.name as society_name,
               s.id as society_id
        FROM welfare_claims c
        JOIN workers w ON c.worker_id = w.id
        LEFT JOIN societies s ON w.society_id = s.id
        ORDER BY CASE WHEN c.status = 'PENDING' THEN 1 ELSE 2 END, c.id DESC
    `).all();

    return res.json({
        success: true,
        claims
    });
}

async function processAdminClaim(req, res) {
    const claimId = Number(req.params.id);
    const { action, approvedAmount, remarks } = req.body;

    if (!claimId || !action) {
        return res.status(400).json({ success: false, message: "Claim ID and action are required." });
    }

    const claim = await db.prepare(`
        SELECT c.*, w.society_id, w.name as worker_name 
        FROM welfare_claims c
        JOIN workers w ON c.worker_id = w.id
        WHERE c.id = ?
    `).get(claimId);

    if (!claim) {
        return res.status(404).json({ success: false, message: "Claim record not found." });
    }

    const adminName = req.admin ? req.admin.name : "Federation Welfare Secretary";

    if (action === "APPROVE_DISBURSE") {
        const amount = Number(approvedAmount !== undefined ? approvedAmount : claim.requested_amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid approved amount." });
        }

        await db.prepare(`
            UPDATE welfare_claims 
            SET status = 'DISBURSED', 
                approved_amount = ?, 
                admin_remarks = ?, 
                resolved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(amount, remarks || `Approved and disbursed ₹${amount} by ${adminName}`, claimId);

        // Record in welfare pool ledger
        const societyId = claim.society_id || 1;
        await db.prepare(`
            INSERT INTO welfare_pool_ledger (society_id, entry_type, amount, worker_id, reference_id, description)
            VALUES (?, 'OUTFLOW_EMERGENCY_GRANT', ?, ?, ?, ?)
        `).run(
            societyId,
            amount,
            claim.worker_id,
            claim.claim_number,
            `Disbursed Emergency Welfare Grant for ${claim.claim_type}: ₹${amount}`
        );

        // Deduct from society pool safely
        const society = await db.prepare("SELECT welfare_fund_pool FROM societies WHERE id = ?").get(societyId);
        const newPool = Math.max(0, (society ? Number(society.welfare_fund_pool) : 0) - amount);
        await db.prepare("UPDATE societies SET welfare_fund_pool = ? WHERE id = ?").run(newPool, societyId);

        return res.json({
            success: true,
            message: `Claim ${claim.claim_number} approved and ₹${amount} disbursed to ${claim.worker_name}.`
        });
    } else if (action === "REJECT") {
        await db.prepare(`
            UPDATE welfare_claims 
            SET status = 'REJECTED', 
                admin_remarks = ?, 
                resolved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(remarks || `Claim rejected by ${adminName} - does not qualify under cooperative emergency distress guidelines.`, claimId);

        return res.json({
            success: true,
            message: `Claim ${claim.claim_number} marked as REJECTED.`
        });
    } else {
        return res.status(400).json({ success: false, message: "Invalid action. Use 'APPROVE_DISBURSE' or 'REJECT'." });
    }
}

async function batchRenewPmsby(req, res) {
    const verifiedWorkers = await db.prepare("SELECT * FROM workers WHERE verified = 1").all();
    let renewedCount = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const validFrom = `${currentYear}-06-01`;
    const validTo = `${currentYear + 1}-05-31`;

    for (const w of verifiedWorkers) {
        const existingPolicy = await db.prepare("SELECT * FROM worker_insurance_policies WHERE worker_id = ?").get(w.id);
        const policyNumber = existingPolicy 
            ? existingPolicy.policy_number 
            : `PMSBY-2026-COOP-${String(w.id).padStart(4, "0")}`;
        const certHash = db.generateInsuranceCertHash
            ? db.generateInsuranceCertHash(policyNumber, w.id, 200000, validFrom)
            : "e9f7823cba992384102934";

        if (!existingPolicy) {
            await db.prepare(`
                INSERT INTO worker_insurance_policies 
                (worker_id, policy_number, scheme_name, coverage_amount, premium_amount, valid_from, valid_to, policy_status, nominee_name, nominee_relationship, certificate_hash)
                VALUES (?, ?, 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)', 200000, 20, ?, ?, 'ACTIVE', 'Family Nominee', 'Spouse', ?)
            `).run(w.id, policyNumber, validFrom, validTo, certHash);
            renewedCount++;
        } else {
            await db.prepare(`
                UPDATE worker_insurance_policies 
                SET valid_from = ?, valid_to = ?, policy_status = 'ACTIVE', certificate_hash = ?
                WHERE id = ?
            `).run(validFrom, validTo, certHash, existingPolicy.id);
            renewedCount++;
        }

        // Add ledger entry
        const societyId = w.society_id || 1;
        await db.prepare(`
            INSERT INTO welfare_pool_ledger (society_id, entry_type, amount, worker_id, reference_id, description)
            VALUES (?, 'OUTFLOW_PMSBY_PREMIUM', 20.0, ?, ?, 'Cooperative subsidized annual PMSBY renewal')
        `).run(societyId, w.id, policyNumber);
    }

    return res.json({
        success: true,
        renewedCount,
        totalSponsoredPremium: renewedCount * 20,
        message: `Successfully batch sponsored and activated PMSBY policies for ${renewedCount} verified workers (Total premium: ₹${renewedCount * 20}).`
    });
}

async function getWelfareLedger(req, res) {
    const ledger = await db.prepare(`
        SELECT l.*, s.name as society_name, w.name as worker_name
        FROM welfare_pool_ledger l
        LEFT JOIN societies s ON l.society_id = s.id
        LEFT JOIN workers w ON l.worker_id = w.id
        ORDER BY l.id DESC
        LIMIT 50
    `).all();

    return res.json({
        success: true,
        ledger
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
    matchWorkers,
    getAdminClaims,
    processAdminClaim,
    batchRenewPmsby,
    getWelfareLedger
};
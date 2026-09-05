const express = require("express");
const router = express.Router();
const db = require("../database");

/**
 * GET /api/societies
 * Returns all certified Cooperative Societies & PACS clusters with aggregated performance metrics
 */
router.get("/", async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id,
                s.reg_number,
                s.name,
                s.cluster_zone,
                s.pincode,
                s.contact_person,
                s.contact_phone,
                s.welfare_fund_pool,
                s.status,
                s.created_at,
                COUNT(DISTINCT w.id) as total_workers,
                COUNT(DISTINCT CASE WHEN w.verified = 1 THEN w.id END) as verified_workers,
                COUNT(DISTINCT CASE WHEN w.is_available = 1 THEN w.id END) as available_workers,
                COUNT(DISTINCT b.id) as total_bookings,
                COUNT(DISTINCT CASE WHEN b.status = 'Completed' THEN b.id END) as completed_bookings
            FROM societies s
            LEFT JOIN workers w ON w.society_id = s.id
            LEFT JOIN bookings b ON b.society_id = s.id OR b.assigned_worker_id = w.id
            GROUP BY s.id
            ORDER BY s.id ASC
        `;

        const societies = await db.prepare(query).all();

        // Calculate Federation Total Reserves
        const totalWelfarePool = societies.reduce((sum, s) => sum + (Number(s.welfare_fund_pool) || 0), 0);
        const totalAffiliatedWorkers = societies.reduce((sum, s) => sum + (Number(s.total_workers) || 0), 0);
        const totalActiveClusters = new Set(societies.map(s => s.cluster_zone)).size;

        return res.json({
            societies,
            summary: {
                totalSocieties: societies.length,
                totalActiveClusters,
                totalAffiliatedWorkers,
                federationWelfareReserve: Math.round(totalWelfarePool * 100) / 100
            }
        });
    } catch (err) {
        console.error("Error fetching societies:", err);
        return res.status(500).json({ error: "Failed to fetch cooperative societies" });
    }
});

/**
 * POST /api/societies
 * Registers a new Labor Cooperative Society or PACS under the Federation
 */
router.post("/", async (req, res) => {
    try {
        const {
            name,
            reg_number,
            cluster_zone,
            pincode,
            contact_person,
            contact_phone
        } = req.body || {};

        if (!name || !reg_number || !cluster_zone || !pincode) {
            return res.status(400).json({
                error: "Society name, registration number, cluster zone, and PIN code are required."
            });
        }

        // Check if registration number is duplicate
        const existing = await db.prepare("SELECT id FROM societies WHERE reg_number = ?").get(reg_number.trim());
        if (existing) {
            return res.status(409).json({
                error: `A cooperative society with registration number "${reg_number}" already exists.`
            });
        }

        const insertStmt = db.prepare(`
            INSERT INTO societies (reg_number, name, cluster_zone, pincode, contact_person, contact_phone, welfare_fund_pool)
            VALUES (?, ?, ?, ?, ?, ?, 0.0)
        `);

        const result = await insertStmt.run(
            reg_number.trim(),
            name.trim(),
            cluster_zone.trim(),
            pincode.trim(),
            (contact_person || "").trim(),
            (contact_phone || "").trim()
        );

        const newSociety = await db.prepare("SELECT * FROM societies WHERE id = ?").get(result.lastInsertRowid);

        return res.status(201).json({
            message: "Cooperative society successfully registered under the Federation.",
            society: newSociety
        });
    } catch (err) {
        console.error("Error registering cooperative society:", err);
        return res.status(500).json({ error: "Failed to register cooperative society" });
    }
});

/**
 * GET /api/societies/:id
 * Fetches detailed profile of a specific cooperative society including affiliated member roster
 */
router.get("/:id", async (req, res) => {
    try {
        const societyId = Number(req.params.id);
        if (!societyId) {
            return res.status(400).json({ error: "Invalid society ID" });
        }

        const society = await db.prepare("SELECT * FROM societies WHERE id = ?").get(societyId);
        if (!society) {
            return res.status(404).json({ error: "Cooperative society not found" });
        }

        const workers = await db.prepare(`
            SELECT id, name, phone, skill, experience, location, verified, is_available, certification
            FROM workers
            WHERE society_id = ?
            ORDER BY verified DESC, name ASC
        `).all(societyId);

        const recentBookings = await db.prepare(`
            SELECT b.id, b.service, b.customer_name, b.booking_date, b.status, b.is_emergency,
                   w.name as worker_name
            FROM bookings b
            LEFT JOIN workers w ON b.assigned_worker_id = w.id
            WHERE b.society_id = ? OR w.society_id = ?
            ORDER BY b.id DESC
            LIMIT 10
        `).all(societyId, societyId);

        return res.json({
            society,
            workers,
            recentBookings
        });
    } catch (err) {
        console.error("Error fetching society details:", err);
        return res.status(500).json({ error: "Failed to fetch society details" });
    }
});

module.exports = router;


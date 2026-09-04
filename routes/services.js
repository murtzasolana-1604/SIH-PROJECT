const express = require("express");
const router = express.Router();
const db = require("../database");

/**
 * Calculates dynamic effective price: (base_price * demand_multiplier) + (is_high_demand ? scarcity_bonus : 0)
 */
function calculateEffectivePrice(service) {
    const base = Number(service.base_price) || 299;
    const mult = Number(service.demand_multiplier) || 1.0;
    const bonus = service.is_high_demand ? (Number(service.scarcity_bonus) || 0) : 0;
    return Math.round((base * mult) + bonus);
}

/**
 * GET /api/services
 * Returns all active services formatted for citizen display and booking.
 */
router.get("/", (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM services WHERE status = 'Active' ORDER BY id ASC").all();

        const services = rows.map(s => {
            const effectivePrice = calculateEffectivePrice(s);
            const isHighDemand = s.is_high_demand === 1;

            return {
                id: s.id,
                name: s.name,
                category: s.category,
                icon: s.icon,
                description: s.description,
                basePrice: s.base_price,
                effectivePrice: effectivePrice,
                fairWagePrice: effectivePrice,
                fairWageLabel: `₹${effectivePrice} ${isHighDemand ? '⚡ Peak Fair Wage' : 'Fair Wage Estimate'}`,
                benefitNote: isHighDemand 
                    ? "🔥 High Scarcity Incentive: 85% goes directly to worker living wage" 
                    : "Fair wages, verified worker, community owned",
                isHighDemand: isHighDemand,
                demandMultiplier: s.demand_multiplier,
                scarcityBonus: s.scarcity_bonus
            };
        });

        return res.json({ success: true, services });
    } catch (err) {
        console.error("Error fetching services:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/services/analytics
 * Returns all services with live supply (available workers) vs demand (active bookings) metrics.
 */
router.get("/analytics", (req, res) => {
    try {
        const services = db.prepare("SELECT * FROM services ORDER BY id ASC").all();

        const analytics = services.map(s => {
            // Count verified available workers for this skill
            const availableWorkers = db.prepare(`
                SELECT COUNT(*) as c FROM workers 
                WHERE skill = ? AND verified = 1 AND is_available = 1
            `).get(s.name).c;

            const totalWorkers = db.prepare(`
                SELECT COUNT(*) as c FROM workers 
                WHERE skill = ? AND verified = 1
            `).get(s.name).c;

            // Count pending/assigned active bookings for this service
            const activeBookings = db.prepare(`
                SELECT COUNT(*) as c FROM bookings 
                WHERE service = ? AND status IN ('Pending', 'Assigned', 'In Progress')
            `).get(s.name).c;

            const completedBookings = db.prepare(`
                SELECT COUNT(*) as c FROM bookings 
                WHERE service = ? AND status = 'Completed'
            `).get(s.name).c;

            const effectivePrice = calculateEffectivePrice(s);
            const workerEarning85 = Math.round(effectivePrice * 0.85 * 100) / 100;
            const coopShare15 = Math.round(effectivePrice * 0.15 * 100) / 100;

            // Scarcity alert if active bookings > available workers or available workers == 0 with pending bookings
            const isScarcityAlert = (activeBookings > availableWorkers) || (availableWorkers === 0 && activeBookings > 0);

            return {
                id: s.id,
                name: s.name,
                category: s.category,
                icon: s.icon,
                description: s.description,
                basePrice: s.base_price,
                demandMultiplier: s.demand_multiplier,
                isHighDemand: s.is_high_demand === 1,
                scarcityBonus: s.scarcity_bonus,
                status: s.status,
                effectivePrice,
                workerEarning85,
                coopShare15,
                availableWorkers,
                totalWorkers,
                activeBookings,
                completedBookings,
                isScarcityAlert
            };
        });

        const totalServices = analytics.length;
        const highDemandCount = analytics.filter(a => a.isHighDemand).length;
        const scarcityAlertCount = analytics.filter(a => a.isScarcityAlert).length;
        const avgBasePrice = totalServices > 0 
            ? Math.round(analytics.reduce((acc, a) => acc + a.basePrice, 0) / totalServices) 
            : 0;

        return res.json({
            success: true,
            summary: {
                totalServices,
                avgBasePrice,
                highDemandCount,
                scarcityAlertCount
            },
            services: analytics
        });
    } catch (err) {
        console.error("Error fetching services analytics:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/services
 * Registers a new cooperative service (Admin only).
 */
router.post("/", (req, res) => {
    try {
        const { name, category, icon, description, basePrice, demandMultiplier, isHighDemand, scarcityBonus } = req.body;

        if (!name || !category || !basePrice) {
            return res.status(400).json({ success: false, message: "Name, category, and base price are required." });
        }

        const cleanName = name.trim();
        const existing = db.prepare("SELECT id FROM services WHERE LOWER(name) = LOWER(?)").get(cleanName);
        if (existing) {
            return res.status(400).json({ success: false, message: `Service '${cleanName}' already exists.` });
        }

        const result = db.prepare(`
            INSERT INTO services 
            (name, category, icon, description, base_price, demand_multiplier, is_high_demand, scarcity_bonus, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        `).run(
            cleanName,
            category.trim(),
            (icon && icon.trim()) || "🛠️",
            (description && description.trim()) || "",
            Number(basePrice) || 299,
            Number(demandMultiplier) || 1.0,
            isHighDemand ? 1 : 0,
            Number(scarcityBonus) || 0
        );

        const newService = db.prepare("SELECT * FROM services WHERE id = ?").get(result.lastInsertRowid);
        return res.status(201).json({
            success: true,
            message: `Service '${cleanName}' registered successfully.`,
            service: newService
        });
    } catch (err) {
        console.error("Error creating service:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * PUT /api/services/:id
 * Updates base price, demand multiplier, scarcity bonus, and description of a service.
 */
router.put("/:id", (req, res) => {
    try {
        const serviceId = Number(req.params.id);
        const { basePrice, demandMultiplier, isHighDemand, scarcityBonus, description, status } = req.body;

        const current = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);
        if (!current) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        const newBasePrice = basePrice !== undefined ? Number(basePrice) : current.base_price;
        const newMultiplier = demandMultiplier !== undefined ? Number(demandMultiplier) : current.demand_multiplier;
        const newIsHighDemand = isHighDemand !== undefined ? (isHighDemand ? 1 : 0) : current.is_high_demand;
        const newScarcityBonus = scarcityBonus !== undefined ? Number(scarcityBonus) : current.scarcity_bonus;
        const newDescription = description !== undefined ? description : current.description;
        const newStatus = status !== undefined ? status : current.status;

        db.prepare(`
            UPDATE services 
            SET base_price = ?, demand_multiplier = ?, is_high_demand = ?, scarcity_bonus = ?, description = ?, status = ?
            WHERE id = ?
        `).run(newBasePrice, newMultiplier, newIsHighDemand, newScarcityBonus, newDescription, newStatus, serviceId);

        const updated = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);
        const effectivePrice = calculateEffectivePrice(updated);

        return res.json({
            success: true,
            message: `Service '${updated.name}' updated successfully. New effective price: ₹${effectivePrice}.`,
            service: updated,
            effectivePrice
        });
    } catch (err) {
        console.error("Error updating service:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/services/:id/toggle-demand
 * 1-Click toggle for High Demand / Scarcity pricing.
 */
router.post("/:id/toggle-demand", (req, res) => {
    try {
        const serviceId = Number(req.params.id);
        const service = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);

        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found." });
        }

        const newDemandState = service.is_high_demand === 1 ? 0 : 1;
        const multiplier = (newDemandState === 1 && service.demand_multiplier <= 1.0) ? 1.2 : (newDemandState === 0 ? 1.0 : service.demand_multiplier);
        const bonus = newDemandState === 1 ? (service.scarcity_bonus || 30) : 0;

        db.prepare(`
            UPDATE services 
            SET is_high_demand = ?, demand_multiplier = ?, scarcity_bonus = ?
            WHERE id = ?
        `).run(newDemandState, multiplier, bonus, serviceId);

        const updated = db.prepare("SELECT * FROM services WHERE id = ?").get(serviceId);
        const effectivePrice = calculateEffectivePrice(updated);

        return res.json({
            success: true,
            message: newDemandState === 1 
                ? `🔥 High Demand Scarcity Mode activated for ${updated.name} (Effective Price: ₹${effectivePrice}, +20% Living Wage Incentive).`
                : `Standard demand restored for ${updated.name} (Effective Price: ₹${effectivePrice}).`,
            isHighDemand: newDemandState === 1,
            effectivePrice,
            service: updated
        });
    } catch (err) {
        console.error("Error toggling demand:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

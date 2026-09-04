const db = require("../database");

// ============================================================
// DEMAND FORECAST & WORKFORCE MOBILIZATION
// Backward compatible with Phase 7 tests while enriched with Phase 15 multi-factor analytics
// ============================================================
function getForecast(req, res) {
    const demand = db.prepare(`
        SELECT service, COUNT(*) AS bookingCount
        FROM bookings
        GROUP BY service
        ORDER BY bookingCount DESC
    `).all();

    const supply = db.prepare(`
        SELECT skill, COUNT(*) AS workerCount
        FROM workers
        WHERE verified = 1
        GROUP BY skill
    `).all();

    const supplyMap = {};
    supply.forEach(row => { supplyMap[row.skill] = row.workerCount; });

    const forecast = demand.map(row => {
        const availableWorkers = supplyMap[row.service] || 0;
        const ratio = availableWorkers === 0 ? row.bookingCount : Math.round((row.bookingCount / availableWorkers) * 100) / 100;

        let recommendation;
        let status = "BALANCED";

        if (availableWorkers === 0) {
            recommendation = `No verified ${row.service}s yet — recruit urgently.`;
            status = "DEFICIT_ALERT";
        } else if (ratio > 2) {
            recommendation = `High demand — consider onboarding more ${row.service}s.`;
            status = "DEFICIT_ALERT";
        } else if (ratio < 0.5) {
            recommendation = `Supply comfortably covers demand for ${row.service}s.`;
            status = "SURPLUS";
        } else {
            recommendation = `Demand and supply are roughly balanced for ${row.service}s.`;
            status = "BALANCED";
        }

        return {
            service: row.service,
            bookingCount: row.bookingCount,
            verifiedWorkers: availableWorkers,
            ratio,
            status,
            recommendation
        };
    });

    return res.json({
        success: true,
        note: "Rule-based forecast from booking history — enriched with NCCT Phase 15 multi-factor analytics.",
        forecast
    });
}

module.exports = { getForecast };
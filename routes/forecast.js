const db = require("../database");

// =========================
// RULE-BASED DEMAND FORECAST + WORKFORCE SUGGESTION.
// This counts existing bookings vs. verified workers —
// simple statistics, not a trained machine learning model.
// =========================
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
        const ratio = availableWorkers === 0 ? row.bookingCount : row.bookingCount / availableWorkers;

        let recommendation;
        if (availableWorkers === 0) {
            recommendation = `No verified ${row.service}s yet — recruit urgently.`;
        } else if (ratio > 2) {
            recommendation = `High demand — consider onboarding more ${row.service}s.`;
        } else if (ratio < 0.5) {
            recommendation = `Supply comfortably covers demand for ${row.service}s.`;
        } else {
            recommendation = `Demand and supply are roughly balanced for ${row.service}s.`;
        }

        return {
            service: row.service,
            bookingCount: row.bookingCount,
            verifiedWorkers: availableWorkers,
            recommendation
        };
    });

    return res.json({
        success: true,
        note: "Rule-based forecast from booking history — not a trained ML model.",
        forecast
    });
}

module.exports = { getForecast };
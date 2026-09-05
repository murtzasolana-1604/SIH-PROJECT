const db = require("../database");

async function statusRoute(req, res) {
    try {
        const health = await db.checkHealth();
        res.json({
            project: "Sahkaar Connect",
            status: "working",
            server: "Node.js + Express",
            database: health.status,
            dbType: health.dbType,
            latencyMs: health.latencyMs,
            message: "Backend connected successfully 🚀"
        });
    } catch (err) {
        res.status(500).json({
            project: "Sahkaar Connect",
            status: "degraded",
            database: "error",
            error: err.message
        });
    }
}

module.exports = statusRoute;
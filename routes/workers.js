const db = require("../database");

function workersRoute(req, res) {

    if (req.method === "GET") {

        const { phone } = req.query;

        if (phone) {
            const worker = db.prepare("SELECT * FROM workers WHERE phone = ?").get(phone);
            return res.json({ success: true, worker: worker || null });
        }

        const workers = db.prepare("SELECT * FROM workers ORDER BY id DESC").all();
        return res.json({ success: true, workers });
    }

    if (req.method === "POST") {

        const { name, phone, skill, experience, location, availability } = req.body;

        if (!name || !phone || !skill || !location) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, skill and location are required."
            });
        }

        const result = db.prepare(`
            INSERT INTO workers (name, phone, skill, experience, location, availability)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            name, phone, skill,
            experience || "Not specified",
            location,
            availability || "Not specified"
        );

        const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: "Worker registered successfully!",
            worker
        });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
}

module.exports = workersRoute;
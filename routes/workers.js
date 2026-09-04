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

        const {
            name,
            phone,
            skill,
            experience,
            location,
            availability,
            certification,
            additionalSkills,
            address,
            villageTown,
            city,
            state,
            pincode,
            latitude,
            longitude
        } = req.body;

        if (!name || !phone || !skill) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, and skill are required."
            });
        }

        const cleanPhone = String(phone).trim();
        const resolvedLocation = location || (city && state ? `${city}, ${state}` : (city || address || "Greater Noida"));

        const existingWorker = db.prepare("SELECT * FROM workers WHERE phone = ?").get(cleanPhone);

        if (existingWorker) {
            db.prepare(`
                UPDATE workers
                SET name = ?, skill = ?, experience = ?, location = ?, availability = ?,
                    certification = COALESCE(?, certification),
                    additional_skills = COALESCE(?, additional_skills),
                    address = COALESCE(?, address),
                    village_town = COALESCE(?, village_town),
                    city = COALESCE(?, city),
                    state = COALESCE(?, state),
                    pincode = COALESCE(?, pincode),
                    latitude = COALESCE(?, latitude),
                    longitude = COALESCE(?, longitude)
                WHERE id = ?
            `).run(
                name,
                skill,
                experience || existingWorker.experience,
                resolvedLocation,
                availability || existingWorker.availability,
                certification || null,
                additionalSkills || null,
                address || null,
                villageTown || null,
                city || null,
                state || null,
                pincode || null,
                latitude !== undefined ? latitude : null,
                longitude !== undefined ? longitude : null,
                existingWorker.id
            );

            const updated = db.prepare("SELECT * FROM workers WHERE id = ?").get(existingWorker.id);
            return res.json({
                success: true,
                message: "Worker profile updated successfully!",
                worker: updated
            });
        }

        const result = db.prepare(`
            INSERT INTO workers (
                name, phone, skill, experience, location, availability,
                certification, additional_skills, address, village_town, city, state, pincode, latitude, longitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name,
            cleanPhone,
            skill,
            experience || "1 year",
            resolvedLocation,
            availability || "Morning",
            certification || "Self-Trained",
            additionalSkills || "",
            address || "",
            villageTown || "",
            city || "",
            state || "",
            pincode || "",
            latitude || null,
            longitude || null
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
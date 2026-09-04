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

// =====================================
// UPDATE AVAILABILITY (Available / Busy)
// =====================================
function updateAvailability(req, res) {
    const workerId = Number(req.params.id);
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
        return res.status(400).json({ success: false, message: "isAvailable (0 or 1) is required." });
    }

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    db.prepare("UPDATE workers SET is_available = ? WHERE id = ?").run(isAvailable ? 1 : 0, workerId);
    const updated = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);

    return res.json({
        success: true,
        message: isAvailable ? "You are now AVAILABLE for jobs." : "You are now marked BUSY / ON LEAVE.",
        worker: updated
    });
}

// =====================================
// GET WORKER EARNINGS BREAKDOWN
// =====================================
function getEarnings(req, res) {
    const workerId = Number(req.params.id);
    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);

    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const invoices = db.prepare(`
        SELECT i.*, b.booking_date, b.service, b.created_at AS booking_created_at
        FROM invoices i
        JOIN bookings b ON i.booking_id = b.id
        WHERE b.assigned_worker_id = ?
        ORDER BY i.id DESC
    `).all(workerId);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let totalEarnings = 0;
    let totalCoopShare = 0;
    let totalAmount = 0;

    invoices.forEach(inv => {
        const invDate = new Date(inv.created_at || inv.booking_date);
        const earning = Number(inv.worker_earning) || 0;
        const coop = Number(inv.cooperative_share) || 0;
        const total = Number(inv.total_amount) || 0;

        totalEarnings += earning;
        totalCoopShare += coop;
        totalAmount += total;

        if (inv.booking_date === todayStr || (inv.created_at && String(inv.created_at).startsWith(todayStr))) {
            todayEarnings += earning;
        }

        if (invDate >= sevenDaysAgo) {
            weekEarnings += earning;
        }
    });

    return res.json({
        success: true,
        earnings: {
            today: Math.round(todayEarnings * 100) / 100,
            week: Math.round(weekEarnings * 100) / 100,
            total: Math.round(totalEarnings * 100) / 100,
            cooperativeShare: Math.round(totalCoopShare * 100) / 100,
            grossTotal: Math.round(totalAmount * 100) / 100,
            completedJobsCount: invoices.length,
            invoices: invoices.slice(0, 5)
        }
    });
}

workersRoute.updateAvailability = updateAvailability;
workersRoute.getEarnings = getEarnings;

module.exports = workersRoute;
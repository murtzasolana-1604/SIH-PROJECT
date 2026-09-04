const db = require("../database");

// =====================================
// GET CUSTOMER PROFILE
// =====================================
function getProfile(req, res) {
    const phone = req.query.phone || (req.customer ? req.customer.phone : null);

    if (!phone) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required."
        });
    }

    const customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(phone);

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer profile not found."
        });
    }

    return res.json({
        success: true,
        customer
    });
}

// =====================================
// SAVE / UPDATE CUSTOMER PROFILE
// =====================================
function saveProfile(req, res) {
    const {
        phone,
        name,
        address,
        villageTown,
        city,
        state,
        pincode,
        latitude,
        longitude
    } = req.body;

    if (!phone || !name || !city || !state) {
        return res.status(400).json({
            success: false,
            message: "Phone, name, city, and state are required."
        });
    }

    const cleanPhone = String(phone).trim();
    const existing = db.prepare("SELECT * FROM customers WHERE phone = ?").get(cleanPhone);

    if (existing) {
        db.prepare(`
            UPDATE customers
            SET name = ?, address = ?, village_town = ?, city = ?, state = ?, pincode = ?, latitude = ?, longitude = ?
            WHERE phone = ?
        `).run(
            name,
            address || existing.address || "",
            villageTown || existing.village_town || "",
            city,
            state,
            pincode || existing.pincode || "",
            latitude !== undefined ? latitude : existing.latitude,
            longitude !== undefined ? longitude : existing.longitude,
            cleanPhone
        );
    } else {
        db.prepare(`
            INSERT INTO customers (phone, name, address, village_town, city, state, pincode, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            cleanPhone,
            name,
            address || "",
            villageTown || "",
            city,
            state,
            pincode || "",
            latitude || null,
            longitude || null
        );
    }

    const updated = db.prepare("SELECT * FROM customers WHERE phone = ?").get(cleanPhone);

    return res.json({
        success: true,
        message: "Customer profile saved successfully!",
        customer: updated
    });
}

// =====================================
// UPDATE LOCATION
// =====================================
function updateLocation(req, res) {
    const { phone, latitude, longitude, address, city, state, pincode } = req.body;

    if (!phone) {
        return res.status(400).json({
            success: false,
            message: "Phone number is required."
        });
    }

    const customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(phone);

    if (!customer) {
        return res.status(404).json({
            success: false,
            message: "Customer not found."
        });
    }

    db.prepare(`
        UPDATE customers
        SET latitude = ?, longitude = ?,
            address = COALESCE(?, address),
            city = COALESCE(?, city),
            state = COALESCE(?, state),
            pincode = COALESCE(?, pincode)
        WHERE phone = ?
    `).run(
        latitude || null,
        longitude || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        phone
    );

    const updated = db.prepare("SELECT * FROM customers WHERE phone = ?").get(phone);

    return res.json({
        success: true,
        message: "Location updated successfully.",
        customer: updated
    });
}

module.exports = {
    getProfile,
    saveProfile,
    updateLocation
};

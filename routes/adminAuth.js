const crypto = require("crypto");
const db = require("../database");

// =========================
// DEMO AUTH ONLY.
// Tokens live in memory and reset whenever the server restarts.
// This is enough to stop casual/accidental admin access in a
// prototype — it is NOT production-grade authentication.
// =========================

const activeTokens = new Map(); // token -> { adminId, phone, name }

async function adminLogin(req, res) {

    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ success: false, message: "Phone and password are required." });
    }

    const admin = await db.prepare("SELECT * FROM admins WHERE phone = ?").get(phone);

    if (!admin || admin.demo_password !== password) {
        return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    }


    const token = crypto.randomBytes(24).toString("hex");
    activeTokens.set(token, { adminId: admin.id, phone: admin.phone, name: admin.name });

    return res.json({
        success: true,
        token,
        admin: { id: admin.id, name: admin.name, phone: admin.phone }
    });
}

// Middleware — blocks any request that doesn't carry a valid admin token.
function requireAdminAuth(req, res, next) {

    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({ success: false, message: "Admin login required." });
    }

    req.admin = activeTokens.get(token);
    next();
}

module.exports = { adminLogin, requireAdminAuth };
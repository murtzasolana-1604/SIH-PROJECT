const crypto = require("crypto");
const db = require("../database");

const DEMO_OTP = "123456";

// In-memory active session stores
// token -> session data
const customerSessions = new Map();
const workerSessions = new Map();

// =====================================
// CUSTOMER AUTH
// =====================================

function customerSendOtp(req, res) {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(String(phone).trim())) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid 10-digit mobile number."
        });
    }

    const cleanPhone = String(phone).trim();

    return res.json({
        success: true,
        message: `Demo OTP sent to +91 ${cleanPhone}.`,
        demoOtp: DEMO_OTP,
        note: "Prototype demo OTP: 123456 — future-ready for SMS gateway."
    });
}

async function customerVerifyOtp(req, res) {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            message: "Phone number and OTP are required."
        });
    }

    const cleanPhone = String(phone).trim();
    const cleanOtp = String(otp).trim();

    if (cleanOtp !== DEMO_OTP) {
        return res.status(401).json({
            success: false,
            message: `Incorrect OTP. Please use the prototype demo OTP: ${DEMO_OTP}.`
        });
    }

    // Check if customer already exists in database
    const customer = await db.prepare("SELECT * FROM customers WHERE phone = ?").get(cleanPhone);
    const isNew = !customer;


    // Issue session token
    const token = crypto.randomBytes(24).toString("hex");
    customerSessions.set(token, {
        customerId: customer ? customer.id : null,
        phone: cleanPhone,
        name: customer ? customer.name : null
    });

    return res.json({
        success: true,
        message: isNew ? "Welcome to Sahkaar Connect!" : `Welcome back, ${customer.name || "Customer"}!`,
        token,
        isNew,
        customer: customer || { phone: cleanPhone }
    });
}

// =====================================
// WORKER AUTH
// =====================================

function workerSendOtp(req, res) {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(String(phone).trim())) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid 10-digit mobile number."
        });
    }

    const cleanPhone = String(phone).trim();

    return res.json({
        success: true,
        message: `Demo OTP sent to +91 ${cleanPhone}.`,
        demoOtp: DEMO_OTP,
        note: "Prototype demo OTP: 123456 — future-ready for SMS gateway."
    });
}

async function workerVerifyOtp(req, res) {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            message: "Phone number and OTP are required."
        });
    }

    const cleanPhone = String(phone).trim();
    const cleanOtp = String(otp).trim();

    if (cleanOtp !== DEMO_OTP) {
        return res.status(401).json({
            success: false,
            message: `Incorrect OTP. Please use the prototype demo OTP: ${DEMO_OTP}.`
        });
    }

    // Check if worker already exists in database
    const worker = await db.prepare("SELECT * FROM workers WHERE phone = ?").get(cleanPhone);
    const isNew = !worker;


    // Issue session token
    const token = crypto.randomBytes(24).toString("hex");
    workerSessions.set(token, {
        workerId: worker ? worker.id : null,
        phone: cleanPhone,
        name: worker ? worker.name : null
    });

    return res.json({
        success: true,
        message: isNew ? "Please complete your worker profile." : `Welcome back, ${worker.name}!`,
        token,
        isNew,
        worker: worker || { phone: cleanPhone }
    });
}

// =====================================
// LOGOUT
// =====================================

function logout(req, res) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (token) {
        customerSessions.delete(token);
        workerSessions.delete(token);
    }

    return res.json({
        success: true,
        message: "Session ended successfully."
    });
}

// =====================================
// AUTH MIDDLEWARES
// =====================================

function requireCustomerAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token || !customerSessions.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Customer authentication required."
        });
    }

    req.customer = customerSessions.get(token);
    next();
}

function requireWorkerAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token || !workerSessions.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Worker authentication required."
        });
    }

    req.worker = workerSessions.get(token);
    next();
}

module.exports = {
    customerSendOtp,
    customerVerifyOtp,
    workerSendOtp,
    workerVerifyOtp,
    logout,
    requireCustomerAuth,
    requireWorkerAuth,
    customerSessions,
    workerSessions
};

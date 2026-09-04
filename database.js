const Database = require("better-sqlite3");
const crypto = require("crypto");

const db = new Database("sahkaar.db");

// CUSTOMERS TABLE
db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT,
        address TEXT,
        village_town TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// WORKERS TABLE
db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        skill TEXT NOT NULL,
        experience TEXT,
        location TEXT NOT NULL,
        availability TEXT,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// BOOKINGS TABLE
db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        address TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        booking_time TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

function addColumnIfMissing(table, columnDef) {
    try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
    } catch (error) {
        // Column already exists — nothing to do.
    }
}

addColumnIfMissing("bookings", "assigned_worker_id INTEGER");
addColumnIfMissing("bookings", "is_emergency INTEGER DEFAULT 0");
addColumnIfMissing("bookings", "customer_lat REAL");
addColumnIfMissing("bookings", "customer_lng REAL");
addColumnIfMissing("bookings", "emergency_type TEXT");
addColumnIfMissing("bookings", "dispatched_at DATETIME");
addColumnIfMissing("bookings", "target_response_mins INTEGER DEFAULT 30");

addColumnIfMissing("workers", "address TEXT");
addColumnIfMissing("workers", "village_town TEXT");
addColumnIfMissing("workers", "city TEXT");
addColumnIfMissing("workers", "state TEXT");
addColumnIfMissing("workers", "pincode TEXT");
addColumnIfMissing("workers", "latitude REAL");
addColumnIfMissing("workers", "longitude REAL");
addColumnIfMissing("workers", "certification TEXT DEFAULT 'Self-Trained'");
addColumnIfMissing("workers", "additional_skills TEXT");
addColumnIfMissing("workers", "welfare_status TEXT DEFAULT 'Enrolled in Cooperative Welfare Fund (Demo)'");
addColumnIfMissing("workers", "insurance_status TEXT DEFAULT 'Covered: PM Suraksha Bima / Accidental (Demo)'");
addColumnIfMissing("workers", "is_available INTEGER DEFAULT 1");

// ============================================================
// PHASE 17: WORKER VERIFICATION & NCCT CERTIFICATION BADGES
// ============================================================
addColumnIfMissing("workers", "ncct_cert_id TEXT");
addColumnIfMissing("workers", "badge_level TEXT DEFAULT 'Level 1: Certified Tradesperson'");
addColumnIfMissing("workers", "verification_hash TEXT");
addColumnIfMissing("workers", "verified_at DATETIME");
addColumnIfMissing("workers", "verified_by_admin TEXT");
addColumnIfMissing("workers", "kyc_doc_type TEXT DEFAULT 'Aadhaar / National ID'");
addColumnIfMissing("workers", "kyc_doc_number TEXT DEFAULT 'XXXX-XXXX-9876'");
addColumnIfMissing("workers", "badge_status TEXT DEFAULT 'Active'");

db.exec(`
    CREATE TABLE IF NOT EXISTS worker_cert_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        badge_level TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// RATINGS TABLE
db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        worker_id INTEGER NOT NULL,
        stars INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
addColumnIfMissing("ratings", "tags TEXT");

// INVOICES TABLE
db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        service_charge REAL NOT NULL,
        cooperative_share REAL NOT NULL,
        worker_earning REAL NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
addColumnIfMissing("invoices", "payment_status TEXT DEFAULT 'unpaid'");
addColumnIfMissing("invoices", "payment_method TEXT");
addColumnIfMissing("invoices", "paid_at DATETIME");

// PAYMENTS TABLE — mock only
db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT DEFAULT 'Mock UPI',
        status TEXT DEFAULT 'mock_paid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
addColumnIfMissing("payments", "transaction_id TEXT");
addColumnIfMissing("payments", "notes TEXT");

// ADMINS TABLE — demo authentication only, not production security
db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        demo_password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const existingAdmin = db.prepare("SELECT * FROM admins WHERE phone = ?").get("9999999999");

if (!existingAdmin) {
    db.prepare("INSERT INTO admins (phone, name, demo_password) VALUES (?, ?, ?)")
        .run("9999999999", "Federation Admin", "admin123");
    console.log("Seeded DEMO admin — phone: 9999999999, password: admin123 (not real security, prototype only)");
}

// ============================================================
// PHASE 14: COOPERATIVE SOCIETIES & PACS CLUSTERS
// ============================================================
db.exec(`
    CREATE TABLE IF NOT EXISTS societies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reg_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        cluster_zone TEXT NOT NULL,
        pincode TEXT NOT NULL,
        contact_person TEXT,
        contact_phone TEXT,
        welfare_fund_pool REAL DEFAULT 0,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

addColumnIfMissing("workers", "society_id INTEGER");
addColumnIfMissing("bookings", "society_id INTEGER");

// Seed default societies if empty
const societyCount = db.prepare("SELECT COUNT(*) as count FROM societies").get().count;
if (societyCount === 0) {
    const insertSociety = db.prepare(`
        INSERT INTO societies (reg_number, name, cluster_zone, pincode, contact_person, contact_phone, welfare_fund_pool)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertSociety.run(
        "MSCS/CR/2026/089-A",
        "Navodaya Labour Cooperative Society Ltd.",
        "North District - Cluster 1",
        "110001",
        "Ramesh Sharma (Secretary)",
        "9876543210",
        2850.0
    );

    insertSociety.run(
        "MSCS/CR/2026/089-B",
        "Adarsh Shramik Sahkari Samiti",
        "South District - Cluster 2",
        "110016",
        "Sunita Devi (Lead Director)",
        "9876543211",
        3420.0
    );

    insertSociety.run(
        "MSCS/CR/2026/089-C",
        "Indraprastha PACS Gig Cooperative Union",
        "East Rural Cluster",
        "110092",
        "Virender Singh (Chairperson)",
        "9876543212",
        1980.0
    );

    console.log("Seeded default certified Cooperative Societies & PACS clusters!");
}

// ============================================================
// PHASE 15: NCCT UPSKILLING & CAPACITY BUILDING PROGRAMS
// ============================================================
db.exec(`
    CREATE TABLE IF NOT EXISTS ncct_upskilling_programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade TEXT NOT NULL,
        title TEXT NOT NULL,
        society_id INTEGER NOT NULL,
        target_capacity INTEGER NOT NULL,
        enrolled_count INTEGER DEFAULT 0,
        duration_days INTEGER DEFAULT 14,
        projected_wage_lift REAL DEFAULT 25.0,
        status TEXT DEFAULT 'Recommended',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const programCount = db.prepare("SELECT COUNT(*) as count FROM ncct_upskilling_programs").get().count;
if (programCount === 0) {
    const insertProgram = db.prepare(`
        INSERT INTO ncct_upskilling_programs (trade, title, society_id, target_capacity, enrolled_count, duration_days, projected_wage_lift, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProgram.run(
        "Technician",
        "Solar Rooftop & Inverter Cooperative Maintenance Certification",
        1,
        15,
        6,
        14,
        35.0,
        "Published"
    );

    insertProgram.run(
        "Caregiver",
        "NCCT Certified Geriatric & Palliative Home Care Assistant",
        2,
        20,
        0,
        21,
        40.0,
        "Recommended"
    );

    insertProgram.run(
        "Plumber",
        "Advanced Rainwater Harvesting & Sanitary Leak Diagnostics",
        3,
        12,
        0,
        10,
        28.0,
        "Recommended"
    );

    insertProgram.run(
        "Electrician",
        "Smart Energy Metering & Three-Phase Commercial Wiring",
        1,
        18,
        12,
        15,
        30.0,
        "Active"
    );

    console.log("Seeded default NCCT Upskilling & Capacity Building Programs!");
}

// Ensure all workers are affiliated with a cooperative society
const firstSociety = db.prepare("SELECT id FROM societies ORDER BY id ASC LIMIT 1").get();
if (firstSociety) {
    db.prepare("UPDATE workers SET society_id = ? WHERE society_id IS NULL OR society_id = 0")
        .run(firstSociety.id);
}

// Seed default demo customer if not exists
const existingCust = db.prepare("SELECT * FROM customers WHERE phone = ?").get("9876543210");
if (!existingCust) {
    db.prepare(`
        INSERT INTO customers (phone, name, address, village_town, city, state, pincode, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        "9876543210",
        "Ramesh Kumar (Demo Citizen)",
        "Flat 402, Shanti Cooperative Apts, Sector 62",
        "Sector 62",
        "Noida",
        "Uttar Pradesh",
        "201301",
        28.6280,
        77.3649
    );
    console.log("Seeded default demo customer (9876543210)!");
}

// Function to generate deterministic verification hash
function generateWorkerVerificationHash(workerId, phone, skill, certId, secret = "SAHKAAR_NCCT_2026_COOP_SECRET") {
    return crypto.createHash("sha256")
        .update(`${workerId}:${phone}:${skill}:${certId}:${secret}`)
        .digest("hex");
}

// Ensure verified workers have an NCCT certification ID, level, and cryptographic hash
const verifiedWithoutCert = db.prepare("SELECT * FROM workers WHERE verified = 1 AND (ncct_cert_id IS NULL OR verification_hash IS NULL)").all();
for (const w of verifiedWithoutCert) {
    const certId = `NCCT-COOP-2026-${String(w.id).padStart(4, "0")}`;
    const badgeLevel = (w.phone === "9876543210" || w.id === 6)
        ? "Level 2: Advanced Co-op Master Tradesperson"
        : "Level 1: Certified Tradesperson";
    const hash = generateWorkerVerificationHash(w.id, w.phone, w.skill, certId);
    const verifiedDate = w.verified_at || new Date().toISOString().replace("T", " ").substring(0, 19);
    const admin = w.verified_by_admin || "NCCT Federation Registrar / Admin";
    const kycType = w.kyc_doc_type || "Aadhaar / National ID";
    const kycNum = w.kyc_doc_number || `XXXX-XXXX-${w.phone.slice(-4)}`;

    db.prepare(`
        UPDATE workers 
        SET ncct_cert_id = ?, badge_level = ?, verification_hash = ?, verified_at = ?, verified_by_admin = ?, kyc_doc_type = ?, kyc_doc_number = ?, badge_status = 'Active'
        WHERE id = ?
    `).run(certId, badgeLevel, hash, verifiedDate, admin, kycType, kycNum, w.id);

    db.prepare(`
        INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
        VALUES (?, 'ISSUED', ?, ?, 'Initial statutory NCCT cooperative verification and cryptographic badge generation.')
    `).run(w.id, badgeLevel, admin);
}

db.generateWorkerVerificationHash = generateWorkerVerificationHash;

console.log("Database connected successfully!");

module.exports = db;
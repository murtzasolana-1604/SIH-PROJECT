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

// ============================================================
// PHASE 18: COOPERATIVE WELFARE & PMSBY INSURANCE POOL
// ============================================================
db.exec(`
    CREATE TABLE IF NOT EXISTS welfare_pool_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        society_id INTEGER,
        entry_type TEXT NOT NULL,
        amount REAL NOT NULL,
        worker_id INTEGER,
        reference_id TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS worker_insurance_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER NOT NULL,
        policy_number TEXT UNIQUE NOT NULL,
        scheme_name TEXT DEFAULT 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
        coverage_amount REAL DEFAULT 200000,
        premium_amount REAL DEFAULT 20,
        valid_from DATE NOT NULL,
        valid_to DATE NOT NULL,
        policy_status TEXT DEFAULT 'ACTIVE',
        nominee_name TEXT DEFAULT 'Dependent Family Member',
        nominee_relationship TEXT DEFAULT 'Spouse',
        certificate_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS welfare_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_number TEXT UNIQUE NOT NULL,
        worker_id INTEGER NOT NULL,
        claim_type TEXT NOT NULL,
        requested_amount REAL NOT NULL,
        approved_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'PENDING',
        incident_description TEXT,
        supporting_doc_ref TEXT,
        admin_remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
    )
`);

function generateInsuranceCertHash(policyNumber, workerId, coverageAmount, validFrom, secret = "SAHKAAR_PMSBY_2026_COOP") {
    return crypto.createHash("sha256")
        .update(`${policyNumber}:${workerId}:${coverageAmount}:${validFrom}:${secret}`)
        .digest("hex");
}

// Ensure all verified workers have an active PMSBY policy
const verifiedWorkersList = db.prepare("SELECT * FROM workers WHERE verified = 1").all();
for (const w of verifiedWorkersList) {
    const existingPolicy = db.prepare("SELECT * FROM worker_insurance_policies WHERE worker_id = ?").get(w.id);
    if (!existingPolicy) {
        const policyNumber = `PMSBY-2026-COOP-${String(w.id).padStart(4, "0")}`;
        const validFrom = "2026-06-01";
        const validTo = "2027-05-31";
        const certHash = generateInsuranceCertHash(policyNumber, w.id, 200000, validFrom);
        const nominee = (w.phone === "9876543210" || w.id === 6) ? "Meena Verma" : "Dependent Family Member";
        const rel = "Spouse";

        db.prepare(`
            INSERT INTO worker_insurance_policies 
            (worker_id, policy_number, scheme_name, coverage_amount, premium_amount, valid_from, valid_to, policy_status, nominee_name, nominee_relationship, certificate_hash)
            VALUES (?, ?, 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)', 200000, 20, ?, ?, 'ACTIVE', ?, ?, ?)
        `).run(w.id, policyNumber, validFrom, validTo, nominee, rel, certHash);

        // Record in welfare pool ledger as sponsored premium outflow
        const societyId = w.society_id || 1;
        db.prepare(`
            INSERT INTO welfare_pool_ledger (society_id, entry_type, amount, worker_id, reference_id, description)
            VALUES (?, 'OUTFLOW_PMSBY_PREMIUM', 20.0, ?, ?, '100% Cooperative Subsidized Annual PMSBY Policy Premium (₹2 Lakh accidental cover)')
        `).run(societyId, w.id, policyNumber);
    }
}

// Seed demo welfare claim if table empty
const claimCount = db.prepare("SELECT COUNT(*) as count FROM welfare_claims").get().count;
if (claimCount === 0) {
    const worker6 = db.prepare("SELECT id FROM workers WHERE id = 6 OR phone = '9876543210'").get();
    const w6Id = worker6 ? worker6.id : 6;

    db.prepare(`
        INSERT INTO welfare_claims 
        (claim_number, worker_id, claim_type, requested_amount, approved_amount, status, incident_description, supporting_doc_ref, admin_remarks)
        VALUES 
        ('CLM-2026-0001', ?, 'TOOL_DAMAGE_RELIEF', 1500, 0, 'PENDING', 
         'Heavy-duty diagnostic clamp meter damaged while repairing high-voltage commercial phase burnout during emergency SOS call.', 
         'BILL-REPAIR-2026-88.pdf', 'Pending society secretary on-site verification.')
    `).run(w6Id);

    db.prepare(`
        INSERT INTO welfare_claims 
        (claim_number, worker_id, claim_type, requested_amount, approved_amount, status, incident_description, supporting_doc_ref, admin_remarks, resolved_at)
        VALUES 
        ('CLM-2026-0002', ?, 'MEDICAL_EMERGENCY', 2500, 2500, 'DISBURSED', 
         'Minor on-site laceration needing tetanus shot and wound dressing after handling rusted water main pipe.', 
         'CLINIC-RECEIPT-9921.pdf', 'Approved and disbursed immediately under Cooperative Welfare Emergency Relief Scheme.', 
         datetime('now', '-2 days'))
    `).run(w6Id);

    db.prepare(`
        INSERT INTO welfare_pool_ledger (society_id, entry_type, amount, worker_id, reference_id, description)
        VALUES (1, 'OUTFLOW_EMERGENCY_GRANT', 2500.0, ?, 'CLM-2026-0002', 'Disbursed Emergency Medical Welfare Grant')
    `).run(w6Id);
}

// ============================================================
// COOPERATIVE SERVICES & DYNAMIC PRICING
// ============================================================
db.exec(`
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '🛠️',
        description TEXT,
        base_price REAL NOT NULL,
        demand_multiplier REAL DEFAULT 1.0,
        is_high_demand INTEGER DEFAULT 0,
        scarcity_bonus REAL DEFAULT 0,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const serviceCount = db.prepare("SELECT COUNT(*) as count FROM services").get().count;
if (serviceCount === 0) {
    const initialServices = [
        { name: "Electrician", category: "Electrical", icon: "⚡", description: "Fan repair, switchboard replacement, short-circuit troubleshooting & appliance wiring.", price: 249 },
        { name: "Plumber", category: "Home Repair", icon: "🔧", description: "Pipe leakage fix, tap/cistern repair, drain clearing & bathroom fittings installation.", price: 279 },
        { name: "Carpenter", category: "Home Repair", icon: "🪚", description: "Door lock repair, furniture assembly, hinges fix & custom woodwork modifications.", price: 349 },
        { name: "Painter", category: "Home Improvement", icon: "🎨", description: "Wall touch-ups, moisture damp treatment, single-room repainting & exterior whitewash.", price: 319 },
        { name: "Cleaner", category: "Household", icon: "🧹", description: "Deep home sanitation, kitchen/bathroom scrub, sofa shampooing & floor polishing.", price: 249 },
        { name: "Driver", category: "Transport", icon: "🚗", description: "Verified on-demand personal and commercial chauffeur for local and outstation trips.", price: 449 },
        { name: "Caregiver", category: "Care", icon: "❤️", description: "Compassionate elderly assistance, patient escorting, vital monitoring & daily companion care.", price: 399 },
        { name: "Technician", category: "Technical", icon: "🛠️", description: "RO water purifier service, AC filter cleaning, microwave repair & electronic diagnostics.", price: 299 }
    ];

    const insertService = db.prepare(`
        INSERT INTO services (name, category, icon, description, base_price, demand_multiplier, is_high_demand, scarcity_bonus, status)
        VALUES (?, ?, ?, ?, ?, 1.0, 0, 0, 'Active')
    `);

    for (const s of initialServices) {
        insertService.run(s.name, s.category, s.icon, s.description, s.price);
    }
    console.log("Seeded default 8 cooperative services into services table!");
}

db.generateInsuranceCertHash = generateInsuranceCertHash;

console.log("Database connected successfully!");

module.exports = db;
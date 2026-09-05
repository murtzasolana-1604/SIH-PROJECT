/**
 * SAHKAAR CONNECT — Dual-Mode Persistent Database Layer
 * 
 * Supports:
 * - Production: PostgreSQL (Render Managed DB via DATABASE_URL)
 * - Local Development: SQLite (better-sqlite3 via sahkaar.db)
 * 
 * Exposes a unified asynchronous prepared-statement interface:
 *   await db.prepare(sql).get(...params)
 *   await db.prepare(sql).all(...params)
 *   await db.prepare(sql).run(...params)
 *   await db.query(sql, params)
 *   await db.checkHealth()
 */

const crypto = require("crypto");
const path = require("path");

const isPg = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

// Helper to generate deterministic NCCT worker verification hash
function generateWorkerVerificationHash(workerId, phone, skill, certId, secret = "SAHKAAR_NCCT_2026_COOP_SECRET") {
    return crypto.createHash("sha256")
        .update(`${workerId}:${phone}:${skill}:${certId}:${secret}`)
        .digest("hex");
}

// Helper to generate PMSBY policy certificate hash
function generateInsuranceCertHash(policyNumber, workerId, coverageAmount, validFrom, secret = "SAHKAAR_PMSBY_2026_COOP") {
    return crypto.createHash("sha256")
        .update(`${policyNumber}:${workerId}:${coverageAmount}:${validFrom}:${secret}`)
        .digest("hex");
}

function flattenParams(args) {
    if (args.length === 1 && Array.isArray(args[0])) {
        return args[0];
    }
    return args;
}

function toPgSql(sql) {
    let index = 1;
    // Replace ? outside quotes with $1, $2, ...
    let translated = sql.replace(/'(?:''|[^'])*'|\?/g, (match) => {
        if (match === '?') {
            return `$${index++}`;
        }
        return match;
    });

    // Replace SQLite datetime('now', ...) if any
    translated = translated.replace(/\bdatetime\s*\(\s*'now'\s*\)/gi, "CURRENT_TIMESTAMP");
    return translated;
}

let pool = null;
let sqliteDb = null;

if (isPg) {
    const { Pool, types } = require("pg");

    // Configure PG types so aggregates and timestamps match SQLite expectations
    types.setTypeParser(20, val => parseInt(val, 10)); // int8 / count(*) -> integer
    types.setTypeParser(1700, val => parseFloat(val)); // numeric / decimal / avg -> float
    types.setTypeParser(1114, str => str); // timestamp without time zone -> string
    types.setTypeParser(1184, str => str); // timestamptz -> string

    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    pool.on("error", (err) => {
        console.error("[PostgreSQL Pool Error]", err.message);
    });

    console.log("[Database] Initialized PostgreSQL connection pool.");
} else {
    const Database = require("better-sqlite3");
    const dbPath = path.join(__dirname, "sahkaar.db");
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma("journal_mode = WAL");
    console.log("[Database] Initialized local SQLite connection (sahkaar.db).");
}

const db = {
    isPg,
    dbType: isPg ? "PostgreSQL" : "SQLite",
    generateWorkerVerificationHash,
    generateInsuranceCertHash,

    prepare(sql) {
        if (isPg) {
            return {
                async get(...params) {
                    const flat = flattenParams(params);
                    const sanitized = flat.map(p => p === undefined ? null : p);
                    const pgSql = toPgSql(sql);
                    const res = await pool.query(pgSql, sanitized);
                    return res.rows && res.rows.length > 0 ? res.rows[0] : undefined;
                },
                async all(...params) {
                    const flat = flattenParams(params);
                    const sanitized = flat.map(p => p === undefined ? null : p);
                    const pgSql = toPgSql(sql);
                    const res = await pool.query(pgSql, sanitized);
                    return res.rows || [];
                },
                async run(...params) {
                    const flat = flattenParams(params);
                    const sanitized = flat.map(p => p === undefined ? null : p);
                    let pgSql = toPgSql(sql);
                    const isInsert = /^\s*INSERT\s+INTO\s+/i.test(sql);
                    const hasReturning = /\bRETURNING\b/i.test(sql);
                    if (isInsert && !hasReturning) {
                        pgSql += " RETURNING id";
                    }
                    const res = await pool.query(pgSql, sanitized);
                    const lastInsertRowid = (res.rows && res.rows[0] && res.rows[0].id !== undefined) ? res.rows[0].id : null;
                    return {
                        changes: res.rowCount || 0,
                        lastInsertRowid
                    };
                }
            };
        } else {
            const stmt = sqliteDb.prepare(sql);
            return {
                async get(...params) {
                    const flat = flattenParams(params);
                    return Promise.resolve(stmt.get(...flat));
                },
                async all(...params) {
                    const flat = flattenParams(params);
                    return Promise.resolve(stmt.all(...flat));
                },
                async run(...params) {
                    const flat = flattenParams(params);
                    const res = stmt.run(...flat);
                    return Promise.resolve({
                        changes: res.changes,
                        lastInsertRowid: res.lastInsertRowid
                    });
                }
            };
        }
    },

    async query(sql, params = []) {
        if (isPg) {
            const flat = flattenParams(params);
            const sanitized = flat.map(p => p === undefined ? null : p);
            const pgSql = toPgSql(sql);
            const res = await pool.query(pgSql, sanitized);
            return { rows: res.rows, rowCount: res.rowCount };
        } else {
            const flat = flattenParams(params);
            if (/^\s*SELECT/i.test(sql)) {
                const rows = sqliteDb.prepare(sql).all(...flat);
                return { rows, rowCount: rows.length };
            } else {
                const info = sqliteDb.prepare(sql).run(...flat);
                return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
            }
        }
    },

    async exec(sql) {
        if (isPg) {
            await pool.query(sql);
        } else {
            sqliteDb.exec(sql);
        }
    },

    async checkHealth() {
        const start = Date.now();
        try {
            if (isPg) {
                await pool.query("SELECT 1");
                return { ok: true, status: "connected", dbType: "PostgreSQL", latencyMs: Date.now() - start };
            } else {
                sqliteDb.prepare("SELECT 1").get();
                return { ok: true, status: "connected", dbType: "SQLite", latencyMs: Date.now() - start };
            }
        } catch (err) {
            return { ok: false, status: "error", error: err.message };
        }
    },

    async init() {
        if (isPg) {
            await initPostgreSQL();
        } else {
            initSQLite();
        }
    }
};

// ============================================================
// SQLITE INITIALIZATION & MIGRATIONS
// ============================================================
function initSQLite() {
    sqliteDb.exec(`
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
        );

        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            skill TEXT NOT NULL,
            experience TEXT,
            location TEXT NOT NULL,
            availability TEXT,
            verified INTEGER DEFAULT 0,
            address TEXT,
            village_town TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            latitude REAL,
            longitude REAL,
            certification TEXT DEFAULT 'Self-Trained',
            additional_skills TEXT,
            welfare_status TEXT DEFAULT 'Enrolled in Cooperative Welfare Fund (Demo)',
            insurance_status TEXT DEFAULT 'Covered: PM Suraksha Bima / Accidental (Demo)',
            is_available INTEGER DEFAULT 1,
            ncct_cert_id TEXT,
            badge_level TEXT DEFAULT 'Level 1: Certified Tradesperson',
            verification_hash TEXT,
            verified_at DATETIME,
            verified_by_admin TEXT,
            kyc_doc_type TEXT DEFAULT 'Aadhaar / National ID',
            kyc_doc_number TEXT DEFAULT 'XXXX-XXXX-9876',
            badge_status TEXT DEFAULT 'Active',
            society_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            address TEXT NOT NULL,
            booking_date TEXT NOT NULL,
            booking_time TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            assigned_worker_id INTEGER,
            is_emergency INTEGER DEFAULT 0,
            customer_lat REAL,
            customer_lng REAL,
            emergency_type TEXT,
            dispatched_at DATETIME,
            target_response_mins INTEGER DEFAULT 30,
            society_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS worker_cert_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            badge_level TEXT NOT NULL,
            admin_name TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            worker_id INTEGER NOT NULL,
            stars INTEGER NOT NULL,
            comment TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            service_charge REAL NOT NULL,
            cooperative_share REAL NOT NULL,
            worker_earning REAL NOT NULL,
            total_amount REAL NOT NULL,
            payment_status TEXT DEFAULT 'unpaid',
            payment_method TEXT,
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            method TEXT DEFAULT 'Mock UPI',
            status TEXT DEFAULT 'mock_paid',
            transaction_id TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            demo_password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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
        );

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
        );

        CREATE TABLE IF NOT EXISTS welfare_pool_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            society_id INTEGER,
            entry_type TEXT NOT NULL,
            amount REAL NOT NULL,
            worker_id INTEGER,
            reference_id TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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
        );

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
        );

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
        );
    `);

    // Seed admin if empty
    const existingAdmin = sqliteDb.prepare("SELECT * FROM admins WHERE phone = ?").get("9999999999");
    if (!existingAdmin) {
        sqliteDb.prepare("INSERT INTO admins (phone, name, demo_password) VALUES (?, ?, ?)")
            .run("9999999999", "Federation Admin", "admin123");
    }

    // Seed societies if empty
    const sCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM societies").get().count;
    if (sCount === 0) {
        const ins = sqliteDb.prepare(`
            INSERT INTO societies (reg_number, name, cluster_zone, pincode, contact_person, contact_phone, welfare_fund_pool)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        ins.run("MSCS/CR/2026/089-A", "Navodaya Labour Cooperative Society Ltd.", "North District - Cluster 1", "110001", "Ramesh Sharma (Secretary)", "9876543210", 2850.0);
        ins.run("MSCS/CR/2026/089-B", "Adarsh Shramik Sahkari Samiti", "South District - Cluster 2", "110016", "Sunita Devi (Lead Director)", "9876543211", 3420.0);
        ins.run("MSCS/CR/2026/089-C", "Indraprastha PACS Gig Cooperative Union", "East Rural Cluster", "110092", "Virender Singh (Chairperson)", "9876543212", 1980.0);
    }

    // Seed services if empty
    const srvCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM services").get().count;
    if (srvCount === 0) {
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
        const insSrv = sqliteDb.prepare(`
            INSERT INTO services (name, category, icon, description, base_price, demand_multiplier, is_high_demand, scarcity_bonus, status)
            VALUES (?, ?, ?, ?, ?, 1.0, 0, 0, 'Active')
        `);
        for (const s of initialServices) {
            insSrv.run(s.name, s.category, s.icon, s.description, s.price);
        }
    }

    // Seed NCCT programs if empty
    const pCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM ncct_upskilling_programs").get().count;
    if (pCount === 0) {
        const insProg = sqliteDb.prepare(`
            INSERT INTO ncct_upskilling_programs (trade, title, society_id, target_capacity, enrolled_count, duration_days, projected_wage_lift, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insProg.run("Technician", "Solar Rooftop & Inverter Cooperative Maintenance Certification", 1, 15, 6, 14, 35.0, "Published");
        insProg.run("Caregiver", "NCCT Certified Geriatric & Palliative Home Care Assistant", 2, 20, 0, 21, 40.0, "Recommended");
        insProg.run("Plumber", "Advanced Rainwater Harvesting & Sanitary Leak Diagnostics", 3, 12, 0, 10, 28.0, "Recommended");
        insProg.run("Electrician", "Smart Energy Metering & Three-Phase Commercial Wiring", 1, 18, 12, 15, 30.0, "Active");
    }

    // Seed demo customer if not exists
    const existingCust = sqliteDb.prepare("SELECT * FROM customers WHERE phone = ?").get("9876543210");
    if (!existingCust) {
        sqliteDb.prepare(`
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
    }

    console.log("[Database] SQLite tables and seeds verified.");
}

// ============================================================
// POSTGRESQL INITIALIZATION & MIGRATIONS
// ============================================================
async function initPostgreSQL() {
    console.log("[Database] Initializing PostgreSQL schema...");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            name TEXT,
            address TEXT,
            village_town TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            skill TEXT NOT NULL,
            experience TEXT,
            location TEXT NOT NULL,
            availability TEXT,
            verified INTEGER DEFAULT 0,
            address TEXT,
            village_town TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            certification TEXT DEFAULT 'Self-Trained',
            additional_skills TEXT,
            welfare_status TEXT DEFAULT 'Enrolled in Cooperative Welfare Fund (Demo)',
            insurance_status TEXT DEFAULT 'Covered: PM Suraksha Bima / Accidental (Demo)',
            is_available INTEGER DEFAULT 1,
            ncct_cert_id TEXT,
            badge_level TEXT DEFAULT 'Level 1: Certified Tradesperson',
            verification_hash TEXT,
            verified_at TIMESTAMP,
            verified_by_admin TEXT,
            kyc_doc_type TEXT DEFAULT 'Aadhaar / National ID',
            kyc_doc_number TEXT DEFAULT 'XXXX-XXXX-9876',
            badge_status TEXT DEFAULT 'Active',
            society_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            service TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            address TEXT NOT NULL,
            booking_date TEXT NOT NULL,
            booking_time TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            assigned_worker_id INTEGER,
            is_emergency INTEGER DEFAULT 0,
            customer_lat DOUBLE PRECISION,
            customer_lng DOUBLE PRECISION,
            emergency_type TEXT,
            dispatched_at TIMESTAMP,
            target_response_mins INTEGER DEFAULT 30,
            society_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS worker_cert_audit (
            id SERIAL PRIMARY KEY,
            worker_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            badge_level TEXT NOT NULL,
            admin_name TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ratings (
            id SERIAL PRIMARY KEY,
            booking_id INTEGER NOT NULL,
            worker_id INTEGER NOT NULL,
            stars INTEGER NOT NULL,
            comment TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            booking_id INTEGER NOT NULL,
            service_charge DOUBLE PRECISION NOT NULL,
            cooperative_share DOUBLE PRECISION NOT NULL,
            worker_earning DOUBLE PRECISION NOT NULL,
            total_amount DOUBLE PRECISION NOT NULL,
            payment_status TEXT DEFAULT 'unpaid',
            payment_method TEXT,
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            booking_id INTEGER NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            method TEXT DEFAULT 'Mock UPI',
            status TEXT DEFAULT 'mock_paid',
            transaction_id TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            demo_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS societies (
            id SERIAL PRIMARY KEY,
            reg_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            cluster_zone TEXT NOT NULL,
            pincode TEXT NOT NULL,
            contact_person TEXT,
            contact_phone TEXT,
            welfare_fund_pool DOUBLE PRECISION DEFAULT 0,
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ncct_upskilling_programs (
            id SERIAL PRIMARY KEY,
            trade TEXT NOT NULL,
            title TEXT NOT NULL,
            society_id INTEGER NOT NULL,
            target_capacity INTEGER NOT NULL,
            enrolled_count INTEGER DEFAULT 0,
            duration_days INTEGER DEFAULT 14,
            projected_wage_lift DOUBLE PRECISION DEFAULT 25.0,
            status TEXT DEFAULT 'Recommended',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS welfare_pool_ledger (
            id SERIAL PRIMARY KEY,
            society_id INTEGER,
            entry_type TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            worker_id INTEGER,
            reference_id TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS worker_insurance_policies (
            id SERIAL PRIMARY KEY,
            worker_id INTEGER NOT NULL,
            policy_number TEXT UNIQUE NOT NULL,
            scheme_name TEXT DEFAULT 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
            coverage_amount DOUBLE PRECISION DEFAULT 200000,
            premium_amount DOUBLE PRECISION DEFAULT 20,
            valid_from DATE NOT NULL,
            valid_to DATE NOT NULL,
            policy_status TEXT DEFAULT 'ACTIVE',
            nominee_name TEXT DEFAULT 'Dependent Family Member',
            nominee_relationship TEXT DEFAULT 'Spouse',
            certificate_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS welfare_claims (
            id SERIAL PRIMARY KEY,
            claim_number TEXT UNIQUE NOT NULL,
            worker_id INTEGER NOT NULL,
            claim_type TEXT NOT NULL,
            requested_amount DOUBLE PRECISION NOT NULL,
            approved_amount DOUBLE PRECISION DEFAULT 0,
            status TEXT DEFAULT 'PENDING',
            incident_description TEXT,
            supporting_doc_ref TEXT,
            admin_remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT '🛠️',
            description TEXT,
            base_price DOUBLE PRECISION NOT NULL,
            demand_multiplier DOUBLE PRECISION DEFAULT 1.0,
            is_high_demand INTEGER DEFAULT 0,
            scarcity_bonus DOUBLE PRECISION DEFAULT 0,
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed Admin
    const adminRes = await pool.query("SELECT * FROM admins WHERE phone = $1", ["9999999999"]);
    if (adminRes.rows.length === 0) {
        await pool.query(
            "INSERT INTO admins (phone, name, demo_password) VALUES ($1, $2, $3)",
            ["9999999999", "Federation Admin", "admin123"]
        );
        console.log("[Database] Seeded PostgreSQL Federation Admin (9999999999).");
    }

    // Seed Societies
    const socRes = await pool.query("SELECT COUNT(*) as count FROM societies");
    if (socRes.rows[0].count === 0) {
        await pool.query(`
            INSERT INTO societies (reg_number, name, cluster_zone, pincode, contact_person, contact_phone, welfare_fund_pool)
            VALUES 
            ('MSCS/CR/2026/089-A', 'Navodaya Labour Cooperative Society Ltd.', 'North District - Cluster 1', '110001', 'Ramesh Sharma (Secretary)', '9876543210', 2850.0),
            ('MSCS/CR/2026/089-B', 'Adarsh Shramik Sahkari Samiti', 'South District - Cluster 2', '110016', 'Sunita Devi (Lead Director)', '9876543211', 3420.0),
            ('MSCS/CR/2026/089-C', 'Indraprastha PACS Gig Cooperative Union', 'East Rural Cluster', '110092', 'Virender Singh (Chairperson)', '9876543212', 1980.0)
        `);
        console.log("[Database] Seeded PostgreSQL default Cooperative Societies.");
    }

    // Seed Services
    const srvRes = await pool.query("SELECT COUNT(*) as count FROM services");
    if (srvRes.rows[0].count === 0) {
        await pool.query(`
            INSERT INTO services (name, category, icon, description, base_price, demand_multiplier, is_high_demand, scarcity_bonus, status)
            VALUES 
            ('Electrician', 'Electrical', '⚡', 'Fan repair, switchboard replacement, short-circuit troubleshooting & appliance wiring.', 249, 1.0, 0, 0, 'Active'),
            ('Plumber', 'Home Repair', '🔧', 'Pipe leakage fix, tap/cistern repair, drain clearing & bathroom fittings installation.', 279, 1.0, 0, 0, 'Active'),
            ('Carpenter', 'Home Repair', '🪚', 'Door lock repair, furniture assembly, hinges fix & custom woodwork modifications.', 349, 1.0, 0, 0, 'Active'),
            ('Painter', 'Home Improvement', '🎨', 'Wall touch-ups, moisture damp treatment, single-room repainting & exterior whitewash.', 319, 1.0, 0, 0, 'Active'),
            ('Cleaner', 'Household', '🧹', 'Deep home sanitation, kitchen/bathroom scrub, sofa shampooing & floor polishing.', 249, 1.0, 0, 0, 'Active'),
            ('Driver', 'Transport', '🚗', 'Verified on-demand personal and commercial chauffeur for local and outstation trips.', 449, 1.0, 0, 0, 'Active'),
            ('Caregiver', 'Care', '❤️', 'Compassionate elderly assistance, patient escorting, vital monitoring & daily companion care.', 399, 1.0, 0, 0, 'Active'),
            ('Technician', 'Technical', '🛠️', 'RO water purifier service, AC filter cleaning, microwave repair & electronic diagnostics.', 299, 1.0, 0, 0, 'Active')
        `);
        console.log("[Database] Seeded PostgreSQL default 8 Cooperative Services.");
    }

    // Seed NCCT Programs
    const progRes = await pool.query("SELECT COUNT(*) as count FROM ncct_upskilling_programs");
    if (progRes.rows[0].count === 0) {
        await pool.query(`
            INSERT INTO ncct_upskilling_programs (trade, title, society_id, target_capacity, enrolled_count, duration_days, projected_wage_lift, status)
            VALUES 
            ('Technician', 'Solar Rooftop & Inverter Cooperative Maintenance Certification', 1, 15, 6, 14, 35.0, 'Published'),
            ('Caregiver', 'NCCT Certified Geriatric & Palliative Home Care Assistant', 2, 20, 0, 21, 40.0, 'Recommended'),
            ('Plumber', 'Advanced Rainwater Harvesting & Sanitary Leak Diagnostics', 3, 12, 0, 10, 28.0, 'Recommended'),
            ('Electrician', 'Smart Energy Metering & Three-Phase Commercial Wiring', 1, 18, 12, 15, 30.0, 'Active')
        `);
        console.log("[Database] Seeded PostgreSQL NCCT Upskilling Programs.");
    }

    // Seed Demo Customer
    const custRes = await pool.query("SELECT * FROM customers WHERE phone = $1", ["9876543210"]);
    if (custRes.rows.length === 0) {
        await pool.query(`
            INSERT INTO customers (phone, name, address, village_town, city, state, pincode, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            "9876543210",
            "Ramesh Kumar (Demo Citizen)",
            "Flat 402, Shanti Cooperative Apts, Sector 62",
            "Sector 62",
            "Noida",
            "Uttar Pradesh",
            "201301",
            28.6280,
            77.3649
        ]);
        console.log("[Database] Seeded PostgreSQL demo citizen Ramesh Kumar (9876543210).");
    }

    // Seed Demo Workers
    const workerRes = await pool.query("SELECT COUNT(*) as count FROM workers");
    if (workerRes.rows[0].count === 0) {
        const demoWorkers = [
            { name: "Sunil Verma", phone: "9876543210", skill: "Painter", experience: "7 years", location: "Noida, Uttar Pradesh", city: "Noida", state: "Uttar Pradesh", lat: 28.6280, lng: 77.3649, society_id: 1, level: "Level 2: Advanced Co-op Master Tradesperson" },
            { name: "Sunil Verma", phone: "9711882233", skill: "Electrician", experience: "5 years", location: "Greater Noida, Uttar Pradesh", city: "Greater Noida", state: "Uttar Pradesh", lat: 28.4744, lng: 77.5040, society_id: 1, level: "Level 1: Certified Tradesperson" },
            { name: "Ayush Sharma", phone: "1234567899", skill: "Electrician", experience: "4 years", location: "Delhi NCR", city: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090, society_id: 1, level: "Level 1: Certified Tradesperson" },
            { name: "Vipul Tyagi", phone: "0987654321", skill: "Electrician", experience: "3 years", location: "Ghaziabad, Uttar Pradesh", city: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lng: 77.4538, society_id: 2, level: "Level 1: Certified Tradesperson" },
            { name: "Rakesh Kumar", phone: "9999999999", skill: "Plumber", experience: "6 years", location: "South Delhi", city: "New Delhi", state: "Delhi", lat: 28.5355, lng: 77.2410, society_id: 3, level: "Level 1: Certified Tradesperson" },
            { name: "Priya Singh", phone: "9876543220", skill: "Caregiver", experience: "4 years", location: "Noida Sector 50", city: "Noida", state: "Uttar Pradesh", lat: 28.5700, lng: 77.3700, society_id: 2, level: "Level 1: Certified Tradesperson" },
            { name: "Mohd. Imran", phone: "9876543230", skill: "Driver", experience: "8 years", location: "Indirapuram, Ghaziabad", city: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6400, lng: 77.3700, society_id: 3, level: "Level 1: Certified Tradesperson" },
            { name: "Anita Devi", phone: "9876543240", skill: "Cleaner", experience: "5 years", location: "Sector 18, Noida", city: "Noida", state: "Uttar Pradesh", lat: 28.5708, lng: 77.3261, society_id: 1, level: "Level 1: Certified Tradesperson" }
        ];

        for (const w of demoWorkers) {
            const certId = `NCCT-COOP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const hash = generateWorkerVerificationHash(w.phone, w.phone, w.skill, certId);
            const insRes = await pool.query(`
                INSERT INTO workers 
                (name, phone, skill, experience, location, availability, verified, city, state, latitude, longitude,
                 certification, welfare_status, insurance_status, is_available, ncct_cert_id, badge_level,
                 verification_hash, verified_at, verified_by_admin, kyc_doc_type, kyc_doc_number, badge_status, society_id)
                VALUES 
                ($1, $2, $3, $4, $5, 'Available', 1, $6, $7, $8, $9,
                 'NCCT Certified Tradesperson', 'Enrolled in Cooperative Welfare Fund', 'Covered: PM Suraksha Bima Yojana (₹2 Lakh Accidental)',
                 1, $10, $11, $12, CURRENT_TIMESTAMP, 'NCCT Federation Registrar / Admin',
                 'Aadhaar / National ID', $13, 'Active', $14)
                RETURNING id
            `, [
                w.name, w.phone, w.skill, w.experience, w.location, w.city, w.state, w.lat, w.lng,
                certId, w.level, hash, `XXXX-XXXX-${w.phone.slice(-4)}`, w.society_id
            ]);

            const workerId = insRes.rows[0].id;

            // Audit record
            await pool.query(`
                INSERT INTO worker_cert_audit (worker_id, action, badge_level, admin_name, notes)
                VALUES ($1, 'ISSUED', $2, 'NCCT Federation Registrar / Admin', 'Statutory cooperative verification and cryptographic badge generation.')
            `, [workerId, w.level]);

            // PMSBY Policy
            const polNum = `PMSBY-2026-COOP-${String(workerId).padStart(4, "0")}`;
            const polHash = generateInsuranceCertHash(polNum, workerId, 200000, "2026-06-01");
            await pool.query(`
                INSERT INTO worker_insurance_policies 
                (worker_id, policy_number, scheme_name, coverage_amount, premium_amount, valid_from, valid_to, policy_status, nominee_name, nominee_relationship, certificate_hash)
                VALUES ($1, $2, 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)', 200000, 20, '2026-06-01', '2027-05-31', 'ACTIVE', 'Meena Verma', 'Spouse', $3)
            `, [workerId, polNum, polHash]);

            // Ledger
            await pool.query(`
                INSERT INTO welfare_pool_ledger (society_id, entry_type, amount, worker_id, reference_id, description)
                VALUES ($1, 'OUTFLOW_PMSBY_PREMIUM', 20.0, $2, $3, '100% Cooperative Subsidized Annual PMSBY Policy Premium (₹2 Lakh accidental cover)')
            `, [w.society_id, workerId, polNum]);
        }

        // Demo welfare claims for Sunil Verma
        const w6 = await pool.query("SELECT id FROM workers WHERE phone = $1 LIMIT 1", ["9876543210"]);
        if (w6.rows.length > 0) {
            const w6Id = w6.rows[0].id;
            await pool.query(`
                INSERT INTO welfare_claims 
                (claim_number, worker_id, claim_type, requested_amount, approved_amount, status, incident_description, supporting_doc_ref, admin_remarks)
                VALUES 
                ('CLM-2026-0001', $1, 'TOOL_DAMAGE_RELIEF', 1500, 0, 'PENDING', 
                 'Heavy-duty diagnostic clamp meter damaged while repairing high-voltage commercial phase burnout during emergency SOS call.', 
                 'BILL-REPAIR-2026-88.pdf', 'Pending society secretary on-site verification.')
            `, [w6Id]);

            await pool.query(`
                INSERT INTO welfare_claims 
                (claim_number, worker_id, claim_type, requested_amount, approved_amount, status, incident_description, supporting_doc_ref, admin_remarks, resolved_at)
                VALUES 
                ('CLM-2026-0002', $1, 'MEDICAL_EMERGENCY', 2500, 2500, 'DISBURSED', 
                 'Minor on-site laceration needing tetanus shot and wound dressing after handling rusted water main pipe.', 
                 'CLINIC-RECEIPT-9921.pdf', 'Approved and disbursed immediately under Cooperative Welfare Emergency Relief Scheme.', 
                 CURRENT_TIMESTAMP)
            `, [w6Id]);

            await pool.query(`
                INSERT INTO welfare_pool_ledger (society_id, entry_type, amount, worker_id, reference_id, description)
                VALUES (1, 'OUTFLOW_EMERGENCY_GRANT', 2500.0, $1, 'CLM-2026-0002', 'Disbursed Emergency Medical Welfare Grant')
            `, [w6Id]);
        }

        console.log("[Database] Seeded PostgreSQL verified demo workers and welfare records.");
    }

    console.log("[Database] PostgreSQL schema and seeds verified.");
}

// Auto-run SQLite init synchronously on load if in SQLite mode
if (!isPg) {
    try {
        initSQLite();
    } catch (err) {
        console.error("[Database] SQLite init error:", err.message);
    }
}

module.exports = db;

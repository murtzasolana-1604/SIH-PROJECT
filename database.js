const Database = require("better-sqlite3");

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

console.log("Database connected successfully!");

module.exports = db;
const db = require("../database");

const SERVICE_PRICES = {
    Electrician: 249,
    Plumber: 279,
    Carpenter: 349,
    Painter: 319,
    Cleaner: 249,
    Driver: 449,
    Caregiver: 399,
    Technician: 299
};
const DEFAULT_PRICE = 299;
const EMERGENCY_SURCHARGE = 50;

/**
 * Calculates Great-Circle Distance (Haversine Formula) between two coordinates in kilometers.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371; // Earth's mean radius in km
    const p1 = Number(lat1) * Math.PI / 180;
    const p2 = Number(lat2) * Math.PI / 180;
    const deltaLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
    const deltaLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.round(dist * 10) / 10;
}

/**
 * 1-Click SOS Rapid Emergency Booking Dispatch
 */
function triggerEmergencySOS(req, res) {
    const {
        service, customerName, customerPhone, address,
        customerLat, customerLng, emergencyType, targetResponseMins
    } = req.body;

    if (!service || !customerPhone || !address) {
        return res.status(400).json({
            success: false,
            message: "Emergency service trade, customer phone, and address are required."
        });
    }

    const cName = customerName && customerName.trim() ? customerName.trim() : "Emergency Citizen Requester";
    const now = new Date();
    const bookingDate = now.toISOString().split("T")[0];
    const bookingTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const eType = emergencyType || "Critical Emergency Immediate Assistance";
    const targetSLA = Number(targetResponseMins) || 30;

    const result = db.prepare(`
        INSERT INTO bookings
        (service, customer_name, customer_phone, address, booking_date, booking_time,
         is_emergency, customer_lat, customer_lng, emergency_type, target_response_mins)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(
        service, cName, customerPhone, address, bookingDate, bookingTime,
        customerLat ? Number(customerLat) : null,
        customerLng ? Number(customerLng) : null,
        eType, targetSLA
    );

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid);

    // Geospatial & Availability Proximity Matching
    const candidateWorkers = db.prepare(`
        SELECT id, name, phone, skill, experience, location, village_town, city, state,
               latitude, longitude, certification, welfare_status, is_available, verified
        FROM workers
        WHERE skill = ? AND is_available = 1
    `).all(service);

    const rankedWorkers = candidateWorkers.map(w => {
        let distanceKm = null;
        if (booking.customer_lat && booking.customer_lng && w.latitude && w.longitude) {
            distanceKm = calculateHaversineDistance(
                booking.customer_lat, booking.customer_lng,
                w.latitude, w.longitude
            );
        } else if (booking.address && (w.location || w.city)) {
            // Textual location proximity fallback
            const addrLower = booking.address.toLowerCase();
            const workerLoc = (w.location || "").toLowerCase();
            const workerCity = (w.city || "").toLowerCase();
            if (workerLoc && addrLower.includes(workerLoc)) distanceKm = 1.8;
            else if (workerCity && addrLower.includes(workerCity)) distanceKm = 4.5;
            else distanceKm = 6.0;
        } else {
            distanceKm = 5.0; // Default nominal distance in metro area
        }

        const etaMins = Math.max(10, Math.min(60, Math.round((distanceKm || 3) * 3.2 + 8)));

        return {
            id: w.id,
            name: w.name,
            phone: w.phone,
            skill: w.skill,
            location: w.location || w.city || "Local Ward",
            distance_km: distanceKm,
            estimated_eta_mins: etaMins,
            certification: w.certification,
            welfare_status: w.welfare_status,
            verified: w.verified === 1
        };
    }).sort((a, b) => {
        if (a.verified !== b.verified) return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
        if (a.distance_km == null && b.distance_km == null) return 0;
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
    });

    const basePrice = SERVICE_PRICES[service] || DEFAULT_PRICE;
    const totalAmount = basePrice + EMERGENCY_SURCHARGE;
    const workerEarning = Math.round(totalAmount * 0.85 * 100) / 100;
    const coopShare = Math.round(totalAmount * 0.15 * 100) / 100;

    return res.status(201).json({
        success: true,
        message: `🚨 Emergency dispatch registered for ${service}! Priority broadcast transmitted to nearby cooperative members.`,
        booking,
        nearest_worker: rankedWorkers[0] || null,
        candidate_count: rankedWorkers.length,
        ranked_workers: rankedWorkers.slice(0, 5),
        pricing: {
            service,
            base_wage: basePrice,
            rapid_mobilization_fee: EMERGENCY_SURCHARGE,
            total_amount: totalAmount,
            worker_direct_earning: workerEarning,
            cooperative_welfare_share: coopShare,
            pricing_guarantee: "Fixed ₹50 rapid mobilization fee. Zero private middleman surge pricing."
        }
    });
}

/**
 * Real-time Emergency Queue with SLA Monitoring
 */
function getEmergencyQueue(req, res) {
    const rows = db.prepare(`
        SELECT b.*,
               w.name AS worker_name,
               w.phone AS worker_phone,
               w.skill AS worker_skill,
               w.location AS worker_location
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        WHERE b.is_emergency = 1 AND b.status IN ('Pending', 'Assigned', 'In Progress')
        ORDER BY b.id DESC
    `).all();

function parseSqliteUtc(dateStr) {
    if (!dateStr) return Date.now();
    const iso = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    return new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime();
}

    const now = Date.now();
    const queue = rows.map(b => {
        const createdTime = parseSqliteUtc(b.created_at);
        const elapsedMins = Math.max(0, Math.floor((now - createdTime) / 60000));
        const targetMins = b.target_response_mins || 30;
        const remainingMins = Math.max(0, targetMins - elapsedMins);
        const slaBreached = elapsedMins > targetMins;

        return {
            ...b,
            elapsed_minutes: elapsedMins,
            remaining_minutes: remainingMins,
            sla_breached: slaBreached,
            urgency_level: slaBreached ? "CRITICAL_BREACH" : elapsedMins > 15 ? "HIGH_PRIORITY" : "STANDARD_EMERGENCY"
        };
    });

    return res.json({
        success: true,
        count: queue.length,
        critical_count: queue.filter(q => q.sla_breached).length,
        queue
    });
}

/**
 * Admin Instant Override / Standby Reassignment
 */
function reassignEmergency(req, res) {
    const bookingId = Number(req.params.id);
    const { workerId } = req.body;

    if (!workerId) {
        return res.status(400).json({ success: false, message: "workerId is required." });
    }

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const worker = db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    db.prepare(`
        UPDATE bookings
        SET assigned_worker_id = ?,
            status = 'Assigned',
            dispatched_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(workerId, bookingId);

    const updated = db.prepare(`
        SELECT b.*, w.name AS worker_name, w.phone AS worker_phone, w.skill AS worker_skill
        FROM bookings b
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        WHERE b.id = ?
    `).get(bookingId);

    return res.json({
        success: true,
        message: `Emergency booking #${bookingId} successfully reassigned to ${worker.name} (📞 ${worker.phone}).`,
        booking: updated
    });
}

module.exports = {
    calculateHaversineDistance,
    triggerEmergencySOS,
    getEmergencyQueue,
    reassignEmergency
};

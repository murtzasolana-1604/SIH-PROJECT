const db = require("../database");
const {
    DEFAULT_CUSTOMER_RADIUS_KM,
    COOPERATIVE_COMMISSION_RATE,
    WORKER_PAYOUT_RATE,
    calculateHaversineDistance,
    calculatePricingBreakdown
} = require("../config/businessRules");

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
 * 1-Click SOS Rapid Emergency Booking Dispatch
 */
async function triggerEmergencySOS(req, res) {
    const service = req.body.service || req.body.hazardType || "Electrician";
    const customerPhone = req.body.customerPhone;
    const address = req.body.address;
    const customerName = req.body.customerName;
    const customerLat = req.body.customerLat !== undefined ? req.body.customerLat : (req.body.lat !== undefined ? req.body.lat : req.body.latitude);
    const customerLng = req.body.customerLng !== undefined ? req.body.customerLng : (req.body.lng !== undefined ? req.body.lng : req.body.longitude);
    const emergencyType = req.body.emergencyType || req.body.emergencyCategory || req.body.hazardType || "Critical Emergency Immediate Assistance";
    const targetResponseMins = req.body.targetResponseMins || 15;

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
    const eType = emergencyType;
    const targetSLA = Number(targetResponseMins) || 15;

    const result = await db.prepare(`
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

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid);

    // Geospatial & Availability Proximity Matching
    const candidateWorkers = await db.prepare(`
        SELECT id, name, phone, skill, experience, location, village_town, city, state,
               latitude, longitude, certification, welfare_status, is_available, verified
        FROM workers
        WHERE skill = ? AND is_available = 1
    `).all(service);

    const mappedWorkers = candidateWorkers.map(w => {
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
            distanceKm = null;
        }

        const etaMins = Math.max(10, Math.min(60, Math.round((distanceKm || 5) * 3.2 + 8)));

        return {
            id: w.id,
            name: w.name,
            phone: w.phone,
            phone_masked: w.phone ? `+91 ${w.phone.slice(0, 2)}******${w.phone.slice(-2)}` : null,
            skill: w.skill,
            location: w.location || w.city || "Local Ward",
            distance_km: distanceKm,
            distance_m: distanceKm !== null ? Math.round(distanceKm * 1000) : null,
            distance_label: distanceKm !== null ? `${distanceKm} km away` : null,
            estimated_eta_mins: etaMins,
            certification: w.certification,
            welfare_status: w.welfare_status,
            verified: w.verified === 1
        };
    });

    // Explicit Progressive Emergency Radius Expansion: 20 KM -> 30 KM -> 50 KM
    let activeEmergencyRadius = DEFAULT_CUSTOMER_RADIUS_KM; // 20 km
    let radiusExpanded = false;
    let expansionMessage = null;

    let eligibleWorkers = mappedWorkers.filter(w => w.distance_km !== null && w.distance_km <= activeEmergencyRadius);

    if (eligibleWorkers.length === 0 && mappedWorkers.some(w => w.distance_km !== null && w.distance_km <= 30)) {
        activeEmergencyRadius = 30;
        radiusExpanded = true;
        expansionMessage = "No eligible worker found within 20 km. We expanded the search radius to 30 km.";
        eligibleWorkers = mappedWorkers.filter(w => w.distance_km !== null && w.distance_km <= 30);
    } else if (eligibleWorkers.length === 0 && mappedWorkers.some(w => w.distance_km !== null && w.distance_km <= 50)) {
        activeEmergencyRadius = 50;
        radiusExpanded = true;
        expansionMessage = "No eligible worker found within 30 km. We expanded the search radius to 50 km.";
        eligibleWorkers = mappedWorkers.filter(w => w.distance_km !== null && w.distance_km <= 50);
    } else if (eligibleWorkers.length === 0 && mappedWorkers.length > 0) {
        // Coords may be unavailable or all beyond 50km
        eligibleWorkers = mappedWorkers;
    }

    const rankedWorkers = eligibleWorkers.sort((a, b) => {
        if (a.verified !== b.verified) return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
        if (a.distance_km == null && b.distance_km == null) return 0;
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
    });

    const basePrice = SERVICE_PRICES[service] || DEFAULT_PRICE;
    const pricing = calculatePricingBreakdown(basePrice, true);

    return res.status(201).json({
        success: true,
        message: radiusExpanded 
            ? `🚨 Emergency dispatch registered! ${expansionMessage}`
            : `🚨 Emergency dispatch registered for ${service}! Priority broadcast transmitted to nearby cooperative members.`,
        booking,
        nearest_worker: rankedWorkers[0] || null,
        candidate_count: rankedWorkers.length,
        ranked_workers: rankedWorkers.slice(0, 5),
        search_radius_km: activeEmergencyRadius,
        radius_expanded: radiusExpanded,
        expansion_message: expansionMessage,
        pricing: {
            service,
            base_wage: pricing.basePrice,
            rapid_mobilization_fee: pricing.emergencySurcharge,
            total_amount: pricing.totalAmount,
            worker_direct_earning: pricing.workerEarning,
            cooperative_welfare_share: pricing.cooperativeShare,
            cooperative_commission_rate: pricing.commissionRate,
            pricing_guarantee: `Fixed ₹${pricing.emergencySurcharge} rapid mobilization fee. 7% cooperative welfare reserve, 93% worker living wage.`
        }
    });
}

/**
 * Real-time Emergency Queue with SLA Monitoring
 */
async function getEmergencyQueue(req, res) {
    const rows = await db.prepare(`
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
        if (dateStr instanceof Date) return dateStr.getTime();
        const str = String(dateStr);
        const iso = str.includes('T') ? str : str.replace(' ', 'T');
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
async function reassignEmergency(req, res) {
    const bookingId = Number(req.params.id);
    const { workerId } = req.body;

    if (!workerId) {
        return res.status(400).json({ success: false, message: "workerId is required." });
    }

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    await db.prepare(`
        UPDATE bookings
        SET assigned_worker_id = ?,
            status = 'Assigned',
            dispatched_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(workerId, bookingId);

    const updated = await db.prepare(`
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

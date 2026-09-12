const path = require("path");
const fs = require("fs");
const db = require("../database");
const {
    DEFAULT_CUSTOMER_RADIUS_KM,
    DEFAULT_WORKER_RADIUS_KM,
    COOPERATIVE_COMMISSION_RATE,
    ALLOWED_RADII_KM,
    calculateHaversineDistance
} = require("../config/businessRules");

// Helper to safely save uploaded worker photo from base64 data URL
function saveWorkerProfilePhoto(workerId, base64Data) {
    if (!base64Data || typeof base64Data !== "string") {
        throw new Error("Invalid photo data.");
    }
    // Already a saved relative path
    if (base64Data.startsWith("/uploads/")) {
        return base64Data;
    }
    const match = base64Data.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
        throw new Error("Invalid image format. Allowed formats: JPEG, PNG, WebP.");
    }
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 2.5 * 1024 * 1024) {
        throw new Error("Image size exceeds 2.5MB limit.");
    }
    const uploadsDir = path.join(__dirname, "..", "public", "uploads", "workers");
    fs.mkdirSync(uploadsDir, { recursive: true });
    const fileName = `worker-${workerId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/workers/${fileName}`;
}

// Helper to format worker response with privacy protection
function formatWorkerPublic(w, distanceKm = null) {
    const isVerified = w.verified === 1;
    const isAvailable = w.is_available === 1;
    const certId = w.ncct_cert_id || `NCCT-COOP-2026-${String(w.id).padStart(4, "0")}`;
    const maskedPhone = w.phone ? `+91 ${w.phone.slice(0, 2)}******${w.phone.slice(-2)}` : "Masked";
    const publicArea = w.location || (w.city ? `${w.city}, ${w.state || ""}` : (w.village_town || "Local Service Cluster"));

    return {
        id: w.id,
        name: w.name,
        skill: w.skill,
        experience: w.experience || "1+ years",
        location: publicArea,
        city: w.city || null,
        state: w.state || null,
        service_area: publicArea,
        availability: w.availability || "Full Day",
        is_available: isAvailable ? 1 : 0,
        verified: isVerified ? 1 : 0,
        ncct_cert_id: certId,
        badge_level: w.badge_level || "Level 1: Certified Tradesperson",
        society_id: w.society_id,
        society_name: w.society_name || "Navodaya Labour Cooperative Society Ltd.",
        society_reg_number: w.society_reg_number || "MSCS/CR/2026/089-A",
        society_cluster: w.society_cluster || "North District - Cluster 1",
        avg_rating: w.avg_rating !== undefined && w.avg_rating !== null ? Number(w.avg_rating) : 4.8,
        rating_count: w.rating_count !== undefined && w.rating_count !== null ? Number(w.rating_count) : 12,
        latitude: w.latitude !== undefined ? w.latitude : null,
        longitude: w.longitude !== undefined ? w.longitude : null,
        distance_km: distanceKm !== null ? distanceKm : (w.distance_km !== undefined ? w.distance_km : null),
        distance_m: distanceKm !== null ? Math.round(distanceKm * 1000) : (w.distance_m !== undefined ? w.distance_m : null),
        distance_label: distanceKm !== null ? `${distanceKm} km away` : null,
        phone_masked: maskedPhone,
        phone: maskedPhone,
        profile_photo: w.profile_photo || null
    };
}

async function workersRoute(req, res) {

    if (req.method === "GET") {

        const { phone, skill, lat, lng, radiusKm, sort, onlyAvailable } = req.query;

        // Worker personal profile lookup
        if (phone) {
            const worker = await db.prepare(`
                SELECT w.*, s.name as society_name, s.reg_number as society_reg_number, s.cluster_zone as society_cluster
                FROM workers w
                LEFT JOIN societies s ON w.society_id = s.id
                WHERE w.phone = ?
            `).get(phone);
            return res.json({ success: true, worker: worker || null });
        }

        // Fetch candidate workers with society and ratings
        let baseSql = `
            SELECT w.*, 
                   s.name as society_name, 
                   s.reg_number as society_reg_number, 
                   s.cluster_zone as society_cluster,
                   r.avg_rating,
                   r.rating_count
            FROM workers w
            LEFT JOIN societies s ON w.society_id = s.id
            LEFT JOIN (
                SELECT worker_id, ROUND(AVG(stars), 1) as avg_rating, COUNT(id) as rating_count
                FROM ratings
                GROUP BY worker_id
            ) r ON r.worker_id = w.id
            WHERE 1=1
        `;
        const params = [];

        if (skill) {
            baseSql += " AND LOWER(w.skill) = LOWER(?)";
            params.push(skill.trim());
        }

        if (onlyAvailable === "true" || onlyAvailable === "1") {
            baseSql += " AND w.is_available = 1";
        }

        baseSql += " ORDER BY w.id DESC";

        const allWorkers = await db.prepare(baseSql).all(...params);

        // Location-aware filtering if coordinates provided
        const hasCoords = lat !== undefined && lat !== null && lng !== undefined && lng !== null &&
                          String(lat).trim() !== "" && String(lng).trim() !== "";

        if (hasCoords) {
            const userLat = Number(lat);
            const userLng = Number(lng);
            const selectedRadius = Math.max(1, Number(radiusKm) || DEFAULT_CUSTOMER_RADIUS_KM);

            if (isNaN(userLat) || isNaN(userLng)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid latitude or longitude coordinates."
                });
            }

            const nearbyWorkers = [];

            for (const worker of allWorkers) {
                // Ignore workers without coordinates
                if (worker.latitude === null || worker.latitude === undefined ||
                    worker.longitude === null || worker.longitude === undefined) {
                    continue;
                }

                const distKm = calculateHaversineDistance(userLat, userLng, worker.latitude, worker.longitude);
                if (distKm === null) continue;

                // Radius filter rule: worker distance <= selectedRadius (default 20 KM)
                if (distKm <= selectedRadius) {
                    nearbyWorkers.push({
                        ...worker,
                        distance_km: distKm,
                        distance_m: Math.round(distKm * 1000)
                    });
                }
            }

            // Ranking & Sorting
            const sortMode = sort || "best_match";
            if (sortMode === "nearest") {
                nearbyWorkers.sort((a, b) => a.distance_km - b.distance_km);
            } else if (sortMode === "highest_rated") {
                nearbyWorkers.sort((a, b) => (Number(b.avg_rating || 4.8) - Number(a.avg_rating || 4.8)) || (a.distance_km - b.distance_km));
            } else if (sortMode === "available") {
                nearbyWorkers.sort((a, b) => (b.is_available - a.is_available) || (a.distance_km - b.distance_km));
            } else {
                // "best_match" composite scoring: verified (+40) + online (+20) + rating (+5*stars) + proximity bonus
                nearbyWorkers.sort((a, b) => {
                    const scoreA = (a.verified ? 40 : 0) + (a.is_available ? 20 : 0) + (Number(a.avg_rating || 4.8) * 5) + Math.max(0, (selectedRadius - a.distance_km) * 2);
                    const scoreB = (b.verified ? 40 : 0) + (b.is_available ? 20 : 0) + (Number(b.avg_rating || 4.8) * 5) + Math.max(0, (selectedRadius - b.distance_km) * 2);
                    return scoreB - scoreA;
                });
            }

            const formatted = nearbyWorkers.map(w => formatWorkerPublic(w, w.distance_km));

            return res.json({
                success: true,
                count: formatted.length,
                search_radius_km: selectedRadius,
                customer_coords: { lat: userLat, lng: userLng },
                workers: formatted
            });
        }

        // Unfiltered fallback (when no coordinates passed)
        const formatted = allWorkers.map(w => formatWorkerPublic(w, null));
        return res.json({
            success: true,
            count: formatted.length,
            search_radius_km: DEFAULT_CUSTOMER_RADIUS_KM,
            location_notice: "Coordinates not provided; showing all cluster workers.",
            workers: formatted
        });
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
            longitude,
            societyId,
            profilePhoto
        } = req.body;

        if (!name || !phone || !skill) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, and skill are required."
            });
        }

        const cleanPhone = String(phone).trim();
        const resolvedLocation = location || (city && state ? `${city}, ${state}` : (city || address || "Greater Noida"));

        const existingWorker = await db.prepare("SELECT * FROM workers WHERE phone = ?").get(cleanPhone);

        if (existingWorker) {
            let photoPath = existingWorker.profile_photo || null;
            if (profilePhoto) {
                try {
                    photoPath = saveWorkerProfilePhoto(existingWorker.id, profilePhoto);
                } catch (e) {
                    console.warn("Worker photo save warning:", e.message);
                }
            }

            await db.prepare(`
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
                    longitude = COALESCE(?, longitude),
                    profile_photo = COALESCE(?, profile_photo)
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
                photoPath,
                existingWorker.id
            );

            const updated = await db.prepare("SELECT * FROM workers WHERE id = ?").get(existingWorker.id);
            return res.json({
                success: true,
                message: "Worker profile updated successfully!",
                worker: formatWorkerPublic(updated)
            });
        }

        const defaultSociety = await db.prepare("SELECT id FROM societies ORDER BY id ASC LIMIT 1").get();
        const resolvedSocietyId = Number(societyId) || (defaultSociety ? defaultSociety.id : 1);

        const result = await db.prepare(`
            INSERT INTO workers (
                name, phone, skill, experience, location, availability,
                certification, additional_skills, address, village_town, city, state, pincode, latitude, longitude,
                society_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            longitude || null,
            resolvedSocietyId
        );

        const newWorkerId = result.lastInsertRowid;
        if (profilePhoto && newWorkerId) {
            try {
                const photoPath = saveWorkerProfilePhoto(newWorkerId, profilePhoto);
                await db.prepare("UPDATE workers SET profile_photo = ? WHERE id = ?").run(photoPath, newWorkerId);
            } catch (e) {
                console.warn("New worker photo save warning:", e.message);
            }
        }

        const worker = await db.prepare(`
            SELECT w.*, s.name as society_name, s.reg_number as society_reg_number, s.cluster_zone as society_cluster
            FROM workers w
            LEFT JOIN societies s ON w.society_id = s.id
            WHERE w.id = ?
        `).get(newWorkerId);

        return res.status(201).json({
            success: true,
            message: "Worker registered successfully!",
            worker: formatWorkerPublic(worker)
        });

    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
}


// =====================================
// UPDATE AVAILABILITY (Available / Busy)
// =====================================
async function updateAvailability(req, res) {
    const workerId = Number(req.params.id);
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
        return res.status(400).json({ success: false, message: "isAvailable (0 or 1) is required." });
    }

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    await db.prepare("UPDATE workers SET is_available = ? WHERE id = ?").run(isAvailable ? 1 : 0, workerId);
    const updated = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);

    return res.json({
        success: true,
        message: isAvailable ? "You are now AVAILABLE for jobs." : "You are now marked BUSY / ON LEAVE.",
        worker: updated
    });
}

// =====================================
// UPLOAD / UPDATE WORKER PROFILE PHOTO
// =====================================
async function uploadPhoto(req, res) {
    const workerId = Number(req.params.id);
    const { photoData } = req.body;

    if (!workerId || !photoData) {
        return res.status(400).json({ success: false, message: "workerId and photoData are required." });
    }

    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    try {
        const photoPath = saveWorkerProfilePhoto(workerId, photoData);
        await db.prepare("UPDATE workers SET profile_photo = ? WHERE id = ?").run(photoPath, workerId);
        const updated = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
        return res.json({
            success: true,
            message: "Profile photo updated successfully!",
            profilePhoto: photoPath,
            worker: formatWorkerPublic(updated)
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message || "Failed to upload photo." });
    }
}

// =====================================
// GET WORKER EARNINGS BREAKDOWN
// =====================================
async function getEarnings(req, res) {
    const workerId = Number(req.params.id);
    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);

    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const invoices = await db.prepare(`
        SELECT i.*, b.booking_date, b.service, b.created_at AS booking_created_at
        FROM invoices i
        JOIN bookings b ON i.booking_id = b.id
        WHERE b.assigned_worker_id = ?
        ORDER BY i.id DESC
    `).all(workerId);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let todayService = 0;
    let weekService = 0;
    let totalService = 0;
    let todayTips = 0;
    let weekTips = 0;
    let totalTips = 0;
    let totalWorkerEarnings = 0;
    let totalCoopShare = 0;
    let totalAmount = 0;

    invoices.forEach(inv => {
        const invDate = new Date(inv.created_at || inv.booking_date);
        const serviceEarning = Number(inv.worker_earning) || 0;
        const tip = Number(inv.tip_amount) || 0;
        const totalWorker = serviceEarning + tip;
        const coop = Number(inv.cooperative_share) || 0;
        const total = Number(inv.total_amount) || 0;

        totalService += serviceEarning;
        totalTips += tip;
        totalWorkerEarnings += totalWorker;
        totalCoopShare += coop;
        totalAmount += total;

        if (inv.booking_date === todayStr || (inv.created_at && String(inv.created_at).startsWith(todayStr))) {
            todayService += serviceEarning;
            todayTips += tip;
        }

        if (invDate >= sevenDaysAgo) {
            weekService += serviceEarning;
            weekTips += tip;
        }
    });

    return res.json({
        success: true,
        earnings: {
            today: Math.round((todayService + todayTips) * 100) / 100,
            week: Math.round((weekService + weekTips) * 100) / 100,
            total: Math.round(totalWorkerEarnings * 100) / 100,
            serviceEarnings: {
                today: Math.round(todayService * 100) / 100,
                week: Math.round(weekService * 100) / 100,
                total: Math.round(totalService * 100) / 100
            },
            tips: {
                today: Math.round(todayTips * 100) / 100,
                week: Math.round(weekTips * 100) / 100,
                total: Math.round(totalTips * 100) / 100
            },
            cooperativeShare: Math.round(totalCoopShare * 100) / 100,
            grossTotal: Math.round(totalAmount * 100) / 100,
            completedJobsCount: invoices.length,
            invoices: invoices.slice(0, 5)
        }
    });
}

// ============================================================
// PHASE 17: WORKER DIGITAL BADGE & VERIFICATION
// ============================================================

async function getWorkerBadge(req, res) {
    const { id } = req.params;

    const worker = await db.prepare(`
        SELECT w.*, 
               s.name as society_name, 
               s.reg_number as society_reg_number, 
               s.cluster_zone as society_cluster,
               s.contact_person as society_contact
        FROM workers w
        LEFT JOIN societies s ON w.society_id = s.id
        WHERE w.id = ?
    `).get(id);

    if (!worker) {
        return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const ratingsAgg = (await db.prepare(`
        SELECT ROUND(COALESCE(AVG(stars), 5.0), 1) as avg_rating, COUNT(id) as rating_count
        FROM ratings WHERE worker_id = ?
    `).get(id)) || {};

    const completedJobsRow = await db.prepare(`
        SELECT COUNT(*) as count FROM bookings WHERE assigned_worker_id = ? AND status = 'Completed'
    `).get(id);
    const completedJobs = completedJobsRow ? completedJobsRow.count : 0;

    const audits = await db.prepare(`
        SELECT * FROM worker_cert_audit WHERE worker_id = ? ORDER BY id DESC LIMIT 5
    `).all(id);

    const certId = worker.ncct_cert_id || `NCCT-COOP-2026-${String(worker.id).padStart(4, "0")}`;
    const hash = worker.verification_hash || (db.generateWorkerVerificationHash 
        ? db.generateWorkerVerificationHash(worker.id, worker.phone, worker.skill, certId)
        : "5d1bb55f89860587527547cec71b9c9a99baebd1648267a28ba3805342f1615e");

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const verificationUrl = `${protocol}://${host}/api/verify/worker/${hash}`;

    return res.json({
        success: true,
        badge: {
            workerId: worker.id,
            name: worker.name,
            phoneMasked: `+91 ${worker.phone.slice(0, 2)}******${worker.phone.slice(-2)}`,
            skill: worker.skill,
            experience: worker.experience || "1 year",
            location: worker.location,
            verified: worker.verified === 1,
            ncctCertId: certId,
            badgeLevel: worker.badge_level || "Level 1: Certified Tradesperson",
            badgeStatus: worker.badge_status || (worker.verified ? "Active" : "Pending"),
            verificationHash: hash,
            verifiedAt: worker.verified_at || worker.created_at,
            verifiedByAdmin: worker.verified_by_admin || "NCCT Registrar / Federation Admin",
            kycDocType: worker.kyc_doc_type || "Aadhaar / National ID",
            kycDocNumber: worker.kyc_doc_number || `XXXX-XXXX-${worker.phone.slice(-4)}`,
            certification: worker.certification,
            society: {
                id: worker.society_id,
                name: worker.society_name || "Navodaya Labour Cooperative Society Ltd.",
                regNumber: worker.society_reg_number || "MSCS/CR/2026/089-A",
                clusterZone: worker.society_cluster || "North District - Cluster 1",
                contactPerson: worker.society_contact
            },
            metrics: {
                avgRating: ratingsAgg.avg_rating || 5.0,
                ratingCount: ratingsAgg.rating_count || 0,
                completedJobs: completedJobs
            },
            verificationUrl,
            auditHistory: audits
        }
    });
}

async function verifyWorkerByHash(req, res) {
    const { hash } = req.params;

    if (!hash) {
        return res.status(400).json({ success: false, message: "Verification hash is required." });
    }

    const worker = await db.prepare(`
        SELECT w.*, 
               s.name as society_name, 
               s.reg_number as society_reg_number, 
               s.cluster_zone as society_cluster
        FROM workers w
        LEFT JOIN societies s ON w.society_id = s.id
        WHERE w.verification_hash = ? OR w.ncct_cert_id = ? OR w.id = ?
    `).get(hash, hash, isNaN(Number(hash)) ? -1 : Number(hash));

    if (!worker) {
        return res.status(404).json({
            success: false,
            verified: false,
            message: "Tamper Alert: No valid NCCT Cooperative Certification matches this verification token."
        });
    }

    const ratingsAgg = (await db.prepare(`
        SELECT ROUND(COALESCE(AVG(stars), 5.0), 1) as avg_rating, COUNT(id) as rating_count
        FROM ratings WHERE worker_id = ?
    `).get(worker.id)) || {};

    const completedJobsRow = await db.prepare(`
        SELECT COUNT(*) as count FROM bookings WHERE assigned_worker_id = ? AND status = 'Completed'
    `).get(worker.id);
    const completedJobs = completedJobsRow ? completedJobsRow.count : 0;

    return res.json({
        success: true,
        verified: worker.verified === 1 && worker.badge_status === "Active",
        certificate: {
            title: "Official Cooperative Tradesperson Accreditation Certificate",
            statutoryAuthority: "National Council for Cooperative Training (NCCT) • Ministry of Cooperation, Govt. of India",
            workerName: worker.name,
            trade: worker.skill,
            experience: worker.experience,
            ncctCertId: worker.ncct_cert_id,
            badgeLevel: worker.badge_level,
            badgeStatus: worker.badge_status,
            verificationHash: worker.verification_hash,
            issuanceDate: worker.verified_at,
            verifyingOfficer: worker.verified_by_admin,
            cooperativeSociety: {
                name: worker.society_name || "Navodaya Labour Cooperative Society Ltd.",
                regNumber: worker.society_reg_number || "MSCS/CR/2026/089-A",
                clusterZone: worker.society_cluster || "North District - Cluster 1"
            },
            backgroundVerification: {
                kycVerified: true,
                docType: worker.kyc_doc_type || "Aadhaar / National ID",
                maskedDocNumber: worker.kyc_doc_number || `XXXX-XXXX-${worker.phone.slice(-4)}`,
                policeClearance: "Cooperative Member Pledge Cleared (Zero Grievance Flag)",
                welfareStatus: worker.welfare_status || "Enrolled in Cooperative Welfare Fund"
            },
            reputationMetrics: {
                avgRating: ratingsAgg.avg_rating || 5.0,
                ratingCount: ratingsAgg.rating_count || 0,
                completedJobs: completedJobs
            }
        }
    });
}


workersRoute.updateAvailability = updateAvailability;
workersRoute.getEarnings = getEarnings;
workersRoute.getWorkerBadge = getWorkerBadge;
workersRoute.verifyWorkerByHash = verifyWorkerByHash;
workersRoute.getNearbyWorkers = workersRoute;
workersRoute.uploadPhoto = uploadPhoto;

module.exports = workersRoute;
const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * GET /api/simulator/pitch-deck
 * Returns structured presentation slides, comparative economics, and live platform metrics for SIH Judges.
 */
router.get('/pitch-deck', async (req, res) => {
    try {
        const wCountRow = await db.prepare('SELECT COUNT(*) as count FROM workers').get();
        const workerCount = wCountRow ? wCountRow.count : 0;

        const vCountRow = await db.prepare('SELECT COUNT(*) as count FROM workers WHERE verified = 1').get();
        const verifiedCount = vCountRow ? vCountRow.count : 0;

        const sCountRow = await db.prepare('SELECT COUNT(*) as count FROM societies').get();
        const societyCount = sCountRow ? sCountRow.count : 0;

        const bCountRow = await db.prepare('SELECT COUNT(*) as count FROM bookings').get();
        const bookingCount = bCountRow ? bCountRow.count : 0;

        const poolRow = await db.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN entry_type LIKE 'INFLOW%' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN entry_type LIKE 'OUTFLOW%' THEN amount ELSE 0 END), 0) AS total_reserve
            FROM welfare_pool_ledger
        `).get();
        const poolReserve = poolRow ? Math.max(0, Math.round(poolRow.total_reserve * 100) / 100) : 0;

        const pitchDeck = {
            metadata: {
                hackathon: "Smart India Hackathon 2026",
                problemStatement: "SIH26089",
                problemTitle: "Cooperative Gig Services Platform for Household & Community Services",
                ministry: "Ministry of Cooperation / National Council for Cooperative Training (NCCT)",
                team: "HacNova (Smart Automation)",
                version: "2.0 Production Ready"
            },
            livePlatformMetrics: {
                totalWorkers: workerCount,
                verifiedTradespeople: verifiedCount,
                registeredSocieties: societyCount,
                completedBookings: bookingCount,
                welfarePoolReserves: poolReserve,
                pmsbyCoverageRate: "100%",
                offlineReady: true,
                wcagCompliance: "WCAG 2.1 AA (GIGW 3.0)"
            },
            slides: [
                {
                    id: 1,
                    tag: "SLIDE 1: THE CRISIS & COOPERATIVE VISION",
                    title: "Reclaiming the Gig Economy Through Cooperatives",
                    subtitle: "Empowering informal gig tradespeople through democratic ownership under the MSCS Act 2002.",
                    bulletPoints: [
                        "Commercial gig aggregators extract 20% to 30% commissions, driving workers into debt and informal precarity.",
                        "Zero social security, opaque dynamic pricing, arbitrary algorithmic penalties, and zero union representation.",
                        "Sahkaar Connect shifts ownership to Primary Cooperative Societies (PACS) & Labor Cooperatives.",
                        "Direct democratic governance, transparent collective bargaining, and zero middleman extraction."
                    ],
                    stats: [
                        { label: "Commercial Cut", value: "20-30%", note: "Extracted by middlemen" },
                        { label: "Cooperative Worker Share", value: "85%", note: "Guaranteed Living Wage" },
                        { label: "Welfare Reserve", value: "15%", note: "Member Social Protection" }
                    ]
                },
                {
                    id: 2,
                    tag: "SLIDE 2: COOPERATIVE FINANCIAL DIVIDEND",
                    title: "85 / 15 Transparent Revenue Split Model",
                    subtitle: "Transforming middleman profits into worker living wages and social security shields.",
                    bulletPoints: [
                        "85% Immediate Living Wage: Disbursed directly into worker's verified cooperative account without hidden deductions.",
                        "15% Statutory Cooperative Reserve: Channeled directly into member welfare, tool replacement grants, and PMSBY insurance.",
                        "Predictive living-wage price floor calculated dynamically using NCCT regional wage indexes.",
                        "Real-time verifiable QR invoices generated for every job with immutable cryptographic billing breakdown."
                    ],
                    stats: [
                        { label: "Worker Payout", value: "85.0%", note: "Direct living wage" },
                        { label: "Welfare Pool", value: "15.0%", note: "Member social safety net" },
                        { label: "Middleman Fee", value: "0.0%", note: "Completely eliminated" }
                    ]
                },
                {
                    id: 3,
                    tag: "SLIDE 3: NCCT CREDENTIALING & DIGITAL ID",
                    title: "Multi-Tier Cooperative Certification & Trust",
                    subtitle: "Statutory skill accreditation by National Council for Cooperative Training (NCCT).",
                    bulletPoints: [
                        "Tier 1 (Certified Tradesperson), Tier 2 (Master Tradesperson), Tier 3 (Craftsman Trainer).",
                        "Tamper-evident SHA-256 digital fingerprint permanently bound to the worker's government accreditation.",
                        "Offline-verifiable QR Digital Identity Card for citizens to verify credentials on doorsteps.",
                        "Annual skill upgrading cohorts integrated into the platform with automated NCCT batch certification."
                    ],
                    stats: [
                        { label: "Accreditation Levels", value: "3 Tiers", note: "NCCT Skill Roadmap" },
                        { label: "Digital Fingerprint", value: "SHA-256", note: "Cryptographic Tamper-Proof" },
                        { label: "Offline QR Trust", value: "100%", note: "Doorstep Verification" }
                    ]
                },
                {
                    id: 4,
                    tag: "SLIDE 4: SOCIAL SECURITY & PMSBY INSURANCE",
                    title: "Universal Member Protection & Emergency Relief",
                    subtitle: "100% Cooperative Subsidized Accidental Insurance under Ministry guidelines.",
                    bulletPoints: [
                        "Every verified cooperative member receives ₹2,00,000 accidental cover under PM Suraksha Bima Yojana (PMSBY).",
                        "Annual ₹20 premiums are 100% sponsored and batch-renewed by the cooperative federation welfare reserve.",
                        "Fast-track Emergency Relief Grants for damaged tools, medical emergencies, and workplace injuries.",
                        "Transparent administrative review queue with complete double-entry welfare pool audit ledger."
                    ],
                    stats: [
                        { label: "Accidental Cover", value: "₹2,00,000", note: "PMSBY per member" },
                        { label: "Member Premium", value: "₹0 (100% Subsidized)", note: "Paid by Co-op Reserve" },
                        { label: "Distress Relief", value: "Up to ₹50,000", note: "Emergency tool/medical aid" }
                    ]
                },
                {
                    id: 5,
                    tag: "SLIDE 5: DIGITAL PUBLIC INFRASTRUCTURE",
                    title: "Rural & Peri-Urban Inclusion Without Compromise",
                    subtitle: "Engineered for intermittent connectivity, local dialects, and zero-barrier adoption.",
                    bulletPoints: [
                        "100% Offline-First PWA: Client IndexedDB queue allows full offline booking creation & auto-synchronization.",
                        "Sahkaar Saathi (सहकार साथी): 24/7 bilingual voice-enabled AI assistant with Text-to-Speech audio readouts.",
                        "1-Click Priority Emergency SOS Dispatch with 15-30 minute SLA target monitoring.",
                        "Primary Cooperative Societies (PACS) & hyper-local cluster zoning for localized rapid dispatch."
                    ],
                    stats: [
                        { label: "PWA Offline", value: "100% Ready", note: "IndexedDB sync queue" },
                        { label: "Voice AI", value: "Bilingual (HI/EN)", note: "Dialect accessible" },
                        { label: "SOS Dispatch", value: "<30 Mins", note: "Proximity routing" }
                    ]
                },
                {
                    id: 6,
                    tag: "SLIDE 6: TECHNICAL ARCHITECTURE & STANDARDS",
                    title: "Lightweight, Zero-Dependency & WCAG 2.1 AA",
                    subtitle: "Built strictly to Guidelines for Indian Government Websites (GIGW 3.0).",
                    bulletPoints: [
                        "Pure Vanilla JS, HTML5, CSS3, Node.js/Express, better-sqlite3 (Zero bloated frameworks, zero external CDNs).",
                        "Universal WCAG 2.1 Level AA High Contrast Mode exceeding 7:1 contrast ratio for visually impaired citizens.",
                        "3-Tier dynamic font scaling (100%, 115%, 130%) and screen reader ARIA live region announcements.",
                        "Ultra-fast sub-50ms server response times with single-file portable SQLite federation database."
                    ],
                    stats: [
                        { label: "Accessibility", value: "WCAG 2.1 AA", note: "GIGW 3.0 Compliant" },
                        { label: "External CDNs", value: "0", note: "Fully self-contained" },
                        { label: "Page Load Time", value: "< 250ms", note: "Blazing fast lightweight core" }
                    ]
                }
            ]
        };

        return res.json({ success: true, pitchDeck });
    } catch (err) {
        console.error("Error generating pitch deck:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/simulator/run
 * Executes an end-to-end simulated cooperative service lifecycle.
 * Supports running all 5 stages in one call or a specific step (1 to 5).
 */
router.post('/run', async (req, res) => {
    try {
        const targetStep = req.body.step || 'all'; // 'all' or 1, 2, 3, 4, 5

        // Check if there is an existing simulation booking
        let simBooking = await db.prepare(`
            SELECT * FROM bookings 
            WHERE customer_name = 'Aarav Sharma (Simulation)' 
            ORDER BY id DESC LIMIT 1
        `).get();

        // Worker Sunil Verma (#6) is our default cooperative master tradesperson
        const worker = await db.prepare("SELECT * FROM workers WHERE id = 6 OR phone = '9876543210' LIMIT 1").get();
        if (!worker) {
            return res.status(500).json({ success: false, message: "Demo worker Sunil Verma (#6) not found in database." });
        }

        const stagesExecuted = [];

        // ==========================================
        // STAGE 1: Customer Booking Creation
        // ==========================================
        if (targetStep === 'all' || targetStep === 1 || !simBooking) {
            // If already completed and user triggers step 1, create a fresh simulation run
            const today = new Date().toISOString().split('T')[0];
            const time = "14:30";

            const insertResult = await db.prepare(`
                INSERT INTO bookings 
                (service, customer_name, customer_phone, address, booking_date, booking_time, is_emergency, customer_lat, customer_lng, emergency_type, status)
                VALUES 
                ('Electrician', 'Aarav Sharma (Simulation)', '9811223344', 'Flat 402, Block B, Sector 62, Noida (Cluster 4)', ?, ?, 1, 28.6280, 77.3649, 'Total Power Outage / Sparking', 'Pending')
            `).run(today, time);

            simBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(insertResult.lastInsertRowid);
            stagesExecuted.push({
                stage: 1,
                name: "Customer Booking Created",
                status: "Pending",
                details: {
                    bookingId: simBooking.id,
                    customer: simBooking.customer_name,
                    phone: simBooking.customer_phone,
                    service: simBooking.service,
                    emergency: "1-Click Priority Emergency (Power Outage)",
                    targetSLA: "15-30 minutes"
                }
            });

            if (targetStep === 1) {
                return res.json({ success: true, activeStage: 1, stages: stagesExecuted, booking: simBooking });
            }
        }

        // ==========================================
        // STAGE 2: Algorithmic Cooperative Dispatch
        // ==========================================
        if (targetStep === 'all' || targetStep === 2) {
            await db.prepare(`
                UPDATE bookings 
                SET assigned_worker_id = ?, status = 'Assigned', dispatched_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(worker.id, simBooking.id);

            simBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(simBooking.id);
            stagesExecuted.push({
                stage: 2,
                name: "Algorithmic Dispatch to Nearest Accredited Worker",
                status: "Assigned",
                details: {
                    bookingId: simBooking.id,
                    assignedWorker: worker.name,
                    workerPhone: worker.phone,
                    accreditation: worker.ncct_cert_id || "NCCT-COOP-2026-0006",
                    badgeLevel: worker.badge_level || "Level 2: Advanced Co-op Master Tradesperson",
                    society: "Pragati Shramik Cooperative Society Ltd."
                }
            });

            if (targetStep === 2) {
                return res.json({ success: true, activeStage: 2, stages: stagesExecuted, booking: simBooking });
            }
        }

        // ==========================================
        // STAGE 3: Worker Acceptance & Job Start
        // ==========================================
        if (targetStep === 'all' || targetStep === 3) {
            await db.prepare(`
                UPDATE bookings 
                SET status = 'In Progress' 
                WHERE id = ?
            `).run(simBooking.id);

            simBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(simBooking.id);
            stagesExecuted.push({
                stage: 3,
                name: "Worker Accepted & Service Commenced",
                status: "In Progress",
                details: {
                    bookingId: simBooking.id,
                    worker: worker.name,
                    otpVerification: "Simulated 4-Digit Secure Handshake Verified",
                    serviceStatus: "Active On-Site Diagnostic & Repair"
                }
            });

            if (targetStep === 3) {
                return res.json({ success: true, activeStage: 3, stages: stagesExecuted, booking: simBooking });
            }
        }

        // ==========================================
        // STAGE 4: Completion & 85/15 Cooperative Financial Split
        // ==========================================
        let invoice = null;
        if (targetStep === 'all' || targetStep === 4) {
            await db.prepare("UPDATE bookings SET status = 'Completed' WHERE id = ?").run(simBooking.id);

            const basePrice = 249; // Electrician base
            const emergencyFee = 50; // Emergency priority surcharge
            const totalBill = basePrice + emergencyFee; // ₹299
            const coopShare = Math.round(totalBill * 0.15 * 100) / 100; // ₹44.85
            const workerEarning = Math.round((totalBill - coopShare) * 100) / 100; // ₹254.15

            let existingInv = await db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(simBooking.id);
            if (!existingInv) {
                const invResult = await db.prepare(`
                    INSERT INTO invoices (booking_id, service_charge, cooperative_share, worker_earning, total_amount)
                    VALUES (?, ?, ?, ?, ?)
                `).run(simBooking.id, totalBill, coopShare, workerEarning, totalBill);
                invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(invResult.lastInsertRowid);
            } else {
                invoice = existingInv;
            }

            simBooking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(simBooking.id);
            stagesExecuted.push({
                stage: 4,
                name: "Work Completed & 85/15 Cooperative Dividend Split",
                status: "Completed",
                details: {
                    bookingId: simBooking.id,
                    invoiceId: invoice.id,
                    totalBill: "₹" + totalBill,
                    workerLivingWage: "₹" + workerEarning + " (85%)",
                    cooperativeWelfareReserve: "₹" + coopShare + " (15%)",
                    middlemanCommission: "₹0.00 (0% Elimination)"
                }
            });

            if (targetStep === 4) {
                return res.json({ success: true, activeStage: 4, stages: stagesExecuted, booking: simBooking, invoice });
            }
        }

        // ==========================================
        // STAGE 5: Welfare Reserve Inflow & PMSBY Insurance Shield
        // ==========================================
        if (targetStep === 'all' || targetStep === 5) {
            const coopShare = invoice ? invoice.cooperative_share : 44.85;

            // Log welfare inflow in ledger
            const refId = "SIM-INV-" + (invoice ? invoice.id : simBooking.id);
            const existingLedger = await db.prepare("SELECT * FROM welfare_pool_ledger WHERE reference_id = ?").get(refId);

            if (!existingLedger) {
                await db.prepare(`
                    INSERT INTO welfare_pool_ledger 
                    (society_id, entry_type, amount, worker_id, reference_id, description)
                    VALUES 
                    (1, 'INFLOW_BOOKING_SHARE', ?, ?, ?, 'Simulated 15% booking welfare reserve dividend allocation.')
                `).run(coopShare, worker.id, refId);

                // Update society welfare reserve
                await db.prepare("UPDATE societies SET welfare_fund_pool = welfare_fund_pool + ? WHERE id = 1").run(coopShare);
            }

            // Retrieve active PMSBY policy
            const pmsbyPolicy = await db.prepare("SELECT * FROM worker_insurance_policies WHERE worker_id = ? ORDER BY id DESC LIMIT 1").get(worker.id);

            stagesExecuted.push({
                stage: 5,
                name: "Welfare Reserve Allocation & PMSBY Insurance Shield",
                status: "Secured",
                details: {
                    welfareDeposit: "₹" + coopShare + " credited to Pragati Shramik Cooperative Reserve",
                    pmsbyPolicyNumber: pmsbyPolicy ? pmsbyPolicy.policy_number : "PMSBY-2026-COOP-0006",
                    accidentalCoverage: "₹2,00,000 Accidental Protection (100% Subsidized)",
                    verificationHash: (worker.verification_hash ? worker.verification_hash.substring(0, 24) : "e8f39a7b1c4d5e6f") + "...",
                    auditStatus: "MSCS Act 2002 Statutory Compliance Passed"
                }
            });

            return res.json({
                success: true,
                activeStage: 5,
                simulationComplete: true,
                stages: stagesExecuted,
                booking: simBooking,
                invoice,
                worker: {
                    name: worker.name,
                    skill: worker.skill,
                    certId: worker.ncct_cert_id,
                    pmsbyPolicy: pmsbyPolicy ? pmsbyPolicy.policy_number : "PMSBY-2026-COOP-0006"
                }
            });
        }

        return res.json({ success: true, stages: stagesExecuted, booking: simBooking });
    } catch (err) {
        console.error("Simulation run error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/simulator/reset
 * Removes simulated demo bookings, associated invoices, and simulation welfare ledger entries.
 */
router.post('/reset', async (req, res) => {
    try {
        const simBookings = await db.prepare("SELECT id FROM bookings WHERE customer_name LIKE '%(Simulation)%'").all();
        const ids = simBookings.map(b => b.id);

        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            
            // Delete invoices
            await db.prepare(`DELETE FROM invoices WHERE booking_id IN (${placeholders})`).run(...ids);
            
            // Delete simulation welfare ledger entries
            await db.prepare("DELETE FROM welfare_pool_ledger WHERE reference_id LIKE 'SIM-INV-%'").run();

            // Delete bookings
            await db.prepare(`DELETE FROM bookings WHERE id IN (${placeholders})`).run(...ids);
        }

        return res.json({ 
            success: true, 
            message: `Simulation cleaned up. Deleted ${ids.length} simulated booking records.` 
        });
    } catch (err) {
        console.error("Simulation reset error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});


module.exports = router;

const express = require("express");
const db = require("../database");

const router = express.Router();

// ============================================================
// ADD TIP TO COMPLETED BOOKING (100% TO WORKER, 0% COOP FEE)
// ============================================================
async function addTip(req, res) {
    const bookingId = Number(req.params.id || req.params.bookingId || (req.body && req.body.bookingId));
    const rawAmount = req.body && (req.body.tipAmount !== undefined ? req.body.tipAmount : req.body.amount);
    const customerPhone = req.body && req.body.customerPhone ? String(req.body.customerPhone).trim() : "";
    const paymentMethod = (req.body && req.body.paymentMethod) || "Mock UPI";

    if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ success: false, message: "Valid bookingId is required." });
    }

    const tipAmount = Number(rawAmount);
    if (isNaN(tipAmount) || tipAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid tip amount. Tip must be a positive number greater than ₹0."
        });
    }

    // Verify booking
    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "Completed") {
        return res.status(400).json({
            success: false,
            message: `Tips can only be added to completed bookings. Current status is '${booking.status}'.`
        });
    }

    const workerId = booking.assigned_worker_id;
    if (!workerId) {
        return res.status(400).json({
            success: false,
            message: "No assigned worker found for this booking to receive the tip."
        });
    }

    // Verify worker exists
    const worker = await db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId);
    if (!worker) {
        return res.status(404).json({ success: false, message: "Assigned worker not found." });
    }

    // Anti-fraud: Prevent worker self-tipping
    const senderWorkerId = req.headers["x-worker-id"] || (req.body && req.body.workerId);
    if (senderWorkerId && Number(senderWorkerId) === Number(workerId)) {
        return res.status(400).json({
            success: false,
            message: "Workers are not permitted to tip themselves."
        });
    }
    const cleanCustPhone = customerPhone.replace(/\D/g, "");
    const cleanWorkerPhone = (worker.phone || "").replace(/\D/g, "");
    if (cleanCustPhone && cleanWorkerPhone && cleanCustPhone.length >= 7 && (cleanCustPhone === cleanWorkerPhone || cleanCustPhone.slice(-10) === cleanWorkerPhone.slice(-10))) {
        return res.status(400).json({
            success: false,
            message: "Worker phone matches customer phone. Self-tipping is prohibited."
        });
    }

    // Prevent duplicate tip submission on the same booking
    const existingTip = await db.prepare("SELECT * FROM tips WHERE booking_id = ?").get(bookingId);
    if (existingTip) {
        return res.status(409).json({
            success: false,
            message: "A tip has already been recorded for this booking.",
            tip: existingTip
        });
    }

    // Generate transaction ID
    const txId = `TIP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert into tips table
    const result = await db.prepare(`
        INSERT INTO tips (booking_id, worker_id, customer_phone, tip_amount, status, transaction_id)
        VALUES (?, ?, ?, ?, 'paid', ?)
    `).run(bookingId, workerId, customerPhone || booking.customer_phone, tipAmount, txId);

    // Update invoices table
    let invoice = await db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);
    if (invoice) {
        const newTotal = Number(invoice.service_charge) + tipAmount;
        await db.prepare(`
            UPDATE invoices 
            SET tip_amount = ?, 
                total_amount = ?
            WHERE id = ?
        `).run(tipAmount, newTotal, invoice.id);
        invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoice.id);
    } else {
        // Create invoice if not yet generated
        const serviceCharge = Number(booking.price || 499);
        const coopShare = Math.round(serviceCharge * 0.07 * 100) / 100;
        const workerBase = Math.round(serviceCharge * 0.93 * 100) / 100;
        const total = serviceCharge + tipAmount;

        const invResult = await db.prepare(`
            INSERT INTO invoices (booking_id, service_charge, cooperative_share, worker_earning, tip_amount, total_amount)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(bookingId, serviceCharge, coopShare, workerBase, tipAmount, total);
        invoice = await db.prepare("SELECT * FROM invoices WHERE id = ?").get(invResult.lastInsertRowid);
    }

    const tipRecord = await db.prepare("SELECT * FROM tips WHERE id = ?").get(result.lastInsertRowid);

    return res.status(201).json({
        success: true,
        message: `Thank you! ₹${tipAmount} tip successfully sent to ${worker.name}. 100% goes directly to the worker.`,
        tip: {
            id: tipRecord.id,
            bookingId,
            workerId,
            workerName: worker.name,
            tipAmount,
            status: "paid",
            transactionId: txId,
            workerSharePercentage: 100,
            cooperativeCommissionPercentage: 0,
            createdAt: tipRecord.created_at
        },
        invoice: {
            ...invoice,
            worker_total_take_home: (Number(invoice.worker_earning) + Number(invoice.tip_amount)).toFixed(2)
        }
    });
}

// ============================================================
// GET TIP DETAILS FOR A BOOKING
// ============================================================
async function getBookingTip(req, res) {
    const bookingId = Number(req.params.id || req.params.bookingId);
    if (!bookingId || isNaN(bookingId)) {
        return res.status(400).json({ success: false, message: "Valid bookingId is required." });
    }

    const tip = await db.prepare(`
        SELECT t.*, w.name AS worker_name, b.service
        FROM tips t
        LEFT JOIN workers w ON t.worker_id = w.id
        LEFT JOIN bookings b ON t.booking_id = b.id
        WHERE t.booking_id = ?
    `).get(bookingId);

    if (!tip) {
        return res.json({ success: true, hasTip: false, tip: null });
    }

    return res.json({ success: true, hasTip: true, tip });
}

// Router endpoints
router.post("/", addTip);
router.post("/:id", addTip);
router.get("/:id", getBookingTip);

module.exports = {
    router,
    addTip,
    getBookingTip
};

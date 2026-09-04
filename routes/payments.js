const db = require("../database");

// =========================
// COOPERATIVE PAYMENT SETTLEMENT (MOCK / DEMO GATEWAY)
// Supports multi-channel payments: UPI, Cash on Completion, Cooperative Account
// Generates verifiable transaction references and settles invoices.
// =========================
function mockPay(req, res) {
    const { bookingId, method, notes } = req.body;

    if (!bookingId) {
        return res.status(400).json({ success: false, message: "bookingId is required." });
    }

    const invoice = db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);
    if (!invoice) {
        return res.status(400).json({ success: false, message: "No invoice found — complete the booking first." });
    }

    const payMethod = method || "UPI";

    const existingPayment = db.prepare("SELECT * FROM payments WHERE booking_id = ?").get(bookingId);
    if (existingPayment) {
        // Ensure invoice is synchronized as paid
        db.prepare("UPDATE invoices SET payment_status = 'paid', payment_method = ?, paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE booking_id = ?")
            .run(existingPayment.method || payMethod, bookingId);

        const updatedInv = db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);
        return res.json({
            success: true,
            message: "Invoice already settled.",
            payment: existingPayment,
            invoice: updatedInv
        });
    }

    // Generate verifiable cooperative transaction ID
    const randSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const transactionId = `TXN-SAHKAAR-${Date.now().toString(36).toUpperCase()}-${randSuffix}`;

    const result = db.prepare(`
        INSERT INTO payments (booking_id, amount, method, status, transaction_id, notes)
        VALUES (?, ?, ?, 'paid', ?, ?)
    `).run(bookingId, invoice.total_amount, payMethod, transactionId, notes || `Settled via ${payMethod}`);

    // Update invoice settlement status
    db.prepare(`
        UPDATE invoices
        SET payment_status = 'paid',
            payment_method = ?,
            paid_at = CURRENT_TIMESTAMP
        WHERE booking_id = ?
    `).run(payMethod, bookingId);

    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(result.lastInsertRowid);
    const updatedInvoice = db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);

    return res.status(201).json({
        success: true,
        message: `Payment of ₹${invoice.total_amount} settled successfully via ${payMethod}.`,
        payment,
        invoice: updatedInvoice
    });
}

module.exports = { mockPay };
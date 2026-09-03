const db = require("../database");

// =========================
// MOCK PAYMENT ONLY.
// No real payment gateway, no real money moves.
// This exists purely to demonstrate the payment step in the flow.
// =========================
function mockPay(req, res) {

    const { bookingId } = req.body;

    if (!bookingId) {
        return res.status(400).json({ success: false, message: "bookingId is required." });
    }

    const invoice = db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);

    if (!invoice) {
        return res.status(400).json({ success: false, message: "No invoice found — complete the booking first." });
    }

    const existingPayment = db.prepare("SELECT * FROM payments WHERE booking_id = ?").get(bookingId);
    if (existingPayment) {
        return res.json({ success: true, message: "Already paid (mock).", payment: existingPayment });
    }

    const result = db.prepare(`
        INSERT INTO payments (booking_id, amount, method, status)
        VALUES (?, ?, 'Mock UPI', 'mock_paid')
    `).run(bookingId, invoice.total_amount);

    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(result.lastInsertRowid);

    return res.status(201).json({ success: true, message: "Mock payment successful (no real money moved).", payment });
}

module.exports = { mockPay };
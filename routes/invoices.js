const db = require("../database");

function getInvoice(req, res) {

    const { bookingId } = req.query;

    if (!bookingId) {
        return res.status(400).json({ success: false, message: "bookingId is required." });
    }

    const invoice = db.prepare("SELECT * FROM invoices WHERE booking_id = ?").get(bookingId);

    if (!invoice) {
        return res.status(404).json({ success: false, message: "No invoice yet — booking may not be completed." });
    }

    return res.json({ success: true, invoice });
}

module.exports = { getInvoice };
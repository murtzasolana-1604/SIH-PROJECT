const db = require("../database");

function formatInvoiceRow(inv) {
    const isEmergency = inv.is_emergency == 1;
    const baseFee = isEmergency ? Math.max(0, inv.service_charge - 50) : inv.service_charge;
    const emergencyFee = isEmergency ? 50 : 0;

    return {
        id: inv.id,
        invoice_number: `INV-2026-${String(inv.id).padStart(5, '0')}`,
        booking_id: inv.booking_id,
        service: inv.service,
        is_emergency: isEmergency,
        base_charge: baseFee,
        emergency_fee: emergencyFee,
        service_charge: inv.service_charge,
        cooperative_share: inv.cooperative_share,
        worker_earning: inv.worker_earning,
        total_amount: inv.total_amount,
        payment_status: inv.payment_status || (inv.payment_id ? "paid" : "unpaid"),
        payment_method: inv.payment_method || inv.payment_method_record || null,
        transaction_id: inv.transaction_id || null,
        paid_at: inv.paid_at || null,
        created_at: inv.created_at,
        customer: {
            name: inv.customer_name,
            phone: inv.customer_phone,
            address: inv.customer_address
        },
        worker: {
            id: inv.assigned_worker_id,
            name: inv.worker_name,
            phone: inv.worker_phone,
            skill: inv.worker_skill
        }
    };
}

function getInvoice(req, res) {
    const { bookingId, workerId, customerPhone, limit } = req.query;

    const baseSql = `
        SELECT i.*,
               b.service, b.customer_name, b.customer_phone, b.address AS customer_address,
               b.booking_date, b.booking_time, b.is_emergency, b.assigned_worker_id,
               w.name AS worker_name, w.phone AS worker_phone, w.skill AS worker_skill,
               p.id AS payment_id, p.transaction_id, p.method AS payment_method_record,
               p.status AS payment_record_status
        FROM invoices i
        LEFT JOIN bookings b ON i.booking_id = b.id
        LEFT JOIN workers w ON b.assigned_worker_id = w.id
        LEFT JOIN payments p ON p.booking_id = i.booking_id
    `;

    // 1. Single booking invoice
    if (bookingId) {
        const inv = db.prepare(`${baseSql} WHERE i.booking_id = ?`).get(Number(bookingId));
        if (!inv) {
            return res.status(404).json({ success: false, message: "No invoice yet — booking may not be completed." });
        }
        return res.json({ success: true, invoice: formatInvoiceRow(inv) });
    }

    // 2. Invoices for a worker
    if (workerId) {
        const rows = db.prepare(`${baseSql} WHERE b.assigned_worker_id = ? ORDER BY i.id DESC`).all(Number(workerId));
        return res.json({ success: true, invoices: rows.map(formatInvoiceRow) });
    }

    // 3. Invoices for a customer
    if (customerPhone) {
        const rows = db.prepare(`${baseSql} WHERE b.customer_phone = ? ORDER BY i.id DESC`).all(customerPhone);
        return res.json({ success: true, invoices: rows.map(formatInvoiceRow) });
    }

    // 4. Platform-wide invoices
    const max = Math.min(Number(limit) || 25, 100);
    const rows = db.prepare(`${baseSql} ORDER BY i.id DESC LIMIT ?`).all(max);
    return res.json({ success: true, invoices: rows.map(formatInvoiceRow) });
}

module.exports = { getInvoice };
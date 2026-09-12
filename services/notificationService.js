/**
 * SAHKAAR CONNECT — Notification & WhatsApp Dispatch Service
 * Handles customer booking confirmation notifications.
 * 
 * Supports:
 * 1. Live Meta Cloud API (when WHATSAPP_API_TOKEN and META_WA_PHONE_NUMBER_ID are provided)
 * 2. Safe WhatsApp Deep-Link Fallback (wa.me) for instant manual or operator dispatch
 * 
 * Never makes false claims of automated delivery if no provider is configured.
 */

function formatConfirmationMessage({ bookingId, service, customerName, workerName, workerPhone, expectedArrival, address }) {
    return [
        "✅ *Sahkaar Connect Booking Confirmed*",
        "",
        "Your cooperative gig service booking has been accepted.",
        "",
        `*Service:* ${service}`,
        `*Worker:* ${workerName}`,
        `*Phone:* ${workerPhone}`,
        `*Expected Arrival:* ${expectedArrival}`,
        `*Service Address:* ${address}`,
        `*Booking ID:* SC-${bookingId}`,
        "",
        "You can view your complete booking details and transparent 93/7 cooperative invoice in Sahkaar Connect:",
        "https://sih-project-v7qg.onrender.com"
    ].join("\n");
}

async function sendBookingConfirmation({
    bookingId,
    service,
    customerName,
    customerPhone,
    workerName,
    workerPhone,
    expectedArrival,
    address
}) {
    const text = formatConfirmationMessage({
        bookingId,
        service,
        customerName,
        workerName,
        workerPhone,
        expectedArrival: expectedArrival || "30–45 mins (Estimated arrival)",
        address
    });

    const cleanCustomerPhone = String(customerPhone || "").replace(/\D/g, "").slice(-10);
    const waLink = `https://wa.me/91${cleanCustomerPhone}?text=${encodeURIComponent(text)}`;

    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    // 1. Live Meta Cloud API (if credentials exist)
    if (token && phoneId) {
        try {
            const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: `91${cleanCustomerPhone}`,
                    type: "text",
                    text: { body: text }
                })
            });

            const data = await res.json();
            if (res.ok && data.messages) {
                console.log(`[WhatsApp Service] Dispatched live message to +91${cleanCustomerPhone}. Message ID:`, data.messages[0].id);
                return {
                    sent: true,
                    provider: "meta_cloud_api",
                    messageId: data.messages[0].id,
                    waLink,
                    messagePreview: text
                };
            } else {
                console.warn("[WhatsApp Service] Meta Cloud API error:", data);
            }
        } catch (apiErr) {
            console.error("[WhatsApp Service] Meta Cloud API request failed:", apiErr.message);
        }
    }

    // 2. Safe Fallback: Return deep link with message preview without claiming fake delivery
    console.log(`[WhatsApp Notification Ready] Booking #SC-${bookingId} -> Customer +91${cleanCustomerPhone}`);
    return {
        sent: false,
        provider: "manual_fallback",
        status: "ready_for_dispatch",
        note: "WhatsApp Cloud API credentials not configured in environment; ready for direct WhatsApp dispatch.",
        waLink,
        messagePreview: text,
        customerPhone: cleanCustomerPhone
    };
}

module.exports = {
    sendBookingConfirmation,
    formatConfirmationMessage
};

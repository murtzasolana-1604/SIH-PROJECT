// =====================================
// SAHKAAR CONNECT - FRONTEND
// =====================================

const SEAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;

function hideCustomerSubsections() {
    const s = document.getElementById("servicesSection");
    const b = document.getElementById("bookingSection");
    const m = document.getElementById("myBookingsSection");
    if (s) s.classList.add("hidden");
    if (b) b.classList.add("hidden");
    if (m) m.classList.add("hidden");
}

async function showCustomerDashboard() {
    showScreen("customerDashboardScreen");
    showServices();
    await fetchCustomerProfile();
}

async function fetchCustomerProfile() {
    const phone = localStorage.getItem("sahkaar_customer_phone");
    if (!phone) return;

    try {
        const res = await fetch(`/api/customer/profile?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.success && data.customer) {
            const c = data.customer;
            const nameEl = document.getElementById("customerWelcomeName");
            const locEl = document.getElementById("customerWelcomeLoc");
            if (nameEl && c.name) nameEl.textContent = c.name;
            if (locEl) {
                if (c.city && c.state) locEl.textContent = `${c.city}, ${c.state}`;
                else if (c.address) locEl.textContent = c.address;
            }
            // Auto-fill booking inputs
            const nameInput = document.getElementById("customerName");
            const phoneInput = document.getElementById("customerPhone");
            const addrInput = document.getElementById("customerAddress");
            const latInput = document.getElementById("customerLat");
            const lngInput = document.getElementById("customerLng");
            if (nameInput && !nameInput.value) nameInput.value = c.name || "";
            if (phoneInput && !phoneInput.value) phoneInput.value = c.phone || "";
            if (addrInput && !addrInput.value) addrInput.value = c.address || "";
            if (latInput && c.latitude) latInput.value = c.latitude;
            if (lngInput && c.longitude) lngInput.value = c.longitude;
        }
    } catch (err) {
        console.error("Failed to fetch customer profile:", err);
    }
}

async function refreshCustomerLocation() {
    const btn = document.querySelector(".loc-refresh-btn");
    const phone = localStorage.getItem("sahkaar_customer_phone");
    if (!phone) return;

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    if (btn) btn.textContent = "📍 Detecting...";

    navigator.geolocation.getCurrentPosition(
        async position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            try {
                const res = await fetch("/api/customer/location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone, latitude: lat, longitude: lng })
                });
                const data = await res.json();
                if (data.success) {
                    const locEl = document.getElementById("customerWelcomeLoc");
                    if (locEl) locEl.textContent = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    if (btn) btn.textContent = "✓ Location Updated";
                    setTimeout(() => { if (btn) btn.textContent = "📍 Update Location"; }, 3000);
                }
            } catch (err) {
                console.error(err);
                if (btn) btn.textContent = "📍 Update Location";
            }
        },
        error => {
            alert(`Location access not granted: ${error.message}`);
            if (btn) btn.textContent = "📍 Update Location";
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

async function showServices() {
    showScreen("customerDashboardScreen");
    hideCustomerSubsections();
    const s = document.getElementById("servicesSection");
    if (s) s.classList.remove("hidden");
    await loadServices();
}

const SERVICE_PRICE_MAP = {
    Electrician: "₹249 Fair Wage Estimate",
    Plumber: "₹279 Fair Wage Estimate",
    Carpenter: "₹349 Fair Wage Estimate",
    Painter: "₹319 Fair Wage Estimate",
    Cleaner: "₹249 Fair Wage Estimate",
    Driver: "₹449 Fair Wage Estimate",
    Caregiver: "₹399 Fair Wage Estimate",
    Technician: "₹299 Fair Wage Estimate"
};

let isGlobalEmergency = false;

function toggleEmergencyMode(enabled) {
    isGlobalEmergency = enabled;
    const card = document.querySelector(".emergency-banner-card");
    if (card) {
        if (enabled) card.classList.add("active");
        else card.classList.remove("active");
    }
    const formEmergency = document.getElementById("isEmergency");
    if (formEmergency) formEmergency.checked = enabled;
}

function syncEmergencyCheckbox(checked) {
    isGlobalEmergency = checked;
    const toggle = document.getElementById("globalEmergencyToggle");
    if (toggle) toggle.checked = checked;
    const card = document.querySelector(".emergency-banner-card");
    if (card) {
        if (checked) card.classList.add("active");
        else card.classList.remove("active");
    }
}

async function loadServices() {
    const servicesList = document.getElementById("servicesList");
    servicesList.innerHTML = `
        <div class="skeleton-row">
            <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
    `;
    try {
        const response = await fetch("/api/services");
        const data = await response.json();

        servicesList.innerHTML = "";

        data.services.forEach(service => {
            const card = document.createElement("div");
            card.className = "service-card";
            card.innerHTML = `
                <div class="service-card-top">
                    <div class="service-icon">${service.icon}</div>
                    <span class="service-price-chip">${service.fairWageLabel || "Fair Wage"}</span>
                </div>
                <h3>${service.name}</h3>
                <p class="service-desc">${service.description || service.category}</p>
                <div class="service-coop-note">
                    <small>🤝 ${service.benefitNote || "Fair wages, verified worker, community owned"}</small>
                </div>
                <button class="primary service-book-btn" onclick="openBooking('${service.name}', '${service.fairWageLabel || '₹299'}')">Book Now →</button>
            `;
            servicesList.appendChild(card);
        });
    } catch (error) {
        servicesList.innerHTML = `<div class="error">Unable to load services.</div>`;
        console.error(error);
    }
}

function syncBookingLocation() {
    const statusEl = document.getElementById("bookingLocStatus");
    if (!navigator.geolocation) {
        if (statusEl) statusEl.innerHTML = `<small class="hint warning">Geolocation not supported.</small>`;
        return;
    }
    if (statusEl) statusEl.innerHTML = `<small class="hint">📍 Syncing current GPS coordinates...</small>`;

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            document.getElementById("customerLat").value = lat;
            document.getElementById("customerLng").value = lng;
            if (statusEl) {
                statusEl.innerHTML = `<small class="hint" style="color:var(--teal); font-weight:600;">✓ GPS Synced: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>`;
            }
        },
        err => {
            if (statusEl) {
                statusEl.innerHTML = `<small class="hint" style="color:var(--terracotta);">GPS access denied: using manual address.</small>`;
            }
        },
        { timeout: 8000, enableHighAccuracy: true }
    );
}

function openBooking(serviceName, priceLabel) {
    showScreen("customerDashboardScreen");
    hideCustomerSubsections();
    const b = document.getElementById("bookingSection");
    if (b) b.classList.remove("hidden");

    const selectedInput = document.getElementById("selectedService");
    if (selectedInput) selectedInput.value = serviceName;

    const priceEl = document.getElementById("bookingFairWage");
    if (priceEl) {
        priceEl.textContent = priceLabel || SERVICE_PRICE_MAP[serviceName] || "₹299";
    }

    const emergencyEl = document.getElementById("isEmergency");
    if (emergencyEl) emergencyEl.checked = isGlobalEmergency;

    // Set default date to today if empty
    const dateInput = document.getElementById("bookingDate");
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
    }

    // Set default time to next hour if empty
    const timeInput = document.getElementById("bookingTime");
    if (timeInput && !timeInput.value) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const hh = String(now.getHours()).padStart(2, "0");
        timeInput.value = `${hh}:00`;
    }

    // Sync saved customer profile data into booking form
    const phone = localStorage.getItem("sahkaar_customer_phone");
    const name = localStorage.getItem("sahkaar_customer_name");
    const addr = localStorage.getItem("sahkaar_customer_address");
    const lat = localStorage.getItem("sahkaar_customer_lat");
    const lng = localStorage.getItem("sahkaar_customer_lng");

    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");
    const addrInput = document.getElementById("customerAddress");
    const latInput = document.getElementById("customerLat");
    const lngInput = document.getElementById("customerLng");

    if (nameInput && name && !nameInput.value) nameInput.value = name;
    if (phoneInput && phone && !phoneInput.value) phoneInput.value = phone;
    if (addrInput && addr && !addrInput.value) addrInput.value = addr;
    if (latInput && lat) latInput.value = lat;
    if (lngInput && lng) lngInput.value = lng;
}

function showMyBookings() {
    showScreen("customerDashboardScreen");
    hideCustomerSubsections();
    const m = document.getElementById("myBookingsSection");
    if (m) m.classList.remove("hidden");

    const savedPhone = localStorage.getItem("sahkaar_customer_phone");
    const lookupInput = document.getElementById("lookupPhone");
    if (savedPhone && lookupInput) {
        lookupInput.value = savedPhone;
        fetchMyBookings();
    }
}

function showWorkerDashboard() {
    showScreen("workerDashboardScreen");
    const dashSec = document.getElementById("workerDashboardSection");
    const formSec = document.getElementById("workerSection");
    if (dashSec) dashSec.classList.remove("hidden");
    if (formSec) formSec.classList.add("hidden");

    const savedPhone = localStorage.getItem("sahkaar_worker_phone");
    const lookupInput = document.getElementById("workerLookupPhone");
    if (savedPhone && lookupInput && !lookupInput.value) {
        lookupInput.value = savedPhone;
    }
}

function showWorkerForm() {
    showScreen("workerDashboardScreen");
    const dashSec = document.getElementById("workerDashboardSection");
    const formSec = document.getElementById("workerSection");
    if (dashSec) dashSec.classList.add("hidden");
    if (formSec) formSec.classList.remove("hidden");

    const savedPhone = localStorage.getItem("sahkaar_worker_phone");
    const phoneInput = document.getElementById("workerPhone");
    if (savedPhone && phoneInput) {
        phoneInput.value = savedPhone;
    }
}

function showAdminDashboard() {
    showScreen("adminDashboardScreen");
    const adminSec = document.getElementById("adminSection");
    if (adminSec) adminSec.classList.remove("hidden");

    const adminName = localStorage.getItem("sahkaar_admin_name") || "Administrator";
    const nameEl = document.getElementById("adminHeaderName");
    if (nameEl) nameEl.textContent = adminName;

    switchAdminTab("overview");
    loadAdminStats();
    loadAdminWorkers();
    loadAdminBookings();
    loadAdminEmergencyQueue();
    loadForecast();
}

function showAdmin() {
    showAdminDashboard();
}


// =====================================
// WORKER REGISTRATION
// =====================================

document.getElementById("workerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const worker = {
        name: document.getElementById("workerName").value,
        phone: document.getElementById("workerPhone").value,
        skill: document.getElementById("workerSkill").value,
        experience: document.getElementById("workerExperience").value,
        location: document.getElementById("workerLocation").value,
        availability: document.getElementById("workerAvailability").value
    };

    try {
        const response = await fetch("/api/workers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(worker)
        });
        const data = await response.json();
        const result = document.getElementById("workerResult");

        if (data.success) {
            result.innerHTML = `
                <div class="success">
                    <div><strong>Registration successful! 🎉</strong><br>
                    Worker ID: ${data.worker.id}<br>
                    Your profile is waiting for verification.</div>
                </div>
            `;
            document.getElementById("workerForm").reset();
        } else {
            result.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById("workerResult").innerHTML = `<div class="error">Server connection failed.</div>`;
    }
});


// =====================================
// BOOKING
// =====================================

document.getElementById("bookingForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const booking = {
        service: document.getElementById("selectedService").value,
        customerName: document.getElementById("customerName").value,
        customerPhone: document.getElementById("customerPhone").value,
        address: document.getElementById("customerAddress").value,
        bookingDate: document.getElementById("bookingDate").value,
        bookingTime: document.getElementById("bookingTime").value,
        isEmergency: document.getElementById("isEmergency").checked,
        customerLat: document.getElementById("customerLat").value || null,
        customerLng: document.getElementById("customerLng").value || null
    };

    try {
        const response = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(booking)
        });
        const data = await response.json();
        const result = document.getElementById("bookingResult");

        if (data.success) {
            result.innerHTML = `
                <div class="success">
                    <div><strong>Booking created successfully! 🎉</strong><br><br>
                    Booking ID: ${data.booking.id}<br>
                    Service: ${data.booking.service}<br>
                    Customer: ${data.booking.customer_name}<br>
                    Date: ${data.booking.booking_date}<br>
                    Time: ${data.booking.booking_time}<br>
                    Status: ${data.booking.status}</div>
                </div>
            `;
            if (typeof speak === "function") {
                speak(`Booking confirmed for ${data.booking.service}. Booking I D ${data.booking.id}. Status ${data.booking.status}.`);
            }
            document.getElementById("bookingForm").reset();
        } else {
            result.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById("bookingResult").innerHTML = `<div class="error">Server connection failed.</div>`;
    }
});


// =====================================
// MY BOOKINGS (lookup by phone) + invoice + rating + mock payment
// =====================================

async function fetchMyBookings() {
    const phone = document.getElementById("lookupPhone").value.trim();
    const result = document.getElementById("myBookingsResult");

    if (!phone) {
        result.innerHTML = `<div class="error">Please enter your phone number.</div>`;
        return;
    }

    result.innerHTML = `<div class="skeleton" style="height:70px;"></div>`;

    try {
        const response = await fetch(`/api/bookings?phone=${encodeURIComponent(phone)}`);
        const data = await response.json();

        if (!data.success || data.bookings.length === 0) {
            result.innerHTML = `
                <div class="empty-state">
                    <span class="icon">📭</span>
                    No bookings found for this phone number.
                </div>
            `;
            return;
        }

        result.innerHTML = "";

        for (const booking of data.bookings) {

            const item = document.createElement("div");
            item.className = "booking-item";

            let statusBadge = "";
            if (booking.status === "Pending") statusBadge = `<span class="badge" style="background:#FFF4E5; color:#8C5300; border:1px solid #FFE0B2;">⏳ Pending Allocation</span>`;
            else if (booking.status === "Assigned") statusBadge = `<span class="badge" style="background:#E3F2FD; color:#0D47A1; border:1px solid #BBDEFB;">👷 Worker Assigned</span>`;
            else if (booking.status === "In Progress") statusBadge = `<span class="badge" style="background:#EDE7F6; color:#4A148C; border:1px solid #D1C4E9;">⚡ In Progress</span>`;
            else if (booking.status === "Completed") statusBadge = `<span class="badge verified">${SEAL_ICON}Completed</span>`;
            else if (booking.status === "Cancelled") statusBadge = `<span class="badge" style="background:var(--terracotta-tint); color:var(--terracotta); border:1px solid rgba(193,89,43,0.3);">❌ Cancelled</span>`;
            else statusBadge = `<span class="badge">${booking.status}</span>`;

            const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 EMERGENCY</span> ` : "";

            let workerBox = "";
            if (booking.worker_name) {
                workerBox = `
                    <div class="assigned-worker-card">
                        <div class="worker-avatar">👷</div>
                        <div class="worker-details">
                            <strong>Assigned Worker: ${booking.worker_name}</strong>
                            <div class="worker-sub">${booking.worker_skill || booking.service} • Verified Member</div>
                            <div class="worker-phone">📞 <a href="tel:${booking.worker_phone}">${booking.worker_phone}</a></div>
                        </div>
                    </div>
                `;
            }

            let cancelAction = "";
            if (booking.status === "Pending" || booking.status === "Assigned") {
                cancelAction = `
                    <div style="margin-top:10px;">
                        <button class="btn-cancel" onclick="cancelCustomerBooking(${booking.id})">❌ Cancel Booking</button>
                    </div>
                `;
            }

            let html = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        ${emergencyTag}
                        <strong style="font-size:16px;">${booking.service}</strong>
                        <div style="font-size:12px; color:var(--muted); font-family:var(--font-mono);">Booking #${booking.id}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div style="font-size:13.5px; line-height:1.7; margin-bottom:10px;">
                    <strong>Service Date:</strong> ${booking.booking_date} at ${booking.booking_time}<br>
                    <strong>Address:</strong> ${booking.address}
                </div>
                ${workerBox}
                ${cancelAction}
            `;

            if (booking.status === "Completed") {

                const invRes = await fetch(`/api/invoices?bookingId=${booking.id}`);
                const invData = await invRes.json();

                if (invData.success) {
                    const inv = invData.invoice;
                    const isPaid = inv.payment_status === "paid";

                    if (isPaid) {
                        html += `
                            <div class="coop-invoice-card paid">
                                <div class="invoice-card-header">
                                    <div>
                                        <span class="invoice-badge-label">${t('officialSettlement', 'OFFICIAL COOPERATIVE SETTLEMENT')}</span>
                                        <div class="invoice-number">${inv.invoice_number}</div>
                                    </div>
                                    <div class="paid-settlement-seal">
                                        ${SEAL_ICON}
                                        <span>${t('settledBadge', 'SETTLED & VERIFIED')}</span>
                                    </div>
                                </div>

                                <div class="invoice-breakdown-table">
                                    <div class="inv-row">
                                        <span>${t('baseServiceDelivery', 'Base Service Delivery:')}</span>
                                        <span>₹${inv.base_charge}</span>
                                    </div>
                                    ${inv.is_emergency ? `
                                    <div class="inv-row emergency-row">
                                        <span>${t('emergencySurchargeText', '🚨 Emergency Priority Dispatch Surcharge:')}</span>
                                        <span>+₹${inv.emergency_fee}</span>
                                    </div>` : ""}
                                    <div class="inv-row divider"></div>
                                    <div class="inv-row highlight">
                                        <span>${t('workerDirectEarning', '👷 Worker Direct Earning (85%):')}</span>
                                        <span class="worker-earning-text">₹${inv.worker_earning}</span>
                                    </div>
                                    <div class="inv-row coop-share">
                                        <span>${t('coopWelfareShareText', '🏛️ Cooperative Welfare & Training Fund (15%):')}</span>
                                        <span class="coop-share-text">₹${inv.cooperative_share}</span>
                                    </div>
                                    <div class="inv-row total-row">
                                        <strong>${t('totalAmountPaid', 'Total Settled Amount:')}</strong>
                                        <strong class="total-amount">₹${inv.total_amount}</strong>
                                    </div>
                                </div>

                                <div class="payment-settled-meta">
                                    <div class="meta-line"><strong>Payment Method:</strong> ${inv.payment_method || 'UPI / Digital'}</div>
                                    <div class="meta-line"><strong>Transaction Reference:</strong> <code class="txn-code">${inv.transaction_id || 'TXN-SAHKAAR-SETTLED'}</code></div>
                                    <div class="meta-line"><strong>Settled At:</strong> ${inv.paid_at ? new Date(inv.paid_at).toLocaleString() : 'Recorded in Cooperative Ledger'}</div>
                                </div>

                                <div class="invoice-actions-row">
                                    <button class="btn-receipt" onclick="openPrintableReceipt(${booking.id})">${t('btnViewReceipt', '🖨️ View & Print Official Receipt')}</button>
                                </div>
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="coop-invoice-card unpaid" id="invoiceCard-${booking.id}">
                                <div class="invoice-card-header">
                                    <div>
                                        <span class="invoice-badge-label">${t('officialInvoice', 'OFFICIAL COOPERATIVE INVOICE')}</span>
                                        <div class="invoice-number">${inv.invoice_number}</div>
                                    </div>
                                    <span class="badge" style="background:#FFF4E5; color:#8C5300; border:1px solid #FFE0B2;">${t('paymentPendingBadge', '⏳ Payment Pending')}</span>
                                </div>

                                <div class="invoice-breakdown-table">
                                    <div class="inv-row">
                                        <span>${t('baseServiceDelivery', 'Base Service Delivery:')}</span>
                                        <span>₹${inv.base_charge}</span>
                                    </div>
                                    ${inv.is_emergency ? `
                                    <div class="inv-row emergency-row">
                                        <span>${t('emergencySurchargeText', '🚨 Emergency Priority Dispatch Surcharge:')}</span>
                                        <span>+₹${inv.emergency_fee}</span>
                                    </div>` : ""}
                                    <div class="inv-row divider"></div>
                                    <div class="inv-row highlight">
                                        <span>${t('workerDirectEarning', '👷 Worker Direct Earning (85%):')}</span>
                                        <span class="worker-earning-text">₹${inv.worker_earning}</span>
                                    </div>
                                    <div class="inv-row coop-share">
                                        <span>${t('coopWelfareShareText', '🏛️ Cooperative Welfare & Training Fund (15%):')}</span>
                                        <span class="coop-share-text">₹${inv.cooperative_share}</span>
                                    </div>
                                    <div class="inv-row total-row">
                                        <strong>${t('totalAmountDue', 'Total Amount Due:')}</strong>
                                        <strong class="total-amount">₹${inv.total_amount}</strong>
                                    </div>
                                </div>

                                <div class="payment-selection-box">
                                    <label class="pay-select-label">${t('selectPaymentMethod', 'Select Payment Settlement Method:')}</label>
                                    <div class="pay-method-chips" id="payMethods-${booking.id}">
                                        <button type="button" class="pay-chip active" data-method="UPI" onclick="selectPaymentMethod(${booking.id}, 'UPI', ${inv.total_amount})">
                                            ${t('payMethodUpi', '📱 UPI / QR Code')}
                                        </button>
                                        <button type="button" class="pay-chip" data-method="Cash" onclick="selectPaymentMethod(${booking.id}, 'Cash', ${inv.total_amount})">
                                            ${t('payMethodCash', '💵 Cash on Completion')}
                                        </button>
                                        <button type="button" class="pay-chip" data-method="Cooperative Account" onclick="selectPaymentMethod(${booking.id}, 'Cooperative Account', ${inv.total_amount})">
                                            ${t('payMethodCredit', '🏛️ Cooperative Credit')}
                                        </button>
                                    </div>
                                    <input type="hidden" id="chosenMethod-${booking.id}" value="UPI">

                                    <div class="pay-detail-container" id="payDetail-${booking.id}">
                                        <div class="mock-qr-wrap" id="qrWrap-${booking.id}">
                                            <div class="mock-qr-box">
                                                <div class="mock-qr-code">
                                                    <div class="qr-pattern">
                                                        <div class="qr-corner tl"></div>
                                                        <div class="qr-corner tr"></div>
                                                        <div class="qr-corner bl"></div>
                                                        <div class="qr-center-symbol">🤝</div>
                                                    </div>
                                                </div>
                                                <div class="qr-info">
                                                    <strong>Scan & Pay via any UPI App</strong>
                                                    <small>GPay • PhonePe • Paytm • BHIM</small>
                                                    <code class="upi-id">sahkaar.coop@upi</code>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="cash-note-wrap hidden" id="cashNote-${booking.id}">
                                            <div class="pay-method-note">
                                                ${t('cashHandoverNote', `💵 Cash on Completion: Please pay directly to your verified cooperative partner after inspecting completed service.`)}
                                            </div>
                                        </div>
                                        <div class="credit-note-wrap hidden" id="creditNote-${booking.id}">
                                            <div class="pay-method-note">
                                                ${t('creditAccountNote', `🏛️ Cooperative Society Credit: Settle directly against your verified Sahkaar member cooperative account balance.`)}
                                            </div>
                                        </div>
                                    </div>

                                    <button class="cta-gold pay-execute-btn" id="payBtn-${booking.id}" onclick="executePayment(${booking.id}, ${inv.total_amount})">
                                        ${t('btnSettlePayment', '💳 Settle Payment')} (₹${inv.total_amount})
                                    </button>
                                    <div id="payStatus-${booking.id}" class="pay-status-msg"></div>
                                </div>
                            </div>
                        `;
                    }
                }

                // Check rating status
                const rateRes = await fetch(`/api/ratings?bookingId=${booking.id}`);
                const rateData = await rateRes.json();

                if (rateData.success && rateData.rated) {
                    const r = rateData.rating;
                    const starsDisplay = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
                    const tagsHtml = (r.tags && r.tags.length > 0)
                        ? `<div class="review-tags-display">${r.tags.map(t => `<span class="review-tag-badge">${t}</span>`).join(" ")}</div>`
                        : "";

                    html += `
                        <div class="submitted-review-box">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <span class="verified-review-pill">✅ Verified Cooperative Review</span>
                                <small style="color:var(--muted); font-family:var(--font-mono); font-size:11px;">${r.created_at || "Recorded"}</small>
                            </div>
                            <div class="stars-gold" style="font-size:15px; margin-bottom:2px;">
                                ${starsDisplay} <strong style="color:var(--ink); font-size:13px;">(${r.stars}/5)</strong>
                            </div>
                            ${tagsHtml}
                            <p style="margin:4px 0 0; font-size:13px; color:var(--ink); font-style:${r.comment ? 'normal' : 'italic'};">
                                ${r.comment ? `"${r.comment}"` : "Satisfactory cooperative service completed."}
                            </p>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="rate-box" id="rateBox-${booking.id}">
                            <div class="rate-header">
                                <label style="font-weight:700; color:var(--teal-deep); font-size:13.5px;">⭐ Rate Your Cooperative Service</label>
                                <span class="rating-label-hint" id="starHint-${booking.id}">5★ Outstanding</span>
                            </div>

                            <div class="star-rating-input" id="starsContainer-${booking.id}">
                                <button type="button" class="star-btn active" data-val="1" onclick="selectStarRating(${booking.id}, 1)">★</button>
                                <button type="button" class="star-btn active" data-val="2" onclick="selectStarRating(${booking.id}, 2)">★</button>
                                <button type="button" class="star-btn active" data-val="3" onclick="selectStarRating(${booking.id}, 3)">★</button>
                                <button type="button" class="star-btn active" data-val="4" onclick="selectStarRating(${booking.id}, 4)">★</button>
                                <button type="button" class="star-btn active" data-val="5" onclick="selectStarRating(${booking.id}, 5)">★</button>
                            </div>
                            <input type="hidden" id="selectedStars-${booking.id}" value="5">

                            <div class="feedback-tags-row" id="tagsContainer-${booking.id}">
                                <button type="button" class="feedback-tag-chip" onclick="toggleRatingTag(this)">⏱️ Punctual</button>
                                <button type="button" class="feedback-tag-chip" onclick="toggleRatingTag(this)">🛠️ Skilled</button>
                                <button type="button" class="feedback-tag-chip" onclick="toggleRatingTag(this)">🤝 Cooperative</button>
                                <button type="button" class="feedback-tag-chip" onclick="toggleRatingTag(this)">🧹 Clean Work</button>
                                <button type="button" class="feedback-tag-chip" onclick="toggleRatingTag(this)">💡 Honest Pricing</button>
                            </div>

                            <input type="text" id="comment-${booking.id}" placeholder="Write a note about the service (optional)..." style="margin:8px 0;">

                            <button class="primary" style="font-size:12.5px; padding:8px 16px;" onclick="submitRating(${booking.id}, ${booking.assigned_worker_id || 'null'})">
                                🤝 Submit Verified Review
                            </button>
                            <div id="ratingMsg-${booking.id}" style="margin-top:6px;"></div>
                        </div>
                    `;
                }
            }

            item.innerHTML = html;
            result.appendChild(item);
        }

    } catch (error) {
        console.error(error);
        result.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

async function cancelCustomerBooking(bookingId) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
            fetchMyBookings();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Server connection failed.");
    }
}

const RATING_HINTS = {
    1: "1★ Unsatisfactory",
    2: "2★ Needs Improvement",
    3: "3★ Satisfactory",
    4: "4★ Good Service",
    5: "5★ Outstanding Cooperative Service"
};

function selectStarRating(bookingId, val) {
    const input = document.getElementById(`selectedStars-${bookingId}`);
    const hint = document.getElementById(`starHint-${bookingId}`);
    const container = document.getElementById(`starsContainer-${bookingId}`);
    if (!input || !container) return;

    input.value = val;
    if (hint) hint.textContent = RATING_HINTS[val] || `${val} Stars`;

    const btns = container.querySelectorAll(".star-btn");
    btns.forEach((btn, idx) => {
        btn.classList.toggle("active", (idx + 1) <= val);
    });
}

function toggleRatingTag(btn) {
    btn.classList.toggle("selected");
}

async function submitRating(bookingId, workerId) {
    const starsEl = document.getElementById(`selectedStars-${bookingId}`);
    const commentEl = document.getElementById(`comment-${bookingId}`);
    const tagsContainer = document.getElementById(`tagsContainer-${bookingId}`);
    const msg = document.getElementById(`ratingMsg-${bookingId}`);
    const rateBox = document.getElementById(`rateBox-${bookingId}`);

    const stars = starsEl ? Number(starsEl.value) : 5;
    const comment = commentEl ? commentEl.value.trim() : "";

    const selectedTags = [];
    if (tagsContainer) {
        tagsContainer.querySelectorAll(".feedback-tag-chip.selected").forEach(c => {
            selectedTags.push(c.textContent.trim());
        });
    }

    try {
        const res = await fetch("/api/ratings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingId,
                workerId,
                stars,
                comment,
                tags: selectedTags
            })
        });
        const data = await res.json();
        if (data.success) {
            const r = data.rating;
            const starsDisplay = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
            const tagsHtml = (r.tags && r.tags.length > 0)
                ? `<div class="review-tags-display">${r.tags.map(t => `<span class="review-tag-badge">${t}</span>`).join(" ")}</div>`
                : "";

            rateBox.outerHTML = `
                <div class="submitted-review-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span class="verified-review-pill">✅ Verified Cooperative Review</span>
                        <small style="color:var(--muted); font-family:var(--font-mono); font-size:11px;">Just now</small>
                    </div>
                    <div class="stars-gold" style="font-size:15px; margin-bottom:2px;">
                        ${starsDisplay} <strong style="color:var(--ink); font-size:13px;">(${r.stars}/5)</strong>
                    </div>
                    ${tagsHtml}
                    <p style="margin:4px 0 0; font-size:13px; color:var(--ink); font-style:${r.comment ? 'normal' : 'italic'};">
                        ${r.comment ? `"${r.comment}"` : "Satisfactory cooperative service completed."}
                    </p>
                </div>
            `;
        } else {
            if (msg) msg.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        console.error(error);
        if (msg) msg.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

// =====================================
// PAYMENT SETTLEMENT & INVOICING HELPERS (PHASE 10)
// =====================================

function selectPaymentMethod(bookingId, method, totalAmount) {
    const hiddenInput = document.getElementById(`chosenMethod-${bookingId}`);
    const chips = document.querySelectorAll(`#payMethods-${bookingId} .pay-chip`);
    const qrWrap = document.getElementById(`qrWrap-${bookingId}`);
    const cashNote = document.getElementById(`cashNote-${bookingId}`);
    const creditNote = document.getElementById(`creditNote-${bookingId}`);
    const payBtn = document.getElementById(`payBtn-${bookingId}`);

    if (hiddenInput) hiddenInput.value = method;

    chips.forEach(chip => {
        chip.classList.toggle("active", chip.getAttribute("data-method") === method);
    });

    if (qrWrap) qrWrap.classList.toggle("hidden", method !== "UPI");
    if (cashNote) cashNote.classList.toggle("hidden", method !== "Cash");
    if (creditNote) creditNote.classList.toggle("hidden", method !== "Cooperative Account");

    if (payBtn) {
        if (method === "UPI") {
            payBtn.innerHTML = `💳 Settle UPI Payment (₹${totalAmount})`;
        } else if (method === "Cash") {
            payBtn.innerHTML = `💵 Confirm Cash Handover (₹${totalAmount})`;
        } else if (method === "Cooperative Account") {
            payBtn.innerHTML = `🏛️ Settle via Cooperative Credit (₹${totalAmount})`;
        }
    }
}

async function executePayment(bookingId, totalAmount) {
    const hiddenInput = document.getElementById(`chosenMethod-${bookingId}`);
    const method = hiddenInput ? hiddenInput.value : "UPI";
    const payBtn = document.getElementById(`payBtn-${bookingId}`);
    const statusMsg = document.getElementById(`payStatus-${bookingId}`);

    if (payBtn) {
        payBtn.disabled = true;
        payBtn.textContent = "⏳ Processing Cooperative Settlement...";
    }
    if (statusMsg) statusMsg.innerHTML = "";

    try {
        const res = await fetch("/api/payments/mock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, method })
        });
        const data = await res.json();

        if (data.success) {
            if (typeof speak === "function") {
                speak(`Payment of ${totalAmount} rupees settled successfully via ${method}. Thank you for supporting our cooperative society.`);
            }
            if (statusMsg) {
                statusMsg.innerHTML = `<div class="success" style="padding:10px; margin-top:8px;">✅ Payment settled! Transaction Ref: <code>${data.payment ? data.payment.transaction_id : ''}</code></div>`;
            }
            // Auto refresh to render paid receipt card
            setTimeout(() => {
                fetchMyBookings();
            }, 800);
        } else {
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.innerHTML = `💳 Settle Payment (₹${totalAmount})`;
            }
            if (statusMsg) {
                statusMsg.innerHTML = `<div class="error" style="padding:10px; margin-top:8px;">${data.message}</div>`;
            }
        }
    } catch (err) {
        console.error("Payment settlement failed:", err);
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = `💳 Settle Payment (₹${totalAmount})`;
        }
        if (statusMsg) {
            statusMsg.innerHTML = `<div class="error" style="padding:10px; margin-top:8px;">Server connection failed.</div>`;
        }
    }
}

// Backward compatibility alias
async function payMock(bookingId, btn) {
    executePayment(bookingId, 0);
}

async function openPrintableReceipt(bookingId) {
    try {
        const res = await fetch(`/api/invoices?bookingId=${bookingId}`);
        const data = await res.json();
        if (!data.success || !data.invoice) {
            alert("Invoice not found.");
            return;
        }
        const inv = data.invoice;
        const printWin = window.open("", "_blank", "width=720,height=850");
        if (!printWin) {
            alert("Popup blocked! Please allow popups to view and print the cooperative receipt.");
            return;
        }
        const printDoc = printWin.document;
        printDoc.open();
        printDoc.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cooperative Receipt - ${inv.invoice_number}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #16261F; background: #fff; line-height: 1.5; }
        .receipt-container { max-width: 650px; margin: 0 auto; border: 1.5px solid #1F5C4E; border-radius: 12px; padding: 28px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1F5C4E; padding-bottom: 14px; margin-bottom: 20px; }
        .logo-title { font-size: 22px; font-weight: 800; color: #123B31; letter-spacing: -0.5px; }
        .coop-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C1592B; font-weight: 700; }
        .meta-col { text-align: right; font-size: 12px; color: #5B6B62; }
        .meta-col strong { color: #16261F; font-size: 14px; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1F5C4E; margin: 16px 0 8px; border-bottom: 1px dashed #DCE3DA; padding-bottom: 4px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; margin-bottom: 16px; }
        .info-card { background: #F5F7F1; border-radius: 8px; padding: 12px 14px; }
        .info-card strong { display: block; color: #123B31; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
        th { background: #1F5C4E; color: white; text-align: left; padding: 8px 12px; }
        th:last-child, td:last-child { text-align: right; }
        td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; }
        tr.highlight td { background: #E4EEE9; font-weight: 700; color: #123B31; }
        tr.total td { font-size: 16px; font-weight: 800; color: #123B31; border-top: 2px solid #1F5C4E; }
        .seal-box { margin-top: 24px; padding: 14px; background: #E4EEE9; border: 1.5px solid #1F5C4E; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; }
        .seal-text { font-size: 12px; color: #123B31; }
        .seal-badge { background: #1F5C4E; color: white; padding: 6px 12px; border-radius: 20px; font-weight: 800; font-size: 11px; letter-spacing: 1px; }
        .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #5B6B62; }
        .print-btn { background: #1F5C4E; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-bottom: 18px; }
        @media print { .print-btn { display: none; } body { padding: 0; } }
    </style>
</head>
<body>
    <div style="text-align: center;">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    <div class="receipt-container">
        <div class="header">
            <div>
                <div class="coop-tag">Smart India Hackathon 2026 • Ministry of Cooperation / NCCT</div>
                <div class="logo-title">SAHKAAR CONNECT</div>
                <small style="color:#5B6B62;">Cooperative Gig Services Platform • Problem ID: SIH26089</small>
            </div>
            <div class="meta-col">
                <strong>RECEIPT / TAX INVOICE</strong><br>
                <span>${inv.invoice_number}</span><br>
                <span>Booking ID: #${inv.booking_id}</span><br>
                <span>Date: ${inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            </div>
        </div>

        <div class="grid-2">
            <div class="info-card">
                <span class="coop-tag">Customer Details</span>
                <strong>${inv.customer.name || 'Customer'}</strong>
                <div>📞 ${inv.customer.phone || 'N/A'}</div>
                <div>📍 ${inv.customer.address || 'Verified Service Location'}</div>
            </div>
            <div class="info-card">
                <span class="coop-tag">Assigned Worker (Cooperative Member)</span>
                <strong>${inv.worker.name || 'Assigned Worker'}</strong>
                <div>🛠️ ${inv.worker.skill || inv.service}</div>
                <div>📞 ${inv.worker.phone || 'N/A'}</div>
                <div>🛡️ Member ID: COOP-${inv.worker.id ? String(inv.worker.id).padStart(4, '0') : '0001'}</div>
            </div>
        </div>

        <div class="section-title">Transparent Cooperative Pricing Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Share %</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Service Delivery: ${inv.service}</td>
                    <td>-</td>
                    <td>₹${inv.base_charge}</td>
                </tr>
                ${inv.is_emergency ? `
                <tr>
                    <td>🚨 Emergency Rapid Dispatch Surcharge</td>
                    <td>-</td>
                    <td>+₹${inv.emergency_fee}</td>
                </tr>` : ''}
                <tr class="highlight">
                    <td>Worker Direct Earning (Zero Middleman Cut)</td>
                    <td>85%</td>
                    <td>₹${inv.worker_earning}</td>
                </tr>
                <tr>
                    <td>Cooperative Society Welfare & Training Fund (NCCT)</td>
                    <td>15%</td>
                    <td>₹${inv.cooperative_share}</td>
                </tr>
                <tr class="total">
                    <td>TOTAL SETTLED AMOUNT</td>
                    <td>100%</td>
                    <td>₹${inv.total_amount}</td>
                </tr>
            </tbody>
        </table>

        <div class="seal-box">
            <div class="seal-text">
                <strong>Settlement Mode:</strong> ${inv.payment_method || 'UPI / Digital Settlement'}<br>
                <strong>Transaction ID:</strong> <code>${inv.transaction_id || 'TXN-SAHKAAR-MOCK'}</code><br>
                <strong>Payment Timestamp:</strong> ${inv.paid_at ? new Date(inv.paid_at).toLocaleString() : 'Recorded in Ledger'}
            </div>
            <div class="seal-badge">✓ OFFICIALLY SETTLED</div>
        </div>

        <div class="footer">
            <p>Thank you for choosing democratic, community-owned cooperative labor. All earnings directly empower local gig workers under NCCT guidelines.</p>
        </div>
    </div>
</body>
</html>`);
        printDoc.close();
    } catch (err) {
        console.error("Receipt generation error:", err);
        alert("Failed to load invoice receipt.");
    }
}


// =====================================
// WORKER DASHBOARD
// =====================================

async function fetchWorkerDashboard() {
    const phone = document.getElementById("workerLookupPhone").value.trim();
    const result = document.getElementById("workerDashboardResult");

    if (!phone) {
        result.innerHTML = `<div class="error">Please enter your phone number.</div>`;
        return;
    }

    result.innerHTML = `<div class="skeleton" style="height:70px;"></div>`;

    try {
        const workerRes = await fetch(`/api/workers?phone=${encodeURIComponent(phone)}`);
        const workerData = await workerRes.json();

        if (!workerData.success || !workerData.worker) {
            result.innerHTML = `
                <div class="empty-state">
                    <span class="icon">🔍</span>
                    No worker is registered with this phone number.
                </div>
            `;
            return;
        }

        const worker = workerData.worker;

        const ratingRes = await fetch(`/api/ratings?workerId=${worker.id}`);
        const ratingData = await ratingRes.json();

        const earnRes = await fetch(`/api/workers/${worker.id}/earnings`).catch(() => null);
        const earnData = earnRes ? await earnRes.json() : { success: false, earnings: {} };
        const earnings = earnData.earnings || { today: 0, week: 0, total: 0, cooperativeShare: 0, completedJobsCount: 0 };

        const verifiedBadge = worker.verified
            ? `<span class="badge verified">${SEAL_ICON}Verified Member</span>`
            : `<span class="badge unverified">🟡 Pending Review</span>`;

        const ratingText = ratingData.average
            ? `⭐ ${ratingData.average} (${ratingData.count} ratings)`
            : "No ratings yet";

        const isAvail = worker.is_available !== 0;
        const availBtn = isAvail
            ? `<button class="avail-toggle-btn online" onclick="toggleWorkerLiveAvailability(${worker.id}, 1)">🟢 AVAILABLE FOR WORK</button>`
            : `<button class="avail-toggle-btn offline" onclick="toggleWorkerLiveAvailability(${worker.id}, 0)">🔴 BUSY / ON LEAVE</button>`;

        let html = `
            <div class="worker-profile">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                    <div>
                        <strong style="font-size:19px;">${worker.name}</strong><br>
                        <span class="role-badge worker" style="margin-top:4px;">${worker.skill}</span>
                        <div style="margin-top:6px;">${verifiedBadge}</div>
                    </div>
                    <div style="text-align:right;">
                        ${availBtn}
                    </div>
                </div>
                <div style="font-size:13.5px; line-height:1.7; color:var(--ink); margin-bottom:12px;">
                    <strong>Affiliated Society:</strong> 🏛️ ${worker.society_name || "Navodaya Labour Cooperative Society Ltd."} (${worker.society_reg_number || "MSCS/CR/2026/089-A"}) • ${worker.society_cluster || "North District - Cluster 1"}<br>
                    <strong>Experience:</strong> ${worker.experience || "1 year"}<br>
                    <strong>Certification:</strong> ${worker.certification || "Cooperative / NCCT Certified"}<br>
                    <strong>Service Area:</strong> ${worker.location || "Greater Noida"}<br>
                    <strong>Operating Hours:</strong> ${worker.availability || "Full Day"}<br>
                    <strong>Rating:</strong> ${ratingText}
                </div>

                <div class="welfare-card">
                    <div class="welfare-title">🛡️ Cooperative Welfare & Social Security (NCCT)</div>
                    <div class="welfare-grid">
                        <div class="welfare-item">
                            <span class="w-label">Welfare Fund:</span>
                            <span class="w-val">${worker.welfare_status || "Enrolled in Cooperative Welfare Fund (Demo)"}</span>
                        </div>
                        <div class="welfare-item">
                            <span class="w-label">Social Insurance:</span>
                            <span class="w-val">${worker.insurance_status || "Covered: PM Suraksha Bima / Accidental (Demo)"}</span>
                        </div>
                    </div>
                    <small class="hint">Demonstration cooperative coverage — future-ready for NCCT / e-Shram linkage.</small>
                </div>
            </div>

            <!-- Cooperative Earnings Ledger -->
            <div class="earnings-summary-card">
                <div class="earnings-header">
                    <span class="earnings-title">💰 Cooperative Earnings Ledger</span>
                    <span class="completed-jobs-chip">${earnings.completedJobsCount} Jobs Completed</span>
                </div>
                <div class="earnings-grid">
                    <div class="earnings-stat-card">
                        <span class="stat-label">Today's Earnings</span>
                        <span class="stat-val">₹${earnings.today}</span>
                    </div>
                    <div class="earnings-stat-card">
                        <span class="stat-label">This Week</span>
                        <span class="stat-val">₹${earnings.week}</span>
                    </div>
                    <div class="earnings-stat-card">
                        <span class="stat-label">Coop Share (15%)</span>
                        <span class="stat-val coop">₹${earnings.cooperativeShare}</span>
                    </div>
                    <div class="earnings-stat-card highlight">
                        <span class="stat-label">Net Take-Home</span>
                        <span class="stat-val">₹${earnings.total}</span>
                    </div>
                </div>
                <small class="hint">Transparent cooperative ledger: zero private middleman commission — 85% directly to you, 15% to NCCT welfare fund.</small>
            </div>

            <!-- Cooperative Fair Wage Advantage Card (Phase 15) -->
            <div class="fair-wage-advantage-card">
                <div class="fair-wage-advantage-header">
                    <div>
                        <span class="fwa-badge">⚖️ FAIR LIVING WAGE ADVANTAGE</span>
                        <div class="fwa-title">Cooperative Member Surplus Protection</div>
                    </div>
                    <div class="fwa-metric-box">
                        <span class="fwa-metric-label">Estimated App Fees Saved</span>
                        <strong class="fwa-surplus-val">+₹${Math.round(earnings.total * 0.28 + (earnings.completedJobsCount * 40))}</strong>
                    </div>
                </div>
                <p class="fwa-desc">
                    Unlike private gig platforms deducting 25–35% middleman commission plus customer booking fees, <strong>Sahkaar Connect</strong> guarantees you keep <strong>85% net take-home</strong>, with the remaining 15% funding your own accidental social security.
                </p>
                <div class="fwa-pills">
                    <span class="fwa-pill">🛡️ 1.5x Above Statutory Min Wage</span>
                    <span class="fwa-pill">🚫 Zero Middleman Exploitation</span>
                    <span class="fwa-pill">☂️ PM Suraksha Bima Covered</span>
                </div>
            </div>
        `;

        // Active Jobs
        const activeRes = await fetch(`/api/bookings?assignedWorkerId=${worker.id}`);
        const activeData = await activeRes.json();
        const activeBookings = (activeData.bookings || []).filter(b => b.status === "Assigned" || b.status === "In Progress");

        html += `<h3 style="margin-bottom:12px;">My Active Jobs (${activeBookings.length})</h3>`;

        if (activeBookings.length === 0) {
            html += `<div class="empty-state"><span class="icon">🗓️</span>No active jobs right now.</div>`;
        } else {
            activeBookings.forEach(booking => {
                const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 Emergency</span> ` : "";
                const statusBadge = booking.status === "In Progress"
                    ? `<span class="badge" style="background:#EDE7F6; color:#4A148C; border:1px solid #D1C4E9;">⚡ In Progress</span>`
                    : `<span class="badge" style="background:#E3F2FD; color:#0D47A1; border:1px solid #BBDEFB;">👷 Assigned</span>`;

                const actionBtn = booking.status === "Assigned"
                    ? `<button class="cta-gold" onclick="startWorkerJob(${booking.id})">⚡ Start Job (In Progress)</button>`
                    : `<button class="secondary" onclick="markComplete(${booking.id})">✅ Mark Complete & Generate Invoice</button>`;

                html += `
                    <div class="booking-item">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <div>${emergencyTag}<strong>Booking #${booking.id}</strong></div>
                            ${statusBadge}
                        </div>
                        <strong>Service:</strong> ${booking.service}<br>
                        <strong>Customer:</strong> ${booking.customer_name} (📞 <a href="tel:${booking.customer_phone}">${booking.customer_phone}</a>)<br>
                        <strong>Address:</strong> ${booking.address}<br>
                        <strong>Date:</strong> ${booking.booking_date} ${booking.booking_time}<br>
                        <div style="margin-top:10px;">${actionBtn}</div>
                    </div>
                `;
            });
        }

        // Completed Jobs & Cooperative Settlement Status (Phase 10)
        try {
            const workerInvRes = await fetch(`/api/invoices?workerId=${worker.id}`);
            const workerInvData = await workerInvRes.json();
            const workerInvoices = (workerInvData.success && workerInvData.invoices) ? workerInvData.invoices.slice(0, 5) : [];

            if (workerInvoices.length > 0) {
                html += `<h3 style="margin:24px 0 12px;">Completed Jobs & Settlement Status (${workerInvoices.length})</h3>`;
                html += `<div class="worker-settlements-list">`;
                workerInvoices.forEach(inv => {
                    const isPaid = inv.payment_status === "paid";
                    const statusBadge = isPaid
                        ? `<span class="badge verified">${SEAL_ICON} Paid (${inv.payment_method || 'Digital'})</span>`
                        : `<span class="badge" style="background:#FFF4E5; color:#8C5300; border:1px solid #FFE0B2;">⏳ Awaiting Payment</span>`;

                    html += `
                        <div class="worker-settlement-card">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                <div>
                                    <strong style="font-size:14.5px;">${inv.service}</strong>
                                    <div style="font-size:12px; color:var(--muted); font-family:var(--font-mono);">Booking #${inv.booking_id} • ${inv.invoice_number}</div>
                                </div>
                                ${statusBadge}
                            </div>
                            <div style="font-size:13px; line-height:1.6; margin-bottom:6px;">
                                <strong>Customer:</strong> ${inv.customer.name || 'Verified Customer'} (📞 ${inv.customer.phone || 'N/A'})<br>
                                <strong>Address:</strong> ${inv.customer.address || 'Customer Location'}
                            </div>
                            <div class="settlement-earning-split">
                                <div>Your Net Take-Home (85%): <strong class="earning-amt">₹${inv.worker_earning}</strong></div>
                                <div style="font-size:12px; color:var(--muted);">Cooperative Welfare (15%): ₹${inv.cooperative_share} | Total: ₹${inv.total_amount}</div>
                            </div>
                            ${isPaid ? `<div style="font-size:11.5px; color:var(--teal); margin-top:5px; font-family:var(--font-mono);">Settlement Ref: <code>${inv.transaction_id || 'SETTLED'}</code></div>` : ''}
                        </div>
                    `;
                });
                html += `</div>`;
            }
        } catch (invErr) {
            console.error("Failed to load worker invoices:", invErr);
        }

        // Available Jobs
        const jobsRes = await fetch(`/api/bookings?service=${encodeURIComponent(worker.skill)}&status=Pending`);
        const jobsData = await jobsRes.json();
        const unpassedJobs = (jobsData.bookings || []).filter(b => !window.dismissedJobIds.has(b.id));

        html += `<h3 style="margin:22px 0 12px;">Incoming Available Jobs (${unpassedJobs.length})</h3>`;

        if (!isAvail) {
            html += `<div class="busy-alert-banner">⏸️ You are currently marked as <strong>BUSY / ON LEAVE</strong>. Switch your status above to <strong>AVAILABLE</strong> to accept new jobs.</div>`;
        }

        // Emergency voice prompt for incoming emergency dispatch
        const hasEmergency = unpassedJobs.some(b => b.is_emergency);
        if (hasEmergency && typeof speak === "function" && !window.hasAlertedEmergencyWorker) {
            speak(`Urgent emergency call in your area for ${worker.skill}. Please review and accept immediately.`);
            window.hasAlertedEmergencyWorker = true;
        }

        if (unpassedJobs.length === 0) {
            html += `<div class="empty-state"><span class="icon">📭</span>No pending jobs right now for ${worker.skill}.</div>`;
        } else {
            unpassedJobs.forEach(booking => {
                const isEmerg = booking.is_emergency;
                const cardClass = isEmerg ? "booking-item emergency-job-card" : "booking-item";

                html += `
                    <div class="${cardClass}" id="avail-job-${booking.id}">
                        ${isEmerg ? `
                            <div class="emergency-worker-alert-strip">
                                🚨 URGENT EMERGENCY DISPATCH (SLA: ${booking.target_response_mins || 30} mins)
                            </div>
                        ` : ''}
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                            <div>
                                ${isEmerg ? `<span class="badge emergency">🚨 EMERGENCY</span> ` : ''}
                                <strong style="font-size:15px;">${booking.service}</strong>
                                ${isEmerg ? `<div class="emergency-nature-text">⚠️ ${booking.emergency_type || 'Rapid Assistance Required'}</div>` : ''}
                            </div>
                            <span class="badge" style="background:#FFF4E5; color:#8C5300; border:1px solid #FFE0B2;">Open Dispatch</span>
                        </div>
                        <strong>Booking ID:</strong> #${booking.id}<br>
                        <strong>Customer:</strong> ${booking.customer_name}<br>
                        <strong>Address:</strong> ${booking.address}<br>
                        <strong>Date & Time:</strong> ${booking.booking_date} ${booking.booking_time}<br>
                        ${isEmerg ? `
                            <div class="emergency-incentive-chip">
                                ⚡ Includes +₹50 Rapid Mobilization Bonus (85% to you)
                            </div>
                        ` : ''}
                        <div class="job-actions-row" style="margin-top:12px; display:flex; gap:10px;">
                            <button class="${isEmerg ? 'cta-gold emergency-accept-btn' : 'primary'}" ${!isAvail ? "disabled style='opacity:0.5; cursor:not-allowed;'" : ""} onclick="acceptJob(${booking.id}, ${worker.id})">
                                ${isEmerg ? '🚨 Accept Emergency Call' : 'Accept Job'}
                            </button>
                            <button class="btn-pass" onclick="passAvailableJob(${booking.id})">Pass / Decline</button>
                        </div>
                    </div>
                `;
            });
        }

        // Ratings & Reviews
        html += `<h3 style="margin:26px 0 14px;">⭐ Member Ratings & Feedback</h3>`;
        const reviews = ratingData.ratings || [];
        const breakdown = ratingData.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const totalRatings = ratingData.count || 0;

        if (totalRatings > 0) {
            html += `
                <div class="rating-breakdown-card">
                    <div class="score-summary-col">
                        <div class="big-score">${ratingData.average ? ratingData.average.toFixed(1) : "5.0"}</div>
                        <div class="stars-gold" style="font-size:16px;">
                            ${ratingData.average ? "★".repeat(Math.round(ratingData.average)) + "☆".repeat(5 - Math.round(ratingData.average)) : "★★★★★"}
                        </div>
                        <small style="color:var(--muted); font-size:12px; margin-top:3px;">${totalRatings} verified review${totalRatings === 1 ? '' : 's'}</small>
                    </div>
                    <div class="bars-col">
                        ${[5, 4, 3, 2, 1].map(stars => {
                            const count = breakdown[stars] || 0;
                            const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                            return `
                                <div class="rating-bar-row">
                                    <span class="bar-star-label">${stars}★</span>
                                    <div class="bar-track">
                                        <div class="bar-fill" style="width:${pct}%;"></div>
                                    </div>
                                    <span class="bar-count-label">${count}</span>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        }

        if (reviews.length === 0) {
            html += `<div class="empty-state"><span class="icon">⭐</span>No customer ratings yet. Complete jobs to build your cooperative service reputation!</div>`;
        } else {
            reviews.forEach(r => {
                const starsDisplay = "★".repeat(Math.min(5, Math.max(1, r.stars))) + "☆".repeat(5 - Math.min(5, Math.max(1, r.stars)));
                const tagsHtml = (r.tags && r.tags.length > 0)
                    ? `<div class="review-tags-display" style="margin:4px 0 6px;">${r.tags.map(t => `<span class="review-tag-badge">${t}</span>`).join(" ")}</div>`
                    : "";

                html += `
                    <div class="review-item">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                            <div>
                                <strong style="font-size:14px;">${r.customer_name || "Verified Customer"}</strong>
                                <span style="color:var(--muted); font-size:12px; margin-left:4px;">for ${r.service || worker.skill}</span>
                            </div>
                            <small style="color:var(--muted); font-family:var(--font-mono); font-size:11.5px;">${r.created_at || "Verified"}</small>
                        </div>
                        <div class="stars-gold" style="font-size:13.5px; margin-bottom:4px;">
                            ${starsDisplay} <span style="color:var(--ink); font-weight:700; font-size:12.5px; margin-left:4px;">(${r.stars}/5)</span>
                        </div>
                        ${tagsHtml}
                        <p style="margin:0; font-size:13px; color:var(--ink); font-style:${r.comment ? 'normal' : 'italic'};">
                            ${r.comment ? `"${r.comment}"` : "Satisfactory cooperative service completion."}
                        </p>
                    </div>
                `;
            });
        }

        result.innerHTML = html;

    } catch (error) {
        console.error(error);
        result.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

// Helper: Pass / Dismiss an open job
window.dismissedJobIds = window.dismissedJobIds || new Set();

function passAvailableJob(bookingId) {
    window.dismissedJobIds.add(bookingId);
    const item = document.getElementById(`avail-job-${bookingId}`);
    if (item) {
        item.style.opacity = "0.45";
        item.innerHTML = `<div style="padding:10px; color:var(--muted); font-size:13px;"><em>Job #${bookingId} passed. Available for other cooperative members.</em></div>`;
    }
}

// Helper: Toggle Live Availability
async function toggleWorkerLiveAvailability(workerId, currentStatus) {
    const nextStatus = currentStatus ? 0 : 1;
    try {
        const res = await fetch(`/api/workers/${workerId}/availability`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAvailable: nextStatus })
        });
        const data = await res.json();
        if (data.success) {
            fetchWorkerDashboard();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Server connection failed.");
    }
}

async function acceptJob(bookingId, workerId) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workerId })
        });
        const data = await res.json();
        alert(data.message);
        fetchWorkerDashboard();
    } catch (error) {
        console.error(error);
        alert("Server connection failed.");
    }
}

async function startWorkerJob(bookingId) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.success) {
            fetchWorkerDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Server connection failed.");
    }
}

async function markComplete(bookingId) {
    try {
        const res = await fetch(`/api/bookings/${bookingId}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        alert(data.message);
        fetchWorkerDashboard();
    } catch (error) {
        console.error(error);
        alert("Server connection failed.");
    }
}


// =====================================
// FEDERATION ADMIN DASHBOARD (PHASE 8)
// =====================================

// Tab switching
function switchAdminTab(tabName) {
    const tabs = ["overview", "workers", "bookings", "emergency", "forecast", "societies"];
    tabs.forEach(t => {
        const btn = document.getElementById(`adminTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const content = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (btn) btn.classList.toggle("active", t === tabName);
        if (content) content.classList.toggle("hidden", t !== tabName);
    });
    if (tabName === "emergency") {
        loadAdminEmergencyQueue();
    }
    if (tabName === "societies") {
        loadAdminSocieties();
    }
    if (tabName === "forecast") {
        loadAdminForecastAndAnalytics();
    }
}

// 1. Overview & Metrics
async function loadAdminStats() {
    const el = document.getElementById("adminStats");
    if (!el) return;
    el.innerHTML = `<div class="skeleton" style="height:80px;"></div><div class="skeleton" style="height:80px;"></div><div class="skeleton" style="height:80px;"></div>`;
    try {
        const res = await adminFetch("/api/admin/stats");
        const data = await res.json();
        const s = data.stats;

        el.innerHTML = `
            <div class="stat-card">
                <div class="lbl">Total Registered Workers</div>
                <strong>${s.totalWorkers}</strong>
                <small class="subtext">${s.availableWorkers} available online</small>
            </div>
            <div class="stat-card highlight-green">
                <div class="lbl">NCCT Verified Members</div>
                <strong>${s.verifiedWorkers}</strong>
                <small class="subtext">Cooperative certified</small>
            </div>
            <div class="stat-card ${s.pendingWorkers > 0 ? 'highlight-amber' : ''}">
                <div class="lbl">Pending Verification</div>
                <strong>${s.pendingWorkers}</strong>
                <small class="subtext">${s.pendingWorkers > 0 ? 'Action required' : 'All reviews clear'}</small>
            </div>
            <div class="stat-card">
                <div class="lbl">Registered Customers</div>
                <strong>${s.totalCustomers}</strong>
                <small class="subtext">Active community users</small>
            </div>
            <div class="stat-card">
                <div class="lbl">Total Bookings</div>
                <strong>${s.totalBookings}</strong>
                <small class="subtext">${s.completedBookings} completed</small>
            </div>
            <div class="stat-card ${s.emergencyBookings > 0 ? 'highlight-red' : ''}">
                <div class="lbl">Emergency Requests</div>
                <strong>${s.emergencyBookings}</strong>
                <small class="subtext">High priority dispatch</small>
            </div>
            <div class="stat-card highlight-teal">
                <div class="lbl">NCCT Welfare Pool (15%)</div>
                <strong>₹${s.totalWelfareFund}</strong>
                <small class="subtext">Social security & insurance</small>
            </div>
            <div class="stat-card highlight-teal">
                <div class="lbl">Gross Volume (GMV)</div>
                <strong>₹${s.totalGMV}</strong>
                <small class="subtext">Zero exploitative commission</small>
            </div>
            <div class="stat-card highlight-gold">
                <div class="lbl">Direct Worker Payout (85%)</div>
                <strong>₹${s.totalWorkerPayout}</strong>
                <small class="subtext">Fair wage take-home</small>
            </div>
        `;
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load federation stats. Please re-login.</div>`;
    }
}

// 2. Worker Verification & Roster
window.allAdminWorkers = [];
window.currentWorkerFilter = "all";

async function loadAdminWorkers() {
    const el = document.getElementById("adminWorkers");
    if (!el) return;
    el.innerHTML = `<div class="skeleton" style="height:60px;"></div><div class="skeleton" style="height:60px;"></div>`;
    try {
        const res = await adminFetch("/api/admin/workers");
        const data = await res.json();
        window.allAdminWorkers = data.workers || [];
        renderAdminWorkers(window.currentWorkerFilter);
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load worker roster.</div>`;
    }
}

function filterAdminWorkers(filter) {
    window.currentWorkerFilter = filter;
    ["All", "Pending", "Verified"].forEach(f => {
        const chip = document.getElementById(`wChip${f}`);
        if (chip) chip.classList.toggle("active", f.toLowerCase() === filter);
    });
    renderAdminWorkers(filter);
}

function renderAdminWorkers(filter) {
    const el = document.getElementById("adminWorkers");
    if (!el) return;

    let list = window.allAdminWorkers || [];
    if (filter === "pending") {
        list = list.filter(w => !w.verified);
    } else if (filter === "verified") {
        list = list.filter(w => !!w.verified);
    }

    if (list.length === 0) {
        el.innerHTML = `<div class="empty-state"><span class="icon">👷</span>No workers found under '${filter}' filter.</div>`;
        return;
    }

    let html = `<div class="worker-roster-grid">`;
    list.forEach(worker => {
        const verifiedBadge = worker.verified
            ? `<span class="badge verified">🛡️ NCCT Verified Member</span>`
            : `<span class="badge unverified">⏳ Pending Credential Review</span>`;

        const availBadge = worker.is_available
            ? `<span class="badge" style="background:#E8F5E9; color:#1B5E20; border:1px solid #81C784;">🟢 Online</span>`
            : `<span class="badge" style="background:#FFEBEE; color:#B71C1C; border:1px solid #E57373;">🔴 Busy / On Leave</span>`;

        const ratingDisplay = worker.avg_rating > 0
            ? `⭐ ${worker.avg_rating} (${worker.rating_count} reviews)`
            : `⭐ No ratings yet`;

        html += `
            <div class="admin-worker-card ${!worker.verified ? 'pending-card' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
                    <div>
                        <strong style="font-size:16px;">${worker.name}</strong>
                        <span class="role-badge worker" style="margin-left:6px; font-size:11px;">${worker.skill}</span>
                    </div>
                    <div style="display:flex; gap:6px;">
                        ${availBadge}
                        ${verifiedBadge}
                    </div>
                </div>

                <div class="worker-card-details">
                    <div><strong>Phone:</strong> <a href="tel:${worker.phone}" style="color:var(--teal-deep); font-weight:700;">${worker.phone}</a></div>
                    <div><strong>Experience:</strong> ${worker.experience || "1 year"}</div>
                    <div><strong>Certification:</strong> <span class="badge" style="background:var(--paper); border:1px solid var(--line);">${worker.certification || "Self-Trained"}</span></div>
                    <div><strong>Area:</strong> ${worker.location || "Greater Noida"}</div>
                    <div><strong>Ratings & Jobs:</strong> ${ratingDisplay} • ${worker.completed_jobs} completed</div>
                    <div><strong>Welfare Status:</strong> ${worker.welfare_status || "Enrolled in Cooperative Welfare Fund (Demo)"}</div>
                    <div><strong>Social Insurance:</strong> ${worker.insurance_status || "Covered: PM Suraksha Bima (Demo)"}</div>
                </div>

                <div class="admin-action-row" style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
                    ${!worker.verified ? `
                        <button class="primary" style="font-size:12.5px; padding:7px 14px;" onclick="verifyWorker(${worker.id}, 'approve')">✅ Approve & Verify (NCCT)</button>
                        <button class="btn-cancel" style="font-size:12.5px; padding:7px 14px;" onclick="verifyWorker(${worker.id}, 'reject')">❌ Reject Application</button>
                    ` : `
                        <button class="btn-cancel" style="font-size:11.5px; padding:5px 10px; opacity:0.85;" onclick="verifyWorker(${worker.id}, 'reject')">Revoke Verification</button>
                    `}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    el.innerHTML = html;
}

async function verifyWorker(workerId, action) {
    const confirmMsg = action === "approve"
        ? "Approve and verify this worker as an official NCCT Cooperative Member?"
        : "Are you sure you want to reject/revoke verification for this worker?";

    if (!confirm(confirmMsg)) return;

    try {
        const res = await adminFetch("/api/admin/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workerId, action })
        });
        const data = await res.json();
        alert(data.message);
        loadAdminWorkers();
        loadAdminStats();
    } catch (error) {
        console.error(error);
    }
}

// 3. Bookings Allocation & Dispatch
window.allAdminBookings = [];
window.currentBookingFilter = "all";

async function loadAdminBookings() {
    const el = document.getElementById("adminBookings");
    if (!el) return;
    el.innerHTML = `<div class="skeleton" style="height:60px;"></div><div class="skeleton" style="height:60px;"></div>`;
    try {
        const res = await adminFetch("/api/admin/bookings");
        const data = await res.json();
        window.allAdminBookings = data.bookings || [];
        renderAdminBookings(window.currentBookingFilter);
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load bookings list.</div>`;
    }
}

function filterAdminBookings(filter) {
    window.currentBookingFilter = filter;
    ["All", "Emergency", "Pending", "Assigned", "InProgress", "Completed"].forEach(f => {
        const chip = document.getElementById(`bChip${f}`);
        if (chip) {
            const match = (f.toLowerCase() === filter.toLowerCase()) || (f === "InProgress" && filter === "In Progress");
            chip.classList.toggle("active", match);
        }
    });
    renderAdminBookings(filter);
}

function renderAdminBookings(filter) {
    const el = document.getElementById("adminBookings");
    if (!el) return;

    let list = window.allAdminBookings || [];
    if (filter === "emergency") {
        list = list.filter(b => b.is_emergency == 1);
    } else if (filter !== "all") {
        list = list.filter(b => b.status === filter);
    }

    if (list.length === 0) {
        el.innerHTML = `<div class="empty-state"><span class="icon">📋</span>No bookings found under '${filter}' filter.</div>`;
        return;
    }

    let html = "";
    list.forEach(booking => {
        const isEmergency = booking.is_emergency == 1;
        const emergencyTag = isEmergency ? `<div class="emergency-strip">🚨 PRIORITY EMERGENCY DISPATCH</div>` : "";

        let statusClass = "pending";
        if (booking.status === "Assigned") statusClass = "assigned";
        if (booking.status === "In Progress") statusClass = "progress";
        if (booking.status === "Completed") statusClass = "completed";
        if (booking.status === "Cancelled") statusClass = "cancelled";

        const assignedInfo = booking.worker_name
            ? `<div class="assigned-worker-card" style="margin:8px 0 10px;">
                 <span class="worker-avatar">👷</span>
                 <div class="worker-details">
                     <strong>Assigned Worker:</strong> ${booking.worker_name} (${booking.worker_skill || booking.service})<br>
                     <span class="worker-sub">Worker Phone: <strong>${booking.worker_phone || "N/A"}</strong></span>
                 </div>
               </div>`
            : "";

        const actions = booking.status === "Pending"
            ? `<div style="margin-top:10px;">
                 <button class="secondary" style="font-size:12.5px;" onclick="suggestWorkers(${booking.id})">🔍 Suggest Cooperative Workers</button>
                 <div id="matches-${booking.id}" style="margin-top:8px;"></div>
               </div>`
            : "";

        html += `
            <div class="booking-item admin-booking-item ${isEmergency ? 'emergency-border' : ''}">
                ${emergencyTag}
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <div>
                        <strong style="font-size:16px;">${booking.service}</strong>
                        <span style="color:var(--muted); font-size:13px;">#${booking.id}</span>
                    </div>
                    <span class="badge ${statusClass}">${booking.status}</span>
                </div>

                <div style="font-size:13px; line-height:1.6; color:var(--ink);">
                    <strong>Customer:</strong> ${booking.customer_name} (<a href="tel:${booking.customer_phone}">${booking.customer_phone}</a>)<br>
                    <strong>Address:</strong> ${booking.address}<br>
                    <strong>Scheduled For:</strong> ${booking.booking_date} at ${booking.booking_time}
                </div>

                ${assignedInfo}
                ${actions}
            </div>
        `;
    });

    el.innerHTML = html;
}

// 4. Rule-Based Smart Worker Matching
async function suggestWorkers(bookingId) {
    const el = document.getElementById(`matches-${bookingId}`);
    if (!el) return;
    el.innerHTML = `<div class="skeleton" style="height:36px;margin-top:8px;"></div>`;

    try {
        const res = await adminFetch(`/api/admin/match/${bookingId}`);
        const data = await res.json();

        if (!data.matches || data.matches.length === 0) {
            el.innerHTML = `<div class="empty-state" style="padding:12px;"><span class="icon">🤷</span>No registered workers for this skill yet.</div>`;
            return;
        }

        let html = `
            <div class="match-suggestions-drawer">
                <div style="font-size:11.5px; color:var(--teal-deep); font-family:var(--font-mono); margin-bottom:8px; font-weight:700;">
                    ${data.note}
                </div>
        `;

        data.matches.forEach((worker, idx) => {
            const isTop = idx === 0;
            html += `
                <div class="match-candidate-item ${isTop ? 'top-match' : ''}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                        <div>
                            <strong style="font-size:14px;">${worker.name}</strong>
                            ${isTop ? '<span class="badge" style="background:#E8F5E9; color:#1B5E20; border:1px solid #81C784; margin-left:4px;">Top Match</span>' : ''}
                            <span class="score-pill">${worker.matchScore} pts</span>
                        </div>
                        <button class="primary" style="font-size:12px; padding:5px 12px;" onclick="assignWorker(${bookingId}, ${worker.id})">Assign</button>
                    </div>
                    <div style="font-size:11.5px; color:var(--muted); line-height:1.4;">
                        ${worker.reasons.map(r => `<span class="reason-tag">${r}</span>`).join(" ")}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        el.innerHTML = html;
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not calculate matches.</div>`;
    }
}

async function assignWorker(bookingId, workerId) {
    try {
        const res = await adminFetch("/api/admin/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, workerId })
        });
        const data = await res.json();
        alert(data.message);
        loadAdminBookings();
        loadAdminStats();
    } catch (error) {
        console.error(error);
    }
}

// =====================================
// PHASE 15: PREDICTIVE DEMAND & FAIR WAGE ANALYTICS
// =====================================

async function loadAdminForecastAndAnalytics() {
    const clusterSelect = document.getElementById("forecastClusterSelect");
    const seasonSelect = document.getElementById("forecastSeasonSelect");
    const clusterId = clusterSelect ? clusterSelect.value : "";
    const season = seasonSelect ? seasonSelect.value : "";

    const bannerEl = document.getElementById("clusterMobilizationBanner");
    const kpiRibbon = document.getElementById("analyticsKpiRibbon");
    const forecastEl = document.getElementById("adminForecast");
    const fairWageEl = document.getElementById("adminFairWageMatrix");

    if (forecastEl) forecastEl.innerHTML = `<div class="skeleton" style="height:100px;"></div><div class="skeleton" style="height:100px;"></div>`;
    if (fairWageEl) fairWageEl.innerHTML = `<div class="skeleton" style="height:120px;"></div>`;

    try {
        let forecastUrl = `/api/analytics/forecast?`;
        if (clusterId) forecastUrl += `cluster_id=${encodeURIComponent(clusterId)}&`;
        if (season) forecastUrl += `season=${encodeURIComponent(season)}&`;

        const [forecastRes, fairWageRes] = await Promise.all([
            fetch(forecastUrl),
            fetch("/api/analytics/fair-wage")
        ]);

        const forecastData = await forecastRes.json();
        const fwData = await fairWageRes.json();

        // 1. Cluster Mobilization Alert Banner (Surge Protection Alert)
        if (bannerEl) {
            if (forecastData.clusterMobilizationActive) {
                bannerEl.classList.remove("hidden");
                const clusterName = clusterSelect && clusterSelect.selectedIndex > 0
                    ? clusterSelect.options[clusterSelect.selectedIndex].text
                    : "Federation Clusters";
                bannerEl.innerHTML = `
                    <div class="banner-icon">⚡</div>
                    <div class="banner-body">
                        <div class="banner-title">COOPERATIVE DISPATCH MOBILIZATION ALERT • ${clusterName.toUpperCase()}</div>
                        <div class="banner-sub">
                            High booking velocity detected (${forecastData.summary.tradesInDeficit} trades under surge). 
                            Standby cooperative members mobilized with <strong>+₹50 overtime honorarium</strong> funded directly by federation welfare reserves.
                            <strong>100% Zero-Surge Guarantee: Citizens are never overcharged.</strong>
                        </div>
                    </div>
                `;
            } else {
                bannerEl.classList.add("hidden");
            }
        }

        // 2. Analytics KPI Ribbon
        if (kpiRibbon && fwData.success && fwData.summary) {
            const sum = fwData.summary;
            kpiRibbon.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-lbl">Living Wage Multiplier</div>
                    <div class="kpi-val">${sum.averageLivingWageMultiplier}x</div>
                    <div class="kpi-sub">Above Statutory Minimum Wage (Delhi)</div>
                </div>
                <div class="kpi-card highlight-gold">
                    <div class="kpi-lbl">Worker Commission Saved</div>
                    <div class="kpi-val">₹${Math.round(sum.cumulativeWorkerSurplus).toLocaleString()}</div>
                    <div class="kpi-sub">Retained vs Commercial Aggregators</div>
                </div>
                <div class="kpi-card highlight-teal">
                    <div class="kpi-lbl">Guaranteed Worker Share</div>
                    <div class="kpi-val">85%</div>
                    <div class="kpi-sub">15% Social Security • 0% Middleman Profit</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-lbl">Demand Forecast Season</div>
                    <div class="kpi-val">${forecastData.currentSeason || 'Monsoon'}</div>
                    <div class="kpi-sub">Diurnal Multiplier: ${forecastData.diurnalMultiplier || 1.0}x</div>
                </div>
            `;
        }

        // 3. Demand Forecast Chart
        if (forecastEl && forecastData.success && forecastData.forecast) {
            let chartHtml = `<div class="forecast-bars-list">`;
            forecastData.forecast.forEach(item => {
                const maxVal = Math.max(10, item.rolling7DayDemand, item.verifiedWorkers * 3);
                const demandPct = Math.min(100, Math.round((item.rolling7DayDemand / maxVal) * 100));
                const supplyPct = Math.min(100, Math.round(((item.verifiedWorkers * 3) / maxVal) * 100));

                let badgeClass = "badge-balanced";
                if (item.status === "DEFICIT_ALERT") badgeClass = "badge-deficit";
                else if (item.status === "TIGHT") badgeClass = "badge-tight";
                else if (item.status === "SURPLUS") badgeClass = "badge-surplus";

                chartHtml += `
                    <div class="forecast-trade-row">
                        <div class="forecast-trade-meta">
                            <div>
                                <strong class="trade-name">${item.trade}</strong>
                                <span class="badge ${badgeClass}">${item.statusBadge}</span>
                            </div>
                            <div class="trade-stats">
                                <span>7-Day Proj. Demand: <strong>${item.rolling7DayDemand} jobs</strong></span>
                                <span>Verified Capacity: <strong>${item.verifiedWorkers} workers</strong> (${item.liveAvailableWorkers} online)</span>
                                <span>Demand Ratio: <strong>${item.ratio}x</strong></span>
                            </div>
                        </div>

                        <div class="dual-bar-track">
                            <div class="bar-line demand-line" style="width:${demandPct}%;" title="Projected Demand: ${item.rolling7DayDemand}">
                                <span class="bar-label">Proj. Demand (${item.rolling7DayDemand})</span>
                            </div>
                            <div class="bar-line supply-line" style="width:${supplyPct}%;" title="Worker Capacity: ${item.verifiedWorkers}">
                                <span class="bar-label">Verified Supply (${item.verifiedWorkers})</span>
                            </div>
                        </div>

                        <div class="forecast-advisory">
                            💡 <strong>NCCT Advisory:</strong> ${item.recommendation}
                        </div>
                    </div>
                `;
            });
            chartHtml += `</div>`;
            forecastEl.innerHTML = chartHtml;
        }

        // 4. Fair Living Wage & Middleman Matrix
        if (fairWageEl && fwData.success && fwData.benchmarks) {
            let tableHtml = `
                <div class="table-responsive">
                    <table class="coop-table">
                        <thead>
                            <tr>
                                <th>Trade Service</th>
                                <th>Sahkaar 85% Take-Home</th>
                                <th>Commercial Net (68%)</th>
                                <th>Statutory Min Wage</th>
                                <th>Member Surplus (+₹)</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            fwData.benchmarks.forEach(bm => {
                tableHtml += `
                    <tr>
                        <td>
                            <strong>${bm.trade}</strong><br>
                            <small style="color:var(--muted);">${bm.skillCategory} • ${bm.avgDurationHours} hrs</small>
                        </td>
                        <td>
                            <strong style="color:var(--teal-deep); font-size:14.5px;">₹${bm.sahkaar.workerTakeHome}</strong><br>
                            <small style="color:var(--muted);">₹${bm.sahkaar.hourlyYield}/hr (85%)</small>
                        </td>
                        <td>
                            <span style="color:#C62828; text-decoration:line-through;">₹${bm.commercialAggregator.workerTakeHome}</span><br>
                            <small style="color:#D32F2F;">-28% app fee -₹${bm.commercialAggregator.bookingFeeDeduction}</small>
                        </td>
                        <td>
                            <span>₹${bm.statutoryBenchmark.statutoryJobEquivalent}</span><br>
                            <small style="color:var(--muted);">₹${bm.statutoryBenchmark.statutoryMinHourlyWage}/hr</small>
                        </td>
                        <td>
                            <span class="surplus-tag">+₹${bm.workerSurplusPerJob}</span><br>
                            <small style="color:#2E7D32; font-weight:700;">+${bm.premiumOverAggregatorPct}% more</small>
                        </td>
                    </tr>
                `;
            });

            tableHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            fairWageEl.innerHTML = tableHtml;
        }

        // Load NCCT upskilling programs
        loadNcctPrograms();

    } catch (err) {
        console.error("Failed to load forecast & analytics:", err);
        if (forecastEl) forecastEl.innerHTML = `<div class="error">Failed to calculate predictive demand analytics.</div>`;
    }
}

// Backward compatibility alias
function loadForecast() {
    loadAdminForecastAndAnalytics();
}

// NCCT Capacity Building Programs
async function loadNcctPrograms() {
    const grid = document.getElementById("ncctProgramsGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="skeleton" style="height:90px;"></div><div class="skeleton" style="height:90px;"></div>`;

    try {
        const res = await fetch("/api/analytics/upskilling");
        const data = await res.json();
        const programs = data.programs || [];

        if (programs.length === 0) {
            grid.innerHTML = `<div class="empty-state">No NCCT upskilling cohorts found.</div>`;
            return;
        }

        grid.innerHTML = programs.map(p => {
            const isRec = p.status === "Recommended";
            const isActive = p.status === "Active";
            const statusClass = isActive ? "verified" : (isRec ? "unverified" : "badge-tight");

            return `
                <div class="ncct-program-card">
                    <div class="program-header">
                        <div>
                            <span class="role-badge worker" style="font-size:11px;">${p.trade}</span>
                            <h4 style="margin:6px 0 3px; font-size:15px;">${p.title}</h4>
                            <small style="color:var(--muted);">📍 ${p.society_name} • ${p.cluster_zone}</small>
                        </div>
                        <span class="badge ${statusClass}">${p.status}</span>
                    </div>

                    <div class="program-meta-row">
                        <div><strong>Duration:</strong> ${p.duration_days} Days (NCCT)</div>
                        <div><strong>Projected Wage Uplift:</strong> <strong style="color:var(--teal-deep);">+${p.projected_wage_lift}%</strong></div>
                        <div><strong>Enrollment:</strong> ${p.enrolled_count} / ${p.target_capacity} Members</div>
                    </div>

                    <div class="program-action-row" style="margin-top:12px;">
                        ${isRec ? `
                            <button class="primary cta-gold btn-sm" onclick="publishUpskillingCohort(${p.id})">
                                📢 Publish & Mobilize NCCT Cohort
                            </button>
                        ` : `
                            <button class="secondary btn-sm" disabled style="opacity:0.8; cursor:default;">
                                ✓ Cohort Active in Cluster
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Failed to load NCCT programs:", err);
        grid.innerHTML = `<div class="error">Failed to load NCCT programs.</div>`;
    }
}

async function publishUpskillingCohort(programId) {
    try {
        const res = await adminFetch("/api/analytics/upskilling/publish", {
            method: "POST",
            body: JSON.stringify({ programId })
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            loadNcctPrograms();
        } else {
            alert(data.message || "Could not publish cohort.");
        }
    } catch (err) {
        console.error(err);
        alert("Server request failed.");
    }
}

// Cooperative Impact Audit Report Modal
async function openCooperativeAuditModal() {
    const modal = document.getElementById("cooperativeAuditModal");
    const content = document.getElementById("cooperativeAuditContent");
    if (!modal) return;
    modal.classList.remove("hidden");
    if (content) content.innerHTML = `<div class="skeleton" style="height:120px;"></div>`;

    try {
        const res = await fetch("/api/analytics/export");
        const data = await res.json();
        const audit = data.audit;

        if (content && audit) {
            content.innerHTML = `
                <div class="audit-doc-paper">
                    <div class="audit-doc-header">
                        <h2 style="margin:0; font-size:18px;">🏛️ ${audit.title}</h2>
                        <p class="audit-framework" style="margin:4px 0; color:var(--muted); font-size:12.5px;">${audit.statutoryFramework}</p>
                        <div class="audit-stamp">OFFICIAL COOPERATIVE FEDERATION AUDIT • ${audit.reportingPeriod}</div>
                    </div>

                    <div class="audit-section-block">
                        <h4 style="margin:12px 0 6px; font-size:14px; border-bottom:1px solid var(--line); padding-bottom:4px;">1. Cooperative Federation Governance Roster</h4>
                        <div class="audit-grid-2">
                            <div><strong>Registered Primary Societies:</strong> ${audit.cooperativeGovernance.registeredSocieties} Certified Entities</div>
                            <div><strong>Affiliated Worker Members:</strong> ${audit.cooperativeGovernance.affiliatedWorkers} Members</div>
                            <div><strong>NCCT Certified Tradespeople:</strong> ${audit.cooperativeGovernance.certifiedTradespeople} Verified</div>
                            <div><strong>Community Bookings Completed:</strong> ${audit.cooperativeGovernance.completedCommunityBookings} Jobs</div>
                            <div><strong>Emergency Rapid Dispatches:</strong> ${audit.cooperativeGovernance.emergencyRapidDispatches} High Priority</div>
                        </div>
                    </div>

                    <div class="audit-section-block">
                        <h4 style="margin:12px 0 6px; font-size:14px; border-bottom:1px solid var(--line); padding-bottom:4px;">2. Transparent Economic Value Distribution</h4>
                        <div class="audit-grid-2">
                            <div><strong>Gross Service Volume (GMV):</strong> ₹${audit.economicMetrics.grossMerchandiseValue.toLocaleString()}</div>
                            <div><strong>Direct Worker Payout (85%):</strong> <strong style="color:var(--teal-deep);">₹${audit.economicMetrics.directWorkerEarningsPaid.toLocaleString()}</strong></div>
                            <div><strong>Cooperative Welfare Reserves (15%):</strong> ₹${audit.economicMetrics.cooperativeWelfarePoolAccrued.toLocaleString()}</div>
                            <div><strong>Private Middleman Commissions:</strong> <span style="color:#2E7D32; font-weight:700;">${audit.economicMetrics.privateMiddlemanExtraction}</span></div>
                        </div>
                    </div>

                    <div class="audit-section-block">
                        <h4 style="margin:12px 0 6px; font-size:14px; border-bottom:1px solid var(--line); padding-bottom:4px;">3. Fair Living Wage & Citizen Protection Guarantee</h4>
                        <div class="audit-grid-2">
                            <div><strong>Cumulative Worker Surplus Saved:</strong> <strong style="color:#2E7D32;">₹${audit.fairWageAdvantage.cumulativeWorkerSurplusRetained.toLocaleString()}</strong></div>
                            <div><strong>Statutory Living Wage Multiplier:</strong> ${audit.fairWageAdvantage.statutoryLivingWageMultiplier}</div>
                            <div style="grid-column: 1 / -1;"><strong>Price Stability Policy:</strong> ${audit.fairWageAdvantage.zeroSurgePricingGuarantee}</div>
                        </div>
                    </div>

                    <div class="audit-seal-box" style="margin-top:16px; padding:12px; background:var(--paper); border:1px solid var(--line); border-radius:8px; display:flex; align-items:center; gap:12px;">
                        <div class="seal-icon" style="font-size:28px;">🤝</div>
                        <div style="font-size:12px; line-height:1.5;">
                            <strong>${audit.complianceCertification}</strong><br>
                            <span style="color:var(--muted);">Generated: ${new Date(audit.auditTimestamp).toLocaleString()} • Hash Verification: SHA256-NCCT-GOV-2026</span>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error(err);
        if (content) content.innerHTML = `<div class="error">Failed to generate cooperative audit report.</div>`;
    }
}

function closeCooperativeAuditModal() {
    const modal = document.getElementById("cooperativeAuditModal");
    if (modal) modal.classList.add("hidden");
}

function printCooperativeAuditStatement() {
    window.print();
}



// =====================================
// PHASE 11: EMERGENCY SOS & RAPID DISPATCH
// =====================================

function openEmergencySOSModal() {
    const modal = document.getElementById("sosEmergencyModal");
    if (!modal) return;
    modal.classList.remove("hidden");

    // Auto-fill from localStorage customer profile
    const savedPhone = localStorage.getItem("sahkaar_customer_phone");
    const savedAddr = localStorage.getItem("sahkaar_customer_address");
    const savedLat = localStorage.getItem("sahkaar_customer_lat");
    const savedLng = localStorage.getItem("sahkaar_customer_lng");

    const phoneInput = document.getElementById("sosPhone");
    const addrInput = document.getElementById("sosAddress");
    const latInput = document.getElementById("sosLat");
    const lngInput = document.getElementById("sosLng");
    const locStatus = document.getElementById("sosLocStatus");
    const resultBox = document.getElementById("sosResult");

    if (phoneInput && savedPhone && !phoneInput.value) phoneInput.value = savedPhone;
    if (addrInput && savedAddr && !addrInput.value) addrInput.value = savedAddr;
    if (latInput && savedLat) latInput.value = savedLat;
    if (lngInput && savedLng) lngInput.value = savedLng;

    if (savedLat && savedLng && locStatus) {
        locStatus.innerHTML = `<small style="color:var(--teal); font-weight:700;">✓ GPS Locked: ${Number(savedLat).toFixed(4)}, ${Number(savedLng).toFixed(4)}</small>`;
    } else if (locStatus) {
        locStatus.innerHTML = "";
    }

    if (resultBox) resultBox.innerHTML = "";
}

function closeEmergencySOSModal() {
    const modal = document.getElementById("sosEmergencyModal");
    if (modal) modal.classList.add("hidden");
}

function selectSOSScenario(btn) {
    const grid = btn.parentElement;
    if (grid) {
        grid.querySelectorAll(".sos-scenario-card").forEach(c => c.classList.remove("active"));
    }
    btn.classList.add("active");

    const service = btn.getAttribute("data-service");
    const eType = btn.getAttribute("data-type");
    const basePrice = Number(btn.getAttribute("data-price")) || 249;

    const servInput = document.getElementById("sosService");
    const typeInput = document.getElementById("sosEmergencyType");
    const baseEl = document.getElementById("sosBasePrice");
    const totalEl = document.getElementById("sosTotalPrice");

    if (servInput) servInput.value = service;
    if (typeInput) typeInput.value = eType;
    if (baseEl) baseEl.textContent = `₹${basePrice}`;
    if (totalEl) totalEl.textContent = `₹${basePrice + 50}`;
}

function syncSOSLocation() {
    const statusEl = document.getElementById("sosLocStatus");
    if (!navigator.geolocation) {
        if (statusEl) statusEl.innerHTML = `<small style="color:var(--terracotta);">Geolocation not supported.</small>`;
        return;
    }
    if (statusEl) statusEl.innerHTML = `<small style="color:var(--gold-deep);">📍 Acquiring high-accuracy GPS coordinates...</small>`;

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const latInput = document.getElementById("sosLat");
            const lngInput = document.getElementById("sosLng");
            if (latInput) latInput.value = lat;
            if (lngInput) lngInput.value = lng;
            localStorage.setItem("sahkaar_customer_lat", lat);
            localStorage.setItem("sahkaar_customer_lng", lng);
            if (statusEl) {
                statusEl.innerHTML = `<small style="color:var(--teal); font-weight:700;">✓ High-Accuracy GPS Locked: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>`;
            }
        },
        err => {
            if (statusEl) {
                statusEl.innerHTML = `<small style="color:var(--terracotta);">GPS access denied. Manual address will be used.</small>`;
            }
        },
        { timeout: 8000, enableHighAccuracy: true }
    );
}

async function submitRapidEmergencyBooking() {
    const service = document.getElementById("sosService").value;
    const emergencyType = document.getElementById("sosEmergencyType").value;
    const phone = document.getElementById("sosPhone").value.trim();
    const address = document.getElementById("sosAddress").value.trim();
    const lat = document.getElementById("sosLat").value || null;
    const lng = document.getElementById("sosLng").value || null;
    const name = localStorage.getItem("sahkaar_customer_name") || "Emergency Citizen";
    const btn = document.getElementById("sosSubmitBtn");
    const result = document.getElementById("sosResult");

    if (!phone || !address) {
        if (result) result.innerHTML = `<div class="error">Phone number and service address are required for rapid dispatch.</div>`;
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = "🚨 Mobilizing Nearest Cooperative Worker...";
    }
    if (result) result.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;

    try {
        const res = await fetch("/api/emergency/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service,
                emergencyType,
                customerName: name,
                customerPhone: phone,
                address,
                customerLat: lat,
                customerLng: lng,
                targetResponseMins: 30
            })
        });
        const data = await res.json();

        if (data.success) {
            const b = data.booking;
            const w = data.nearest_worker;
            const workerInfo = w ? `
                <div class="emergency-worker-preview">
                    <strong>📍 Nearest Available Member:</strong> ${w.name} (${w.skill})<br>
                    <span>Proximity: ~${w.distance_km != null ? w.distance_km + ' km' : 'Local Ward'} • Estimated Arrival: ${w.estimated_eta_mins} mins</span>
                </div>
            ` : `<div style="margin-top:6px; font-size:12px; color:var(--muted);">Priority broadcast transmitted to ${data.candidate_count || 'all'} local cooperative tradespeople.</div>`;

            if (result) {
                result.innerHTML = `
                    <div class="success" style="padding:14px; text-align:left;">
                        <strong>🚨 Emergency Call Confirmed! (Booking #${b.id})</strong><br>
                        <span style="font-size:13px;">Crisis: ${b.emergency_type}</span><br>
                        ${workerInfo}
                        <div style="margin-top:8px; font-size:12px; color:var(--teal-deep); font-weight:700;">
                            💰 Total Fee: ₹${data.pricing ? data.pricing.total_amount : '299'} (Fair Wage + ₹50 Rapid Surcharge, Zero Surge Pricing)
                        </div>
                        <div style="margin-top:10px;">
                            <button class="primary" style="font-size:12px; padding:6px 14px;" onclick="closeEmergencySOSModal(); showMyBookings();">
                                📋 Track in My Bookings →
                            </button>
                        </div>
                    </div>
                `;
            }

            if (typeof speak === "function") {
                speak(`Emergency dispatch activated for ${service}. Priority broadcast sent to local cooperative partners.`);
            }

            if (btn) {
                btn.disabled = false;
                btn.textContent = "✓ Emergency Dispatched";
            }
        } else {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "🚨 ACTIVATE EMERGENCY DISPATCH NOW";
            }
            if (result) result.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (err) {
        console.error("Emergency booking failed:", err);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "🚨 ACTIVATE EMERGENCY DISPATCH NOW";
        }
        if (result) result.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

// 5. Admin Emergency SLA Monitor
async function loadAdminEmergencyQueue() {
    const el = document.getElementById("adminEmergencyQueue");
    if (!el) return;
    el.innerHTML = `<div class="skeleton" style="height:70px;"></div><div class="skeleton" style="height:70px;"></div>`;

    try {
        const res = await fetch("/api/emergency/queue");
        const data = await res.json();

        if (!data.success || data.queue.length === 0) {
            el.innerHTML = `
                <div class="empty-state" style="background:#E4EEE9; border:1px solid var(--teal); color:var(--teal-deep);">
                    <span class="icon">🛡️</span>
                    All clear! No active household emergency calls pending dispatch right now.
                </div>
            `;
            return;
        }

        // Get list of verified workers for emergency override selector
        let verifiedWorkers = [];
        try {
            const wRes = await adminFetch("/api/admin/workers");
            const wData = await wRes.json();
            if (wData.success) verifiedWorkers = wData.workers || [];
        } catch (e) {}

        let html = `
            <div class="emergency-admin-summary-strip">
                <div class="stat-pill ${data.critical_count > 0 ? 'critical' : ''}">
                    🚨 Active Emergency Calls: <strong>${data.count}</strong>
                </div>
                <div class="stat-pill ${data.critical_count > 0 ? 'critical' : ''}">
                    ⚠️ Critical SLA Breaches: <strong>${data.critical_count}</strong>
                </div>
            </div>
            <div class="emergency-admin-list">
        `;

        data.queue.forEach(item => {
            const isBreached = item.sla_breached;
            const slaTag = isBreached
                ? `<span class="badge emergency" style="font-weight:800;">🚨 SLA BREACHED (${item.elapsed_minutes}m elapsed)</span>`
                : `<span class="badge" style="background:#FFF3E0; color:#E65100; border:1px solid #FFE0B2; font-weight:700;">⏱️ ${item.elapsed_minutes}m elapsed / ${item.target_response_mins || 30}m SLA</span>`;

            const statusTag = item.status === "Pending"
                ? `<span class="badge" style="background:#FFF4E5; color:#8C5300; border:1px solid #FFE0B2;">⏳ Unassigned Standby</span>`
                : item.status === "Assigned"
                ? `<span class="badge" style="background:#E3F2FD; color:#0D47A1; border:1px solid #BBDEFB;">👷 Assigned (${item.worker_name})</span>`
                : `<span class="badge" style="background:#EDE7F6; color:#4A148C; border:1px solid #D1C4E9;">⚡ In Progress</span>`;

            // Candidate workers matching trade
            const matchingWorkers = verifiedWorkers.filter(w => w.skill === item.service);
            const assignOptions = matchingWorkers.map(w =>
                `<option value="${w.id}">${w.name} (📞 ${w.phone} • ${w.is_available ? 'Available' : 'Busy'})</option>`
            ).join("");

            html += `
                <div class="emergency-queue-card ${isBreached ? 'sla-breach' : ''}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                        <div>
                            <strong style="font-size:16px; color:var(--terracotta);">🚨 ${item.service} — #${item.id}</strong>
                            <div style="font-size:13px; font-weight:700; color:var(--ink);">${item.emergency_type || 'Urgent Crisis'}</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            ${slaTag}
                            ${statusTag}
                        </div>
                    </div>

                    <div style="font-size:13px; line-height:1.6; margin-bottom:10px;">
                        <strong>Customer:</strong> ${item.customer_name} (📞 <a href="tel:${item.customer_phone}">${item.customer_phone}</a>)<br>
                        <strong>Address:</strong> ${item.address}
                        ${item.customer_lat ? `<br><small style="color:var(--muted);">GPS: ${item.customer_lat.toFixed(4)}, ${item.customer_lng.toFixed(4)}</small>` : ''}
                    </div>

                    ${item.worker_name ? `
                        <div style="background:#F5F7F1; padding:8px 12px; border-radius:6px; font-size:12.5px; margin-bottom:8px;">
                            👷 <strong>Assigned Partner:</strong> ${item.worker_name} (📞 ${item.worker_phone} • ${item.worker_skill})
                        </div>
                    ` : `
                        <div class="standby-assign-row">
                            <label style="font-size:12px; font-weight:700; margin-right:6px;">Force Standby Reassignment:</label>
                            <select id="emergencyWorkerSelect-${item.id}" style="font-size:12px; padding:4px 8px; border-radius:6px; border:1px solid var(--line);">
                                <option value="">Select Verified ${item.service}...</option>
                                ${assignOptions}
                            </select>
                            <button class="primary" style="font-size:11.5px; padding:6px 12px;" onclick="reassignEmergencyJob(${item.id})">
                                ⚡ Assign Standby
                            </button>
                        </div>
                    `}
                </div>
            `;
        });

        html += `</div>`;
        el.innerHTML = html;
    } catch (err) {
        console.error("Failed to load emergency queue:", err);
        el.innerHTML = `<div class="error">Failed to load emergency queue.</div>`;
    }
}

async function reassignEmergencyJob(bookingId) {
    const select = document.getElementById(`emergencyWorkerSelect-${bookingId}`);
    if (!select || !select.value) {
        alert("Please select a verified worker to assign.");
        return;
    }

    const workerId = Number(select.value);
    try {
        const res = await adminFetch(`/api/emergency/${bookingId}/reassign`, {
            method: "POST",
            body: JSON.stringify({ workerId })
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            loadAdminEmergencyQueue();
            loadAdminBookings();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Server connection failed.");
    }
}

// =====================================
// COOPERATIVE SOCIETIES & PACS (PHASE 14)
// =====================================

async function loadAdminSocieties() {
    const summaryEl = document.getElementById("adminSocietiesSummary");
    const listEl = document.getElementById("adminSocietiesList");
    if (!listEl) return;

    listEl.innerHTML = `<div class="skeleton" style="height:110px;"></div><div class="skeleton" style="height:110px;"></div>`;

    try {
        const res = await adminFetch("/api/societies");
        const data = await res.json();
        const societies = data.societies || [];
        const summary = data.summary || {};

        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="stat-pill"><strong>${summary.totalSocieties || 0}</strong> Registered Societies</div>
                <div class="stat-pill"><strong>${summary.totalActiveClusters || 0}</strong> Active Clusters</div>
                <div class="stat-pill"><strong>${summary.totalAffiliatedWorkers || 0}</strong> Affiliated Tradespeople</div>
                <div class="stat-pill critical" style="background:#E0F2F1; color:#004D40; border-color:#80CBC4;">
                    <strong>₹${summary.federationWelfareReserve || 0}</strong> Accumulated Welfare Reserves
                </div>
            `;
        }

        if (societies.length === 0) {
            listEl.innerHTML = `<div class="empty-state">No cooperative societies registered yet.</div>`;
            return;
        }

        listEl.innerHTML = societies.map(s => `
            <div class="society-card">
                <div class="society-card-header">
                    <div>
                        <span class="society-reg-badge">${s.reg_number}</span>
                        <h4 class="society-title">${s.name}</h4>
                    </div>
                    <span class="badge ${s.status === 'Active' ? 'verified' : 'unverified'}">${s.status}</span>
                </div>

                <div class="society-meta-grid">
                    <div class="society-meta-item">
                        <span class="meta-label">Cluster Jurisdiction:</span>
                        <span class="meta-val">📍 ${s.cluster_zone} (PIN: ${s.pincode})</span>
                    </div>
                    <div class="society-meta-item">
                        <span class="meta-label">Secretary / Lead Contact:</span>
                        <span class="meta-val">👤 ${s.contact_person || 'Federation Lead'} (📞 ${s.contact_phone || 'N/A'})</span>
                    </div>
                </div>

                <div class="society-metrics-row">
                    <div class="society-metric-chip">
                        <span class="metric-num">${s.total_workers}</span>
                        <span class="metric-lbl">Total Workers</span>
                    </div>
                    <div class="society-metric-chip">
                        <span class="metric-num">${s.verified_workers}</span>
                        <span class="metric-lbl">NCCT Verified</span>
                    </div>
                    <div class="society-metric-chip">
                        <span class="metric-num">${s.completed_bookings}</span>
                        <span class="metric-lbl">Completed Jobs</span>
                    </div>
                    <div class="society-metric-chip highlight">
                        <span class="metric-num">₹${s.welfare_fund_pool}</span>
                        <span class="metric-lbl">Welfare Pool (15%)</span>
                    </div>
                </div>
            </div>
        `).join("");

    } catch (err) {
        console.error("Failed to load societies:", err);
        listEl.innerHTML = `<div class="error">Failed to load cooperative societies.</div>`;
    }
}

function openNewSocietyModal() {
    const modal = document.getElementById("newSocietyModal");
    if (modal) modal.classList.remove("hidden");
}

function closeNewSocietyModal() {
    const modal = document.getElementById("newSocietyModal");
    if (modal) modal.classList.add("hidden");
}

async function submitNewSociety(event) {
    if (event) event.preventDefault();
    const name = document.getElementById("newSocietyName").value.trim();
    const reg_number = document.getElementById("newSocietyReg").value.trim();
    const cluster_zone = document.getElementById("newSocietyCluster").value.trim();
    const pincode = document.getElementById("newSocietyPincode").value.trim();
    const contact_person = document.getElementById("newSocietyContact").value.trim();
    const contact_phone = document.getElementById("newSocietyPhone").value.trim();
    const resultEl = document.getElementById("newSocietyResult");

    if (!name || !reg_number || !cluster_zone || !pincode) {
        if (resultEl) resultEl.innerHTML = `<div class="error">Please fill all required fields.</div>`;
        return;
    }

    try {
        const res = await adminFetch("/api/societies", {
            method: "POST",
            body: JSON.stringify({
                name,
                reg_number,
                cluster_zone,
                pincode,
                contact_person,
                contact_phone
            })
        });

        const data = await res.json();
        if (res.ok && data.society) {
            if (resultEl) resultEl.innerHTML = `<div class="success" style="color:#2E7D32; font-weight:700;">Cooperative Society registered successfully!</div>`;
            document.getElementById("newSocietyForm").reset();
            setTimeout(() => {
                closeNewSocietyModal();
                loadAdminSocieties();
                if (resultEl) resultEl.innerHTML = "";
            }, 900);
        } else {
            if (resultEl) resultEl.innerHTML = `<div class="error">${data.error || "Registration failed"}</div>`;
        }
    } catch (err) {
        console.error(err);
        if (resultEl) resultEl.innerHTML = `<div class="error">Server request failed.</div>`;
    }
}
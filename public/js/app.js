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
                    html += `
                        <div class="invoice-box">
                            <strong>Official Cooperative Invoice</strong><br>
                            Service charge: ₹${invData.invoice.service_charge}<br>
                            Cooperative welfare share: ₹${invData.invoice.cooperative_share}<br>
                            Worker direct earning: ₹${invData.invoice.worker_earning}<br>
                            <strong>Total: ₹${invData.invoice.total_amount}</strong>
                        </div>
                        <button class="cta-gold" onclick="payMock(${booking.id}, this)">💳 Pay Now (Mock)</button>
                    `;
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

async function payMock(bookingId, btn) {
    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
        const res = await fetch("/api/payments/mock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId })
        });
        const data = await res.json();

        if (data.success) {
            btn.textContent = "✅ Paid (Mock)";
        } else {
            btn.textContent = "💳 Pay Now (Mock)";
            btn.disabled = false;
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        btn.textContent = "💳 Pay Now (Mock)";
        btn.disabled = false;
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

        // Available Jobs
        const jobsRes = await fetch(`/api/bookings?service=${encodeURIComponent(worker.skill)}&status=Pending`);
        const jobsData = await jobsRes.json();
        const unpassedJobs = (jobsData.bookings || []).filter(b => !window.dismissedJobIds.has(b.id));

        html += `<h3 style="margin:22px 0 12px;">Incoming Available Jobs (${unpassedJobs.length})</h3>`;

        if (!isAvail) {
            html += `<div class="busy-alert-banner">⏸️ You are currently marked as <strong>BUSY / ON LEAVE</strong>. Switch your status above to <strong>AVAILABLE</strong> to accept new jobs.</div>`;
        }

        if (unpassedJobs.length === 0) {
            html += `<div class="empty-state"><span class="icon">📭</span>No pending jobs right now for ${worker.skill}.</div>`;
        } else {
            unpassedJobs.forEach(booking => {
                const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 EMERGENCY PRIORITY DISPATCH</span><br>` : "";
                html += `
                    <div class="booking-item" id="avail-job-${booking.id}">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                            <div>${emergencyTag}<strong style="font-size:15px;">${booking.service}</strong></div>
                            <span class="badge" style="background:#FFF4E5; color:#8C5300; border:1px solid #FFE0B2;">Open Dispatch</span>
                        </div>
                        <strong>Booking ID:</strong> #${booking.id}<br>
                        <strong>Customer:</strong> ${booking.customer_name}<br>
                        <strong>Address:</strong> ${booking.address}<br>
                        <strong>Date & Time:</strong> ${booking.booking_date} ${booking.booking_time}<br>
                        <div class="job-actions-row" style="margin-top:12px; display:flex; gap:10px;">
                            <button class="primary" ${!isAvail ? "disabled style='opacity:0.5; cursor:not-allowed;'" : ""} onclick="acceptJob(${booking.id}, ${worker.id})">Accept Job</button>
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
    const tabs = ["overview", "workers", "bookings", "forecast"];
    tabs.forEach(t => {
        const btn = document.getElementById(`adminTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const content = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (btn) btn.classList.toggle("active", t === tabName);
        if (content) content.classList.toggle("hidden", t !== tabName);
    });
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

// 5. NCCT Demand Forecast
async function loadForecast() {
    const el = document.getElementById("adminForecast");
    if (!el) return;
    el.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;
    try {
        const res = await fetch("/api/forecast");
        const data = await res.json();

        if (data.forecast.length === 0) {
            el.innerHTML = `<div class="empty-state"><span class="icon">📊</span>Not enough booking data yet to forecast.</div>`;
            return;
        }

        let html = `
            <div class="forecast-banner">
                💡 ${data.note}
            </div>
            <div class="forecast-grid">
        `;

        data.forecast.forEach(row => {
            html += `
                <div class="booking-item forecast-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="font-size:16px;">${row.service}</strong>
                        <span class="badge" style="background:var(--paper); border:1px solid var(--line);">
                            ${row.bookingCount} Bookings • ${row.verifiedWorkers} Verified Workers
                        </span>
                    </div>
                    <div class="forecast-rec-box">
                        <strong>NCCT Recommendation:</strong> ${row.recommendation}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        el.innerHTML = html;
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load demand forecast.</div>`;
    }
}
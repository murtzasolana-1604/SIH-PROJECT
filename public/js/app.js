// =====================================
// SAHKAAR CONNECT - FRONTEND
// =====================================

const SEAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;

function hideAllSections() {
    document.getElementById("servicesSection").classList.add("hidden");
    document.getElementById("bookingSection").classList.add("hidden");
    document.getElementById("workerSection").classList.add("hidden");
    document.getElementById("myBookingsSection").classList.add("hidden");
    document.getElementById("workerDashboardSection").classList.add("hidden");
    document.getElementById("adminSection").classList.add("hidden");
}

async function showServices() {
    hideAllSections();
    document.getElementById("servicesSection").classList.remove("hidden");
    await loadServices();
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
                <div class="service-icon">${service.icon}</div>
                <h3>${service.name}</h3>
                <p>${service.category}</p>
            `;
            card.onclick = function () { openBooking(service.name); };
            servicesList.appendChild(card);
        });
    } catch (error) {
        servicesList.innerHTML = `<div class="error">Unable to load services.</div>`;
        console.error(error);
    }
}

function captureLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        position => {
            document.getElementById("customerLat").value = position.coords.latitude;
            document.getElementById("customerLng").value = position.coords.longitude;
        },
        () => { /* denied or unavailable — booking still works without it */ }
    );
}

function openBooking(serviceName) {
    hideAllSections();
    document.getElementById("bookingSection").classList.remove("hidden");
    document.getElementById("selectedService").value = serviceName;
    captureLocation();
}

function showWorkerForm() {
    hideAllSections();
    document.getElementById("workerSection").classList.remove("hidden");
}

function showMyBookings() {
    hideAllSections();
    document.getElementById("myBookingsSection").classList.remove("hidden");
}

function showWorkerDashboard() {
    hideAllSections();
    document.getElementById("workerDashboardSection").classList.remove("hidden");
}

function showAdmin() {
    hideAllSections();
    document.getElementById("adminSection").classList.remove("hidden");
    loadAdminStats();
    loadAdminWorkers();
    loadAdminBookings();
    loadForecast();
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

            const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 Emergency</span><br>` : "";

            let html = `
                ${emergencyTag}
                <strong>Booking ID:</strong> ${booking.id}<br>
                <strong>Service:</strong> ${booking.service}<br>
                <strong>Date:</strong> ${booking.booking_date}<br>
                <strong>Time:</strong> ${booking.booking_time}<br>
                <strong>Status:</strong> ${booking.status}
            `;

            if (booking.status === "Completed") {

                const invRes = await fetch(`/api/invoices?bookingId=${booking.id}`);
                const invData = await invRes.json();

                if (invData.success) {
                    html += `
                        <div class="invoice-box">
                            <strong>Invoice</strong><br>
                            Service charge: ₹${invData.invoice.service_charge}<br>
                            Cooperative share: ₹${invData.invoice.cooperative_share}<br>
                            Worker earning: ₹${invData.invoice.worker_earning}<br>
                            <strong>Total: ₹${invData.invoice.total_amount}</strong>
                        </div>
                        <button class="cta-gold" onclick="payMock(${booking.id}, this)">💳 Pay Now (Mock)</button>
                        <div class="rate-box">
                            <label style="margin:0;">Rate:</label>
                            <select id="stars-${booking.id}">
                                <option value="5">⭐⭐⭐⭐⭐</option>
                                <option value="4">⭐⭐⭐⭐</option>
                                <option value="3">⭐⭐⭐</option>
                                <option value="2">⭐⭐</option>
                                <option value="1">⭐</option>
                            </select>
                            <input type="text" id="comment-${booking.id}" placeholder="Optional comment">
                            <button class="secondary" onclick="submitRating(${booking.id})">Submit</button>
                        </div>
                        <div id="ratingMsg-${booking.id}"></div>
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

async function submitRating(bookingId) {
    const stars = document.getElementById(`stars-${bookingId}`).value;
    const comment = document.getElementById(`comment-${bookingId}`).value;
    const msg = document.getElementById(`ratingMsg-${bookingId}`);

    try {
        const res = await fetch("/api/ratings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, stars: Number(stars), comment })
        });
        const data = await res.json();
        msg.innerHTML = data.success
            ? `<div class="success"><div>${data.message}</div></div>`
            : `<div class="error">${data.message}</div>`;
    } catch (error) {
        console.error(error);
        msg.innerHTML = `<div class="error">Server connection failed.</div>`;
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

        const verifiedBadge = worker.verified
            ? `<span class="badge verified">${SEAL_ICON}Verified</span>`
            : `<span class="badge unverified">Not verified yet</span>`;

        const ratingText = ratingData.average
            ? `⭐ ${ratingData.average} (${ratingData.count} ratings)`
            : "No ratings yet";

        let html = `
            <div class="worker-profile">
                <strong>${worker.name}</strong> ${verifiedBadge}<br>
                Skill: ${worker.skill}<br>
                Location: ${worker.location}<br>
                Availability: ${worker.availability}<br>
                Rating: ${ratingText}
            </div>
        `;

        const activeRes = await fetch(`/api/bookings?assignedWorkerId=${worker.id}&status=Assigned`);
        const activeData = await activeRes.json();

        html += `<h3 style="margin-bottom:12px;">My Active Jobs</h3>`;

        if (!activeData.success || activeData.bookings.length === 0) {
            html += `<div class="empty-state"><span class="icon">🗓️</span>No active jobs right now.</div>`;
        } else {
            activeData.bookings.forEach(booking => {
                const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 Emergency</span><br>` : "";
                html += `
                    <div class="booking-item">
                        ${emergencyTag}
                        <strong>Booking ID:</strong> ${booking.id}<br>
                        <strong>Customer:</strong> ${booking.customer_name}<br>
                        <strong>Address:</strong> ${booking.address}<br>
                        <strong>Date:</strong> ${booking.booking_date} ${booking.booking_time}<br>
                        <button class="secondary" onclick="markComplete(${booking.id})">✅ Mark Complete</button>
                    </div>
                `;
            });
        }

        const jobsRes = await fetch(`/api/bookings?service=${encodeURIComponent(worker.skill)}&status=Pending`);
        const jobsData = await jobsRes.json();

        html += `<h3 style="margin:20px 0 12px;">Available Jobs</h3>`;

        if (!jobsData.success || jobsData.bookings.length === 0) {
            html += `<div class="empty-state"><span class="icon">📭</span>No pending jobs right now for ${worker.skill}.</div>`;
        } else {
            jobsData.bookings.forEach(booking => {
                const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 Emergency</span><br>` : "";
                html += `
                    <div class="booking-item">
                        ${emergencyTag}
                        <strong>Booking ID:</strong> ${booking.id}<br>
                        <strong>Customer:</strong> ${booking.customer_name}<br>
                        <strong>Address:</strong> ${booking.address}<br>
                        <strong>Date:</strong> ${booking.booking_date} ${booking.booking_time}<br>
                        <button class="primary" onclick="acceptJob(${booking.id}, ${worker.id})">Accept Job</button>
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
// FEDERATION ADMIN DASHBOARD
// =====================================

async function loadAdminStats() {
    const el = document.getElementById("adminStats");
    el.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
    try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        const s = data.stats;

        el.innerHTML = `
            <div class="stat-card"><div class="lbl">Total Workers</div><strong>${s.totalWorkers}</strong></div>
            <div class="stat-card"><div class="lbl">Verified Workers</div><strong>${s.verifiedWorkers}</strong></div>
            <div class="stat-card"><div class="lbl">Customers</div><strong>${s.totalCustomers}</strong></div>
            <div class="stat-card"><div class="lbl">Total Bookings</div><strong>${s.totalBookings}</strong></div>
            <div class="stat-card"><div class="lbl">Pending</div><strong>${s.pendingBookings}</strong></div>
            <div class="stat-card"><div class="lbl">Completed</div><strong>${s.completedBookings}</strong></div>
        `;
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load stats.</div>`;
    }
}

async function loadAdminWorkers() {
    const el = document.getElementById("adminWorkers");
    el.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;
    try {
        const res = await fetch("/api/admin/workers");
        const data = await res.json();

        if (data.workers.length === 0) {
            el.innerHTML = `<div class="empty-state"><span class="icon">👷</span>No workers registered yet.</div>`;
            return;
        }

        el.innerHTML = "";

        data.workers.forEach(worker => {
            const div = document.createElement("div");
            div.className = "booking-item";

            const badge = worker.verified
                ? `<span class="badge verified">${SEAL_ICON}Verified</span>`
                : `<span class="badge unverified">Pending review</span>`;

            div.innerHTML = `
                <strong>${worker.name}</strong> ${badge}<br>
                Skill: ${worker.skill} · Location: ${worker.location} · Phone: ${worker.phone}
                ${worker.verified ? "" : `
                    <div style="margin-top:8px;">
                        <button class="primary" onclick="verifyWorker(${worker.id}, 'approve')">Approve</button>
                        <button class="secondary" onclick="verifyWorker(${worker.id}, 'reject')">Reject</button>
                    </div>
                `}
            `;
            el.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load workers.</div>`;
    }
}

async function verifyWorker(workerId, action) {
    try {
        const res = await fetch("/api/admin/verify", {
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
        alert("Server connection failed.");
    }
}

async function loadAdminBookings() {
    const el = document.getElementById("adminBookings");
    el.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;
    try {
        const res = await fetch("/api/bookings?status=Pending");
        const data = await res.json();

        if (data.bookings.length === 0) {
            el.innerHTML = `<div class="empty-state"><span class="icon">✅</span>No pending bookings.</div>`;
            return;
        }

        el.innerHTML = "";

        data.bookings.forEach(booking => {
            const div = document.createElement("div");
            div.className = "booking-item";
            const emergencyTag = booking.is_emergency ? `<span class="badge emergency">🚨 Emergency</span><br>` : "";

            div.innerHTML = `
                ${emergencyTag}
                <strong>Booking ID:</strong> ${booking.id} — ${booking.service}<br>
                Customer: ${booking.customer_name} · ${booking.address}<br>
                <button class="secondary" onclick="suggestWorkers(${booking.id})">🔍 Suggest Workers</button>
                <div id="matches-${booking.id}"></div>
            `;
            el.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load bookings.</div>`;
    }
}

async function suggestWorkers(bookingId) {
    const el = document.getElementById(`matches-${bookingId}`);
    el.innerHTML = `<div class="skeleton" style="height:36px;margin-top:8px;"></div>`;

    try {
        const res = await fetch(`/api/admin/match/${bookingId}`);
        const data = await res.json();

        if (!data.matches || data.matches.length === 0) {
            el.innerHTML = `<div class="empty-state"><span class="icon">🤷</span>No workers registered for this skill yet.</div>`;
            return;
        }

        el.innerHTML = `<p style="font-size:11.5px;color:var(--muted);font-family:var(--font-mono);margin-top:8px;">${data.note}</p>`;

        data.matches.forEach(worker => {
            const div = document.createElement("div");
            div.style.marginTop = "6px";
            div.innerHTML = `
                ${worker.name} — score ${worker.matchScore} (${worker.reasons.join(", ")})
                <button class="primary" onclick="assignWorker(${bookingId}, ${worker.id})">Assign</button>
            `;
            el.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load matches.</div>`;
    }
}

async function assignWorker(bookingId, workerId) {
    try {
        const res = await fetch("/api/admin/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, workerId })
        });
        const data = await res.json();
        alert(data.message);
        loadAdminBookings();
    } catch (error) {
        console.error(error);
        alert("Server connection failed.");
    }
}

async function loadForecast() {
    const el = document.getElementById("adminForecast");
    el.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;
    try {
        const res = await fetch("/api/forecast");
        const data = await res.json();

        if (data.forecast.length === 0) {
            el.innerHTML = `<div class="empty-state"><span class="icon">📊</span>Not enough booking data yet to forecast.</div>`;
            return;
        }

        el.innerHTML = `<p style="font-size:11.5px;color:var(--muted);font-family:var(--font-mono);margin-bottom:8px;">${data.note}</p>`;

        data.forecast.forEach(row => {
            const div = document.createElement("div");
            div.className = "booking-item";
            div.innerHTML = `
                <strong>${row.service}</strong><br>
                Bookings so far: ${row.bookingCount} · Verified workers: ${row.verifiedWorkers}<br>
                ${row.recommendation}
            `;
            el.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        el.innerHTML = `<div class="error">Could not load forecast.</div>`;
    }
}
// =====================================
// AUTHENTICATION — Backend Token-Based
// Customer and Worker OTP verification connected to /api/auth/*
// =====================================

// ---------- CUSTOMER ----------

async function customerSendOtp() {
    const phoneInput = document.getElementById("customerLoginPhone");
    const phone = phoneInput.value.trim();
    const errorEl = document.getElementById("customerPhoneError");

    errorEl.innerHTML = "";

    if (!/^[0-9]{10}$/.test(phone)) {
        errorEl.innerHTML = `<div class="error">Enter a valid 10-digit mobile number.</div>`;
        return;
    }

    try {
        const res = await fetch("/api/auth/customer/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();

        if (!data.success) {
            errorEl.innerHTML = `<div class="error">${data.message}</div>`;
            return;
        }

        localStorage.setItem("sahkaar_customer_pending_phone", phone);
        document.getElementById("customerOtpPhoneDisplay").textContent = phone;

        document.getElementById("customerPhoneStep").classList.add("hidden");
        document.getElementById("customerOtpStep").classList.remove("hidden");
        document.getElementById("customerOtpInput").value = "";
        document.getElementById("customerOtpInput").focus();
    } catch (error) {
        console.error(error);
        errorEl.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

async function customerVerifyOtp() {
    const otp = document.getElementById("customerOtpInput").value.trim();
    const errorEl = document.getElementById("customerOtpError");
    const phone = localStorage.getItem("sahkaar_customer_pending_phone");

    errorEl.innerHTML = "";

    if (!otp) {
        errorEl.innerHTML = `<div class="error">Please enter the 6-digit OTP.</div>`;
        return;
    }

    try {
        const res = await fetch("/api/auth/customer/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();

        if (!data.success) {
            errorEl.innerHTML = `<div class="error">${data.message}</div>`;
            return;
        }

        // Store session token and credentials
        localStorage.setItem("sahkaar_customer_token", data.token);
        localStorage.setItem("sahkaar_customer_phone", phone);
        localStorage.setItem("sahkaar_customer_authed", "true");
        localStorage.setItem("sahkaar_customer_is_new", data.isNew ? "true" : "false");

        if (data.customer && data.customer.name) {
            localStorage.setItem("sahkaar_customer_name", data.customer.name);
        }

        if (data.isNew && typeof startCustomerOnboarding === "function") {
            startCustomerOnboarding(phone);
        } else if (typeof showCustomerDashboard === "function") {
            showCustomerDashboard();
        } else {
            showScreen("customerDashboardScreen");
        }
    } catch (error) {
        console.error(error);
        errorEl.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

function customerBackToPhone() {
    document.getElementById("customerOtpStep").classList.add("hidden");
    document.getElementById("customerPhoneStep").classList.remove("hidden");
    document.getElementById("customerOtpInput").value = "";
    document.getElementById("customerOtpError").innerHTML = "";
}


// ---------- WORKER ----------

async function workerSendOtp() {
    const phoneInput = document.getElementById("workerLoginPhone");
    const phone = phoneInput.value.trim();
    const errorEl = document.getElementById("workerPhoneError");

    errorEl.innerHTML = "";

    if (!/^[0-9]{10}$/.test(phone)) {
        errorEl.innerHTML = `<div class="error">Enter a valid 10-digit mobile number.</div>`;
        return;
    }

    try {
        const res = await fetch("/api/auth/worker/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();

        if (!data.success) {
            errorEl.innerHTML = `<div class="error">${data.message}</div>`;
            return;
        }

        localStorage.setItem("sahkaar_worker_pending_phone", phone);
        document.getElementById("workerOtpPhoneDisplay").textContent = phone;

        document.getElementById("workerPhoneStep").classList.add("hidden");
        document.getElementById("workerOtpStep").classList.remove("hidden");
        document.getElementById("workerOtpInput").value = "";
        document.getElementById("workerOtpInput").focus();
    } catch (error) {
        console.error(error);
        errorEl.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

async function workerVerifyOtp() {
    const otp = document.getElementById("workerOtpInput").value.trim();
    const errorEl = document.getElementById("workerOtpError");
    const phone = localStorage.getItem("sahkaar_worker_pending_phone");

    errorEl.innerHTML = "";

    if (!otp) {
        errorEl.innerHTML = `<div class="error">Please enter the 6-digit OTP.</div>`;
        return;
    }

    try {
        const res = await fetch("/api/auth/worker/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();

        if (!data.success) {
            errorEl.innerHTML = `<div class="error">${data.message}</div>`;
            return;
        }

        // Store session token and credentials
        localStorage.setItem("sahkaar_worker_token", data.token);
        localStorage.setItem("sahkaar_worker_phone", phone);
        localStorage.setItem("sahkaar_worker_authed", "true");
        localStorage.setItem("sahkaar_worker_is_new", data.isNew ? "true" : "false");

        if (data.worker && data.worker.name) {
            localStorage.setItem("sahkaar_worker_name", data.worker.name);
        }

        if (data.isNew && typeof startWorkerOnboarding === "function") {
            startWorkerOnboarding(phone);
        } else if (data.isNew) {
            // Fallback: show registration with phone pre-filled
            showWorkerForm();
            const phoneEl = document.getElementById("workerPhone");
            if (phoneEl) phoneEl.value = phone;
        } else {
            // Existing worker -> show dashboard and load data
            showWorkerDashboard();
            const lookupEl = document.getElementById("workerLookupPhone");
            if (lookupEl) lookupEl.value = phone;
            fetchWorkerDashboard();
        }
    } catch (error) {
        console.error(error);
        errorEl.innerHTML = `<div class="error">Server connection failed.</div>`;
    }
}

function workerBackToPhone() {
    document.getElementById("workerOtpStep").classList.add("hidden");
    document.getElementById("workerPhoneStep").classList.remove("hidden");
    document.getElementById("workerOtpInput").value = "";
    document.getElementById("workerOtpError").innerHTML = "";
}

// Session Token Helpers
function customerAuthHeaders() {
    return { "Authorization": "Bearer " + (localStorage.getItem("sahkaar_customer_token") || "") };
}

function workerAuthHeaders() {
    return { "Authorization": "Bearer " + (localStorage.getItem("sahkaar_worker_token") || "") };
}
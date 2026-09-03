// =====================================
// LOGIN — Demo OTP only, for both Customer and Worker.
// No real SMS provider. OTP is always 123456.
// This is clearly a prototype auth flow, not real security.
// =====================================

const DEMO_OTP = "123456";

// ---------- CUSTOMER ----------

function customerSendOtp() {

    const phoneInput = document.getElementById("customerLoginPhone");
    const phone = phoneInput.value.trim();
    const errorEl = document.getElementById("customerPhoneError");

    errorEl.innerHTML = "";

    if (!/^[0-9]{10}$/.test(phone)) {
        errorEl.innerHTML = `<div class="error">Enter a valid 10-digit mobile number.</div>`;
        return;
    }

    localStorage.setItem("sahkaar_customer_pending_phone", phone);
    document.getElementById("customerOtpPhoneDisplay").textContent = phone;

    document.getElementById("customerPhoneStep").classList.add("hidden");
    document.getElementById("customerOtpStep").classList.remove("hidden");
    document.getElementById("customerOtpInput").value = "";
    document.getElementById("customerOtpInput").focus();
}

function customerVerifyOtp() {

    const otp = document.getElementById("customerOtpInput").value.trim();
    const errorEl = document.getElementById("customerOtpError");

    errorEl.innerHTML = "";

    if (otp !== DEMO_OTP) {
        errorEl.innerHTML = `<div class="error">Incorrect OTP. This prototype uses a fixed demo OTP: ${DEMO_OTP}.</div>`;
        return;
    }

    const phone = localStorage.getItem("sahkaar_customer_pending_phone");

    localStorage.setItem("sahkaar_customer_phone", phone);
    localStorage.setItem("sahkaar_customer_authed", "true");

    document.getElementById("customerLoginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");
}

function customerBackToPhone() {
    document.getElementById("customerOtpStep").classList.add("hidden");
    document.getElementById("customerPhoneStep").classList.remove("hidden");
    document.getElementById("customerOtpInput").value = "";
    document.getElementById("customerOtpError").innerHTML = "";
}


// ---------- WORKER ----------

function workerSendOtp() {

    const phoneInput = document.getElementById("workerLoginPhone");
    const phone = phoneInput.value.trim();
    const errorEl = document.getElementById("workerPhoneError");

    errorEl.innerHTML = "";

    if (!/^[0-9]{10}$/.test(phone)) {
        errorEl.innerHTML = `<div class="error">Enter a valid 10-digit mobile number.</div>`;
        return;
    }

    localStorage.setItem("sahkaar_worker_pending_phone", phone);
    document.getElementById("workerOtpPhoneDisplay").textContent = phone;

    document.getElementById("workerPhoneStep").classList.add("hidden");
    document.getElementById("workerOtpStep").classList.remove("hidden");
    document.getElementById("workerOtpInput").value = "";
    document.getElementById("workerOtpInput").focus();
}

async function workerVerifyOtp() {

    const otp = document.getElementById("workerOtpInput").value.trim();
    const errorEl = document.getElementById("workerOtpError");

    errorEl.innerHTML = "";

    if (otp !== DEMO_OTP) {
        errorEl.innerHTML = `<div class="error">Incorrect OTP. This prototype uses a fixed demo OTP: ${DEMO_OTP}.</div>`;
        return;
    }

    const phone = localStorage.getItem("sahkaar_worker_pending_phone");

    localStorage.setItem("sahkaar_worker_phone", phone);
    localStorage.setItem("sahkaar_worker_authed", "true");

    await routeWorkerAfterLogin(phone);
}

function workerBackToPhone() {
    document.getElementById("workerOtpStep").classList.add("hidden");
    document.getElementById("workerPhoneStep").classList.remove("hidden");
    document.getElementById("workerOtpInput").value = "";
    document.getElementById("workerOtpError").innerHTML = "";
}

// Checks the EXISTING /api/workers?phone= endpoint (built in Step 21)
// to decide: known worker -> dashboard, unknown -> registration form.
async function routeWorkerAfterLogin(phone) {

    document.getElementById("workerLoginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");

    try {
        const res = await fetch(`/api/workers?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        if (data.success && data.worker) {
            // Known worker -> straight to dashboard, auto-loaded.
            showWorkerDashboard();
            document.getElementById("workerLookupPhone").value = phone;
            fetchWorkerDashboard();
        } else {
            // Not registered yet -> existing registration form, phone pre-filled.
            // (Full multi-screen onboarding comes in a later step.)
            showWorkerForm();
            document.getElementById("workerPhone").value = phone;
        }
    } catch (error) {
        console.error(error);
        // If the check fails, don't strand the user — send them to registration.
        showWorkerForm();
        document.getElementById("workerPhone").value = phone;
    }
}
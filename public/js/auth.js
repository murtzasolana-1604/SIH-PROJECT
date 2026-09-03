// =====================================
// CUSTOMER LOGIN — Demo OTP only.
// No real SMS provider. OTP is always 123456.
// This is clearly a prototype auth flow, not real security.
// =====================================

const DEMO_OTP = "123456";

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
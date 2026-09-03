// =====================================
// ROLE SELECTION
// =====================================
// Customer now goes through demo OTP login (Step 2).
// Worker and Admin still jump straight in — their login screens
// come in later steps, unchanged from Step 1 for now.

function selectRole(role) {

    localStorage.setItem("sahkaar_role", role);

    if (role === "customer") {
        showCustomerLoginFlow();
        return;
    }

    document.getElementById("roleScreen").classList.add("hidden");
    document.getElementById("customerLoginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");

    if (role === "worker") {
        showWorkerDashboard();
    } else if (role === "admin") {
        showAdmin();
    }
}

function showCustomerLoginFlow() {
    document.getElementById("roleScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.add("hidden");
    document.getElementById("customerLoginScreen").classList.remove("hidden");

    // Always start at the phone step, even on repeat visits.
    document.getElementById("customerOtpStep").classList.add("hidden");
    document.getElementById("customerPhoneStep").classList.remove("hidden");
}

function changeRole() {
    localStorage.removeItem("sahkaar_role");
    localStorage.removeItem("sahkaar_customer_authed");
    localStorage.removeItem("sahkaar_customer_phone");
    localStorage.removeItem("sahkaar_customer_pending_phone");

    document.getElementById("appRoot").classList.add("hidden");
    document.getElementById("customerLoginScreen").classList.add("hidden");
    document.getElementById("roleScreen").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {

    const savedRole = localStorage.getItem("sahkaar_role");

    if (!savedRole) {
        document.getElementById("roleScreen").classList.remove("hidden");
        document.getElementById("appRoot").classList.add("hidden");
        document.getElementById("customerLoginScreen").classList.add("hidden");
        return;
    }

    if (savedRole === "customer") {
        const authed = localStorage.getItem("sahkaar_customer_authed") === "true";

        if (authed) {
            document.getElementById("roleScreen").classList.add("hidden");
            document.getElementById("customerLoginScreen").classList.add("hidden");
            document.getElementById("appRoot").classList.remove("hidden");
        } else {
            showCustomerLoginFlow();
        }
        return;
    }

    // worker / admin — unchanged from Step 1, no login gate yet.
    document.getElementById("roleScreen").classList.add("hidden");
    document.getElementById("customerLoginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");
});
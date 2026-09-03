// =====================================
// ROLE SELECTION
// =====================================
// Customer and Worker: demo OTP login.
// Admin: demo credential login (phone + password), protected by
// a real backend token check — see routes/adminAuth.js.

function selectRole(role) {

    localStorage.setItem("sahkaar_role", role);

    if (role === "customer") { showCustomerLoginFlow(); return; }
    if (role === "worker") { showWorkerLoginFlow(); return; }
    if (role === "admin") { showAdminLoginFlow(); return; }
}

function showCustomerLoginFlow() {
    hideAllEntryScreens();
    document.getElementById("customerLoginScreen").classList.remove("hidden");
    document.getElementById("customerOtpStep").classList.add("hidden");
    document.getElementById("customerPhoneStep").classList.remove("hidden");
}

function showWorkerLoginFlow() {
    hideAllEntryScreens();
    document.getElementById("workerLoginScreen").classList.remove("hidden");
    document.getElementById("workerOtpStep").classList.add("hidden");
    document.getElementById("workerPhoneStep").classList.remove("hidden");
}

function showAdminLoginFlow() {
    hideAllEntryScreens();
    document.getElementById("adminLoginScreen").classList.remove("hidden");
    document.getElementById("adminLoginPhone").value = "";
    document.getElementById("adminLoginPassword").value = "";
    document.getElementById("adminLoginError").innerHTML = "";
}

function hideAllEntryScreens() {
    document.getElementById("roleScreen").classList.add("hidden");
    document.getElementById("customerLoginScreen").classList.add("hidden");
    document.getElementById("workerLoginScreen").classList.add("hidden");
    document.getElementById("adminLoginScreen").classList.add("hidden");
    document.getElementById("appRoot").classList.add("hidden");
}

function changeRole() {
    localStorage.removeItem("sahkaar_role");
    localStorage.removeItem("sahkaar_customer_authed");
    localStorage.removeItem("sahkaar_customer_phone");
    localStorage.removeItem("sahkaar_customer_pending_phone");
    localStorage.removeItem("sahkaar_worker_authed");
    localStorage.removeItem("sahkaar_worker_phone");
    localStorage.removeItem("sahkaar_worker_pending_phone");
    localStorage.removeItem("sahkaar_admin_token");
    localStorage.removeItem("sahkaar_admin_authed");
    localStorage.removeItem("sahkaar_admin_name");

    hideAllEntryScreens();
    document.getElementById("roleScreen").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {

    const savedRole = localStorage.getItem("sahkaar_role");

    if (!savedRole) {
        hideAllEntryScreens();
        document.getElementById("roleScreen").classList.remove("hidden");
        return;
    }

    if (savedRole === "customer") {
        if (localStorage.getItem("sahkaar_customer_authed") === "true") {
            hideAllEntryScreens();
            document.getElementById("appRoot").classList.remove("hidden");
        } else {
            showCustomerLoginFlow();
        }
        return;
    }

    if (savedRole === "worker") {
        if (localStorage.getItem("sahkaar_worker_authed") === "true") {
            const phone = localStorage.getItem("sahkaar_worker_phone");
            hideAllEntryScreens();
            document.getElementById("appRoot").classList.remove("hidden");
            showWorkerDashboard();
            document.getElementById("workerLookupPhone").value = phone;
            fetchWorkerDashboard();
        } else {
            showWorkerLoginFlow();
        }
        return;
    }

    if (savedRole === "admin") {
        if (localStorage.getItem("sahkaar_admin_authed") === "true") {
            hideAllEntryScreens();
            document.getElementById("appRoot").classList.remove("hidden");
            showAdmin();
        } else {
            showAdminLoginFlow();
        }
        return;
    }
});
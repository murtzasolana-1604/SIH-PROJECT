// =====================================
// CENTRAL SCREEN NAVIGATION ROUTER
// =====================================

const SCREENS = [
    "roleScreen",
    "customerLoginScreen",
    "workerLoginScreen",
    "adminLoginScreen",
    "customerOnboardingScreen",
    "workerOnboardingScreen",
    "customerDashboardScreen",
    "workerDashboardScreen",
    "adminDashboardScreen"
];

function showScreen(screenId) {
    SCREENS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove("hidden");
    }

    // Reset scroll position to top instantly per UX requirement
    window.scrollTo({ top: 0, behavior: "instant" });
}

function selectRole(role) {
    localStorage.setItem("sahkaar_role", role);
    if (typeof loadChatbotPrompts === "function") {
        loadChatbotPrompts();
    }

    if (role === "customer") { showCustomerLoginFlow(); return; }
    if (role === "worker") { showWorkerLoginFlow(); return; }
    if (role === "admin") { showAdminLoginFlow(); return; }
}

function showCustomerLoginFlow() {
    showScreen("customerLoginScreen");
    const otpStep = document.getElementById("customerOtpStep");
    const phoneStep = document.getElementById("customerPhoneStep");
    if (otpStep) otpStep.classList.add("hidden");
    if (phoneStep) phoneStep.classList.remove("hidden");
    const phoneErr = document.getElementById("customerPhoneError");
    const otpErr = document.getElementById("customerOtpError");
    if (phoneErr) phoneErr.innerHTML = "";
    if (otpErr) otpErr.innerHTML = "";
}

function showWorkerLoginFlow() {
    showScreen("workerLoginScreen");
    const otpStep = document.getElementById("workerOtpStep");
    const phoneStep = document.getElementById("workerPhoneStep");
    if (otpStep) otpStep.classList.add("hidden");
    if (phoneStep) phoneStep.classList.remove("hidden");
    const phoneErr = document.getElementById("workerPhoneError");
    const otpErr = document.getElementById("workerOtpError");
    if (phoneErr) phoneErr.innerHTML = "";
    if (otpErr) otpErr.innerHTML = "";
}

function showAdminLoginFlow() {
    showScreen("adminLoginScreen");
    const phoneInput = document.getElementById("adminLoginPhone");
    const passInput = document.getElementById("adminLoginPassword");
    const errEl = document.getElementById("adminLoginError");
    if (phoneInput) phoneInput.value = "";
    if (passInput) passInput.value = "";
    if (errEl) errEl.innerHTML = "";
}

function logout() {
    const custToken = localStorage.getItem("sahkaar_customer_token");
    const wrkToken = localStorage.getItem("sahkaar_worker_token");
    const tokenToInvalidate = custToken || wrkToken;

    if (tokenToInvalidate) {
        fetch("/api/auth/logout", {
            method: "POST",
            headers: { "Authorization": "Bearer " + tokenToInvalidate }
        }).catch(() => {});
    }

    localStorage.removeItem("sahkaar_role");
    localStorage.removeItem("sahkaar_customer_authed");
    localStorage.removeItem("sahkaar_customer_phone");
    localStorage.removeItem("sahkaar_customer_pending_phone");
    localStorage.removeItem("sahkaar_customer_token");
    localStorage.removeItem("sahkaar_customer_name");
    localStorage.removeItem("sahkaar_customer_is_new");
    localStorage.removeItem("sahkaar_worker_authed");
    localStorage.removeItem("sahkaar_worker_phone");
    localStorage.removeItem("sahkaar_worker_pending_phone");
    localStorage.removeItem("sahkaar_worker_token");
    localStorage.removeItem("sahkaar_worker_name");
    localStorage.removeItem("sahkaar_worker_is_new");
    localStorage.removeItem("sahkaar_admin_token");
    localStorage.removeItem("sahkaar_admin_authed");
    localStorage.removeItem("sahkaar_admin_name");

    showScreen("roleScreen");
    if (typeof loadChatbotPrompts === "function") {
        loadChatbotPrompts();
    }
}

function changeRole() {
    logout();
}

document.addEventListener("DOMContentLoaded", () => {
    const savedRole = localStorage.getItem("sahkaar_role");

    if (!savedRole) {
        showScreen("roleScreen");
        return;
    }

    if (savedRole === "customer") {
        if (localStorage.getItem("sahkaar_customer_authed") === "true") {
            if (typeof showCustomerDashboard === "function") {
                showCustomerDashboard();
            } else {
                showScreen("customerDashboardScreen");
            }
        } else {
            showCustomerLoginFlow();
        }
        return;
    }

    if (savedRole === "worker") {
        if (localStorage.getItem("sahkaar_worker_authed") === "true") {
            const phone = localStorage.getItem("sahkaar_worker_phone");
            if (typeof showWorkerDashboard === "function") {
                showWorkerDashboard();
            } else {
                showScreen("workerDashboardScreen");
            }
            if (phone) {
                const lookupEl = document.getElementById("workerLookupPhone");
                if (lookupEl) lookupEl.value = phone;
                if (typeof fetchWorkerDashboard === "function") {
                    fetchWorkerDashboard();
                }
            }
        } else {
            showWorkerLoginFlow();
        }
        return;
    }

    if (savedRole === "admin") {
        if (localStorage.getItem("sahkaar_admin_authed") === "true") {
            if (typeof showAdminDashboard === "function") {
                showAdminDashboard();
            } else if (typeof showAdmin === "function") {
                showAdmin();
            } else {
                showScreen("adminDashboardScreen");
            }
        } else {
            showAdminLoginFlow();
        }
        return;
    }

    showScreen("roleScreen");
});
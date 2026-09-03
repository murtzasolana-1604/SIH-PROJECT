// =====================================
// ADMIN LOGIN — demo credentials only.
// See routes/adminAuth.js for the backend side.
// =====================================

function adminLogin() {

    const phone = document.getElementById("adminLoginPhone").value.trim();
    const password = document.getElementById("adminLoginPassword").value;
    const errorEl = document.getElementById("adminLoginError");

    errorEl.innerHTML = "";

    fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.success) {
            errorEl.innerHTML = `<div class="error">${data.message}</div>`;
            return;
        }

        localStorage.setItem("sahkaar_admin_token", data.token);
        localStorage.setItem("sahkaar_admin_authed", "true");
        localStorage.setItem("sahkaar_admin_name", data.admin.name);

        document.getElementById("adminLoginScreen").classList.add("hidden");
        document.getElementById("appRoot").classList.remove("hidden");
        showAdmin();
    })
    .catch(error => {
        console.error(error);
        errorEl.innerHTML = `<div class="error">Server connection failed.</div>`;
    });
}

function adminAuthHeaders() {
    return { "Authorization": "Bearer " + localStorage.getItem("sahkaar_admin_token") };
}

// Wrapper around fetch() that adds the admin token and handles
// an expired/invalid session by bouncing back to the login screen.
async function adminFetch(url, options = {}) {

    const opts = { ...options };
    opts.headers = { ...(options.headers || {}), ...adminAuthHeaders() };

    const res = await fetch(url, opts);

    if (res.status === 401) {
        alert("Your admin session has expired. Please log in again.");
        adminLogout();
        throw new Error("Admin session expired");
    }

    return res;
}

function adminLogout() {
    localStorage.removeItem("sahkaar_admin_token");
    localStorage.removeItem("sahkaar_admin_authed");
    localStorage.removeItem("sahkaar_admin_name");

    document.getElementById("appRoot").classList.add("hidden");
    document.getElementById("adminLoginScreen").classList.remove("hidden");
}
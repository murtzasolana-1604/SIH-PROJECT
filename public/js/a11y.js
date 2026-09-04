/**
 * SAHKAAR CONNECT — ACCESSIBILITY & HIGH CONTRAST ENGINE (PHASE 19)
 * WCAG 2.1 Level AA Compliance & GIGW 3.0 Guidelines
 */

const A11Y_STATE = {
    contrast: localStorage.getItem("sahkaar_contrast_theme") || "normal",
    fontScale: localStorage.getItem("sahkaar_font_scale") || "normal"
};

/**
 * Initialize accessibility preferences and global keyboard listeners on page load
 */
function initA11y() {
    // 1. Apply saved contrast mode
    if (A11Y_STATE.contrast === "high") {
        document.body.classList.add("theme-high-contrast");
        updateContrastButton(true);
    } else {
        document.body.classList.remove("theme-high-contrast");
        updateContrastButton(false);
    }

    // 2. Apply saved font scaling
    applyFontScale(A11Y_STATE.fontScale, false);

    // 3. Register global keyboard listeners
    document.addEventListener("keydown", handleGlobalA11yKeydown);
}

/**
 * Toggles High-Contrast Dark Mode (> 7:1 contrast ratio)
 */
function toggleHighContrast() {
    const isNowHigh = !document.body.classList.contains("theme-high-contrast");
    document.body.classList.toggle("theme-high-contrast", isNowHigh);
    A11Y_STATE.contrast = isNowHigh ? "high" : "normal";
    localStorage.setItem("sahkaar_contrast_theme", A11Y_STATE.contrast);

    updateContrastButton(isNowHigh);

    const msg = isNowHigh 
        ? (typeof t === "function" ? t("a11yContrastAnnounceOn", "High contrast mode enabled") : "High contrast mode enabled")
        : (typeof t === "function" ? t("a11yContrastAnnounceOff", "Standard contrast mode restored") : "Standard contrast mode restored");
    
    announceToScreenReader(msg);
}

function updateContrastButton(isHigh) {
    const btns = document.querySelectorAll(".a11y-contrast-btn");
    btns.forEach(btn => {
        btn.setAttribute("aria-pressed", isHigh ? "true" : "false");
        btn.classList.toggle("active", isHigh);
    });
}

/**
 * Sets typography scaling level
 * @param {'normal'|'large'|'xlarge'} scale
 */
function setFontScale(scale) {
    applyFontScale(scale, true);
}

function applyFontScale(scale, announce = true) {
    const root = document.documentElement;
    root.classList.remove("font-scale-large", "font-scale-xlarge");

    if (scale === "large") {
        root.classList.add("font-scale-large");
    } else if (scale === "xlarge") {
        root.classList.add("font-scale-xlarge");
    }

    A11Y_STATE.fontScale = scale;
    localStorage.setItem("sahkaar_font_scale", scale);

    // Update active state on font control buttons
    const btns = document.querySelectorAll(".a11y-font-btn");
    btns.forEach(btn => {
        const btnScale = btn.getAttribute("data-scale") || "normal";
        btn.classList.toggle("active", btnScale === scale);
        btn.setAttribute("aria-pressed", btnScale === scale ? "true" : "false");
    });

    if (announce) {
        const labels = {
            normal: "Standard text size 100%",
            large: "Enlarged text size 115%",
            xlarge: "Maximum text size 130%"
        };
        announceToScreenReader(labels[scale] || "Text size updated");
    }
}

/**
 * Screen Reader Live Region Announcer
 * Dynamically injects polite screen reader messages for assistive devices
 */
function announceToScreenReader(message) {
    const announcer = document.getElementById("a11yLiveAnnouncer");
    if (!announcer) return;

    announcer.textContent = "";
    setTimeout(() => {
        announcer.textContent = message;
    }, 50);
}

/**
 * Global Keyboard Handler:
 * 1. Escape key closes any active modal dialog
 * 2. Manages keyboard focus
 */
function handleGlobalA11yKeydown(event) {
    if (event.key === "Escape") {
        const openModals = document.querySelectorAll(".modal-overlay:not(.hidden)");
        if (openModals.length > 0) {
            event.preventDefault();
            // Close the topmost visible modal
            const topModal = openModals[openModals.length - 1];
            closeModalById(topModal.id);
            announceToScreenReader("Modal dialog closed");
        }
    }
}

function closeModalById(id) {
    switch (id) {
        case "workerInsuranceModal":
            if (typeof closeWorkerInsuranceModal === "function") closeWorkerInsuranceModal();
            break;
        case "workerDigitalIdModal":
            if (typeof closeWorkerDigitalIdModal === "function") closeWorkerDigitalIdModal();
            break;
        case "citizenTrustModal":
            if (typeof closeCitizenTrustModal === "function") closeCitizenTrustModal();
            break;
        case "adminBadgeModal":
            if (typeof closeAdminBadgeModal === "function") closeAdminBadgeModal();
            break;
        case "sosEmergencyModal":
            if (typeof closeEmergencySOSModal === "function") closeEmergencySOSModal();
            break;
        case "newSocietyModal":
            if (typeof closeNewSocietyModal === "function") closeNewSocietyModal();
            break;
        case "cooperativeAuditModal":
            if (typeof closeCooperativeAuditModal === "function") closeCooperativeAuditModal();
            break;
        default:
            const m = document.getElementById(id);
            if (m) m.classList.add("hidden");
    }
}

// Auto-initialize when DOM ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initA11y);
    } else {
        initA11y();
    }
}

// ============================================================
// SAHKAAR CONNECT - PWA & OFFLINE SYNC CONTROLLER (PHASE 16)
// ============================================================

// 1. REGISTER SERVICE WORKER
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
            .then(registration => {
                console.log("[PWA] Sahkaar Service Worker registered with scope:", registration.scope);
            })
            .catch(error => {
                console.warn("[PWA] Service Worker registration notice:", error);
            });
    });
}

// 2. NETWORK LIVENESS MONITOR & BANNER CONTROLLER
const OFFLINE_STORAGE_KEY = "sahkaar_offline_outbox";

function updateNetworkStatus() {
    const banner = document.getElementById("networkStatusBanner");
    const isOnline = navigator.onLine;

    if (!banner) return;

    if (!isOnline) {
        banner.className = "network-banner offline";
        banner.innerHTML = `
            <div class="network-banner-content">
                <span class="net-pulse-dot offline"></span>
                <span>
                    <strong>${typeof t === "function" ? t("offlineBannerTitle", "⚠️ OFFLINE MODE:") : "⚠️ OFFLINE MODE:"}</strong> 
                    ${typeof t === "function" ? t("offlineBannerSub", "Working from local cooperative device vault. Any new bookings will be safely queued and auto-synced once online.") : "Working from local cooperative device vault. Any new bookings will be safely queued and auto-synced once online."}
                </span>
            </div>
            <div class="network-banner-actions">
                <button class="net-btn-retry" onclick="checkNetworkConnection()">${typeof t === "function" ? t("btnRetrySync", "🔄 Retry Sync") : "🔄 Retry Sync"}</button>
            </div>
        `;
        banner.classList.remove("hidden");
    } else {
        const outbox = getOfflineOutbox();
        if (outbox.length > 0) {
            syncOfflineOutbox();
        } else {
            // Briefly show connected confirmation then hide
            banner.className = "network-banner online";
            banner.innerHTML = `
                <div class="network-banner-content">
                    <span class="net-pulse-dot online"></span>
                    <span><strong>${typeof t === "function" ? t("onlineRestoredTitle", "✅ ONLINE:") : "✅ ONLINE:"}</strong> ${typeof t === "function" ? t("onlineRestoredSub", "Connected to Sahkaar Cooperative Federation.") : "Connected to Sahkaar Cooperative Federation."}</span>
                </div>
            `;
            setTimeout(() => {
                if (navigator.onLine) {
                    banner.classList.add("hidden");
                }
            }, 3500);
        }
    }
}

window.addEventListener("online", () => {
    console.log("[PWA] Device returned ONLINE. Initiating outbox sync...");
    updateNetworkStatus();
    syncOfflineOutbox();
});

window.addEventListener("offline", () => {
    console.log("[PWA] Device went OFFLINE. Local cooperative cache active.");
    updateNetworkStatus();
});

function checkNetworkConnection() {
    if (navigator.onLine) {
        syncOfflineOutbox();
        updateNetworkStatus();
    } else {
        alert(typeof t === "function" ? t("stillOfflineNotice", "Device is still offline. Reconnect to Wi-Fi or mobile data.") : "Device is still offline. Reconnect to Wi-Fi or mobile data.");
    }
}

// 3. OFFLINE OUTBOX REQUEST QUEUE
function getOfflineOutbox() {
    try {
        const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveOfflineOutbox(items) {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(items));
    updateOutboxIndicator();
}

function updateOutboxIndicator() {
    const count = getOfflineOutbox().length;
    const badge = document.getElementById("offlineQueueBadge");
    if (badge) {
        if (count > 0) {
            badge.textContent = `${count} pending`;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    }
}

/**
 * Saves an offline booking into the local cooperative vault and returns a synthetic confirmation
 */
function queueOfflineBooking(bookingPayload) {
    const outbox = getOfflineOutbox();
    const offlineId = "OFFLINE-" + Date.now();
    
    const queuedItem = {
        queueId: offlineId,
        type: "BOOKING_CREATE",
        timestamp: new Date().toISOString(),
        payload: bookingPayload
    };

    outbox.push(queuedItem);
    saveOfflineOutbox(outbox);

    console.log("[PWA] Queued offline booking:", queuedItem);

    // Return synthetic booking response for immediate customer confirmation
    return {
        success: true,
        isOfflineQueued: true,
        message: typeof t === "function" 
            ? t("bookingOfflineQueuedMsg", "📡 Your booking has been safely stored in your offline cooperative vault (#" + offlineId + "). It will auto-sync the moment your connection returns!")
            : `📡 Your booking has been safely stored in your offline cooperative vault (#${offlineId}). It will auto-sync the moment your connection returns!`,
        booking: {
            id: offlineId,
            service: bookingPayload.service,
            customer_name: bookingPayload.customerName,
            customer_phone: bookingPayload.customerPhone,
            address: bookingPayload.address,
            booking_date: bookingPayload.bookingDate,
            booking_time: bookingPayload.bookingTime,
            status: "Pending (Offline Vault)"
        }
    };
}

/**
 * Sequentially syncs all pending outbox requests to the server
 */
let isSyncing = false;
async function syncOfflineOutbox() {
    if (isSyncing) return;
    const outbox = getOfflineOutbox();
    if (outbox.length === 0) return;

    if (!navigator.onLine) {
        console.log("[PWA] Cannot sync while offline.");
        return;
    }

    isSyncing = true;
    console.log(`[PWA] Replaying ${outbox.length} queued offline requests to federation server...`);

    const remaining = [];
    let syncedCount = 0;

    for (const item of outbox) {
        try {
            if (item.type === "BOOKING_CREATE") {
                const res = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    syncedCount++;
                    console.log(`[PWA] Successfully synced offline booking #${item.queueId} -> Real Booking #${data.booking.id}`);
                } else {
                    remaining.push(item);
                }
            } else {
                remaining.push(item);
            }
        } catch (err) {
            console.error(`[PWA] Error syncing item #${item.queueId}:`, err);
            remaining.push(item);
        }
    }

    saveOfflineOutbox(remaining);
    isSyncing = false;

    if (syncedCount > 0) {
        showPwaToast(`✅ Synchronized ${syncedCount} offline booking${syncedCount > 1 ? 's' : ''} with the cooperative federation!`);
        
        // Refresh My Bookings if open
        if (typeof fetchMyBookings === "function") {
            try {
                fetchMyBookings();
            } catch (e) {
                console.warn(e);
            }
        }
    }

    updateNetworkStatus();
}

// 4. TOAST NOTIFICATION UTILITY
function showPwaToast(msg) {
    let toast = document.getElementById("pwaToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "pwaToast";
        toast.className = "pwa-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(() => {
        toast.classList.remove("visible");
    }, 4500);
}

// 5. PWA INSTALL PROMPT CONTROLLER
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) {
        banner.classList.remove("hidden");
    }
});

function triggerPwaInstall() {
    if (!deferredPrompt) {
        alert("To install, use your browser's 'Add to Home Screen' or 'Install App' option in the address bar.");
        return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === "accepted") {
            console.log("[PWA] User accepted the install prompt.");
        }
        deferredPrompt = null;
        dismissPwaInstallBanner();
    });
}

function dismissPwaInstallBanner() {
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) banner.classList.add("hidden");
}

window.addEventListener("appinstalled", () => {
    console.log("[PWA] Sahkaar Connect was installed successfully!");
    dismissPwaInstallBanner();
});

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    updateNetworkStatus();
    updateOutboxIndicator();
});

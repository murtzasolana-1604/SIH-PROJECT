// =====================================
// MULTI-STEP ONBOARDING CONTROLLER
// Customer & Worker Multi-Step Onboarding
// =====================================

// ---------- CUSTOMER ONBOARDING ----------

let customerOnboardingState = {
    phone: "",
    name: "",
    address: "",
    villageTown: "",
    city: "",
    state: "",
    pincode: "",
    lat: null,
    lng: null
};

let currentCustomerStep = 1;

function startCustomerOnboarding(phone) {
    customerOnboardingState.phone = phone || localStorage.getItem("sahkaar_customer_phone") || "";
    currentCustomerStep = 1;
    showCustomerOnboardingStep(1);
    showScreen("customerOnboardingScreen");
}

function showCustomerOnboardingStep(step) {
    currentCustomerStep = step;

    for (let s = 1; s <= 3; s++) {
        const stepEl = document.getElementById(`customerStep${s}`);
        const indicatorEl = document.getElementById(`custInd${s}`);
        if (stepEl) {
            if (s === step) stepEl.classList.remove("hidden");
            else stepEl.classList.add("hidden");
        }
        if (indicatorEl) {
            if (s === step) indicatorEl.classList.add("active");
            else if (s < step) {
                indicatorEl.classList.remove("active");
                indicatorEl.classList.add("completed");
            } else {
                indicatorEl.classList.remove("active", "completed");
            }
        }
    }
}

function nextCustomerStep() {
    const errorEl = document.getElementById(`custStepError${currentCustomerStep}`);
    if (errorEl) errorEl.innerHTML = "";

    if (currentCustomerStep === 1) {
        const nameInput = document.getElementById("custOnboardName");
        const name = nameInput ? nameInput.value.trim() : "";
        if (!name) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please enter your full name.</div>`;
            return;
        }
        customerOnboardingState.name = name;
        showCustomerOnboardingStep(2);
        return;
    }

    if (currentCustomerStep === 2) {
        const address = (document.getElementById("custOnboardAddress")?.value || "").trim();
        const villageTown = (document.getElementById("custOnboardTown")?.value || "").trim();
        const city = (document.getElementById("custOnboardCity")?.value || "").trim();
        const state = (document.getElementById("custOnboardState")?.value || "").trim();
        const pincode = (document.getElementById("custOnboardPin")?.value || "").trim();

        if (!address || !city || !state || !pincode) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please fill in Address, City, State, and PIN code.</div>`;
            return;
        }

        if (!/^[0-9]{6}$/.test(pincode)) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please enter a valid 6-digit PIN code.</div>`;
            return;
        }

        customerOnboardingState.address = address;
        customerOnboardingState.villageTown = villageTown;
        customerOnboardingState.city = city;
        customerOnboardingState.state = state;
        customerOnboardingState.pincode = pincode;

        showCustomerOnboardingStep(3);
        return;
    }
}

function prevCustomerStep() {
    if (currentCustomerStep > 1) {
        showCustomerOnboardingStep(currentCustomerStep - 1);
    }
}

function captureCustomerLocation() {
    const statusEl = document.getElementById("custGeoStatus");
    const btn = document.getElementById("custGeoBtn");

    if (!navigator.geolocation) {
        if (statusEl) statusEl.innerHTML = `<div class="geo-status warning">Geolocation is not supported by your browser. You can continue with your manual address.</div>`;
        return;
    }

    if (btn) btn.textContent = "📍 Detecting coordinates...";

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            customerOnboardingState.lat = lat;
            customerOnboardingState.lng = lng;

            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="geo-status success">
                        <strong>✓ Location Captured!</strong><br>
                        Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}
                    </div>
                `;
            }
            if (btn) btn.textContent = "📍 Update Location";
        },
        error => {
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="geo-status info">
                        ℹ️ Location access not granted (${error.message}). Continuing with manual address: <strong>${customerOnboardingState.city}, ${customerOnboardingState.state}</strong>.
                    </div>
                `;
            }
            if (btn) btn.textContent = "📍 Try Location Again";
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

async function finishCustomerOnboarding() {
    try {
        const res = await fetch("/api/customer/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: customerOnboardingState.phone,
                name: customerOnboardingState.name,
                address: customerOnboardingState.address,
                villageTown: customerOnboardingState.villageTown,
                city: customerOnboardingState.city,
                state: customerOnboardingState.state,
                pincode: customerOnboardingState.pincode,
                latitude: customerOnboardingState.lat,
                longitude: customerOnboardingState.lng
            })
        });
        const data = await res.json();
        if (data.success && data.customer) {
            localStorage.setItem("sahkaar_customer_name", data.customer.name);
            localStorage.setItem("sahkaar_customer_address", data.customer.address || "");
            localStorage.setItem("sahkaar_customer_city", data.customer.city || "");
            localStorage.setItem("sahkaar_customer_state", data.customer.state || "");
            localStorage.setItem("sahkaar_customer_pincode", data.customer.pincode || "");
            if (data.customer.latitude) localStorage.setItem("sahkaar_customer_lat", data.customer.latitude);
            if (data.customer.longitude) localStorage.setItem("sahkaar_customer_lng", data.customer.longitude);
        }
    } catch (err) {
        console.error("Profile API save failed, using local state:", err);
        localStorage.setItem("sahkaar_customer_name", customerOnboardingState.name);
        localStorage.setItem("sahkaar_customer_address", `${customerOnboardingState.address}, ${customerOnboardingState.city}, ${customerOnboardingState.state} - ${customerOnboardingState.pincode}`);
        localStorage.setItem("sahkaar_customer_city", customerOnboardingState.city);
        localStorage.setItem("sahkaar_customer_state", customerOnboardingState.state);
        localStorage.setItem("sahkaar_customer_pincode", customerOnboardingState.pincode);
        if (customerOnboardingState.lat && customerOnboardingState.lng) {
            localStorage.setItem("sahkaar_customer_lat", customerOnboardingState.lat);
            localStorage.setItem("sahkaar_customer_lng", customerOnboardingState.lng);
        }
    }

    localStorage.setItem("sahkaar_customer_is_new", "false");

    // Populate prefilled data into customer booking form for convenience
    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");
    const addrInput = document.getElementById("customerAddress");
    const latInput = document.getElementById("customerLat");
    const lngInput = document.getElementById("customerLng");

    if (nameInput) nameInput.value = customerOnboardingState.name;
    if (phoneInput) phoneInput.value = customerOnboardingState.phone;
    if (addrInput) addrInput.value = localStorage.getItem("sahkaar_customer_address") || "";
    if (latInput && customerOnboardingState.lat) latInput.value = customerOnboardingState.lat;
    if (lngInput && customerOnboardingState.lng) lngInput.value = customerOnboardingState.lng;

    showCustomerDashboard();
}


// ---------- WORKER ONBOARDING ----------

let workerOnboardingState = {
    phone: "",
    name: "",
    skill: "",
    experience: "",
    certification: "",
    additionalSkills: "",
    address: "",
    villageTown: "",
    city: "",
    state: "",
    pincode: "",
    lat: null,
    lng: null,
    availability: []
};

let currentWorkerStep = 1;

function startWorkerOnboarding(phone) {
    workerOnboardingState.phone = phone || localStorage.getItem("sahkaar_worker_phone") || "";
    currentWorkerStep = 1;

    const phoneDisplay = document.getElementById("workerOnboardPhoneDisplay");
    if (phoneDisplay) phoneDisplay.value = workerOnboardingState.phone;

    showWorkerOnboardingStep(1);
    showScreen("workerOnboardingScreen");
}

function showWorkerOnboardingStep(step) {
    currentWorkerStep = step;

    for (let s = 1; s <= 5; s++) {
        const stepEl = document.getElementById(`workerStep${s}`);
        const indicatorEl = document.getElementById(`wrkInd${s}`);
        if (stepEl) {
            if (s === step) stepEl.classList.remove("hidden");
            else stepEl.classList.add("hidden");
        }
        if (indicatorEl) {
            if (s === step) indicatorEl.classList.add("active");
            else if (s < step) {
                indicatorEl.classList.remove("active");
                indicatorEl.classList.add("completed");
            } else {
                indicatorEl.classList.remove("active", "completed");
            }
        }
    }
}

function nextWorkerStep() {
    const errorEl = document.getElementById(`wrkStepError${currentWorkerStep}`);
    if (errorEl) errorEl.innerHTML = "";

    if (currentWorkerStep === 1) {
        const nameInput = document.getElementById("wrkOnboardName");
        const name = nameInput ? nameInput.value.trim() : "";
        if (!name) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please enter your full name.</div>`;
            return;
        }
        workerOnboardingState.name = name;
        showWorkerOnboardingStep(2);
        return;
    }

    if (currentWorkerStep === 2) {
        const skill = document.getElementById("wrkOnboardSkill")?.value || "";
        const experience = (document.getElementById("wrkOnboardExp")?.value || "").trim();
        const certification = document.getElementById("wrkOnboardCert")?.value || "";
        const additional = (document.getElementById("wrkOnboardAdditional")?.value || "").trim();

        if (!skill) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please select your primary skill.</div>`;
            return;
        }
        if (!experience) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please specify your experience in years.</div>`;
            return;
        }

        workerOnboardingState.skill = skill;
        workerOnboardingState.experience = experience;
        workerOnboardingState.certification = certification || "Self-Trained / Practical Experience";
        workerOnboardingState.additionalSkills = additional;

        showWorkerOnboardingStep(3);
        return;
    }

    if (currentWorkerStep === 3) {
        const address = (document.getElementById("wrkOnboardAddress")?.value || "").trim();
        const villageTown = (document.getElementById("wrkOnboardTown")?.value || "").trim();
        const city = (document.getElementById("wrkOnboardCity")?.value || "").trim();
        const state = (document.getElementById("wrkOnboardState")?.value || "").trim();
        const pincode = (document.getElementById("wrkOnboardPin")?.value || "").trim();

        if (!address || !city || !state || !pincode) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please fill in Address, City, State, and PIN code.</div>`;
            return;
        }

        if (!/^[0-9]{6}$/.test(pincode)) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please enter a valid 6-digit PIN code.</div>`;
            return;
        }

        workerOnboardingState.address = address;
        workerOnboardingState.villageTown = villageTown;
        workerOnboardingState.city = city;
        workerOnboardingState.state = state;
        workerOnboardingState.pincode = pincode;

        showWorkerOnboardingStep(4);
        return;
    }

    if (currentWorkerStep === 4) {
        if (workerOnboardingState.availability.length === 0) {
            if (errorEl) errorEl.innerHTML = `<div class="error">Please select at least one availability window.</div>`;
            return;
        }

        submitWorkerOnboardingProfile();
        return;
    }
}

function prevWorkerStep() {
    if (currentWorkerStep > 1 && currentWorkerStep < 5) {
        showWorkerOnboardingStep(currentWorkerStep - 1);
    }
}

function toggleWorkerAvailability(slot) {
    const idx = workerOnboardingState.availability.indexOf(slot);
    const pill = document.querySelector(`.slot-pill[data-slot="${slot}"]`);

    if (idx > -1) {
        workerOnboardingState.availability.splice(idx, 1);
        if (pill) pill.classList.remove("active");
    } else {
        workerOnboardingState.availability.push(slot);
        if (pill) pill.classList.add("active");
    }
}

function captureWorkerLocation() {
    const statusEl = document.getElementById("wrkGeoStatus");
    const btn = document.getElementById("wrkGeoBtn");

    if (!navigator.geolocation) {
        if (statusEl) statusEl.innerHTML = `<div class="geo-status warning">Geolocation is not supported by your browser. Manual service address will be used.</div>`;
        return;
    }

    if (btn) btn.textContent = "📍 Detecting coordinates...";

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            workerOnboardingState.lat = lat;
            workerOnboardingState.lng = lng;

            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="geo-status success">
                        <strong>✓ Service Area Coordinates Set!</strong><br>
                        Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}
                    </div>
                `;
            }
            if (btn) btn.textContent = "📍 Update Coordinates";
        },
        error => {
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="geo-status info">
                        ℹ️ Location permission denied (${error.message}). Coarse matching will use <strong>${workerOnboardingState.city}, ${workerOnboardingState.state}</strong>.
                    </div>
                `;
            }
            if (btn) btn.textContent = "📍 Try Location Again";
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

async function submitWorkerOnboardingProfile() {
    try {
        const res = await fetch("/api/workers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: workerOnboardingState.phone,
                name: workerOnboardingState.name,
                skill: workerOnboardingState.skill,
                experience: workerOnboardingState.experience,
                certification: workerOnboardingState.certification,
                additionalSkills: workerOnboardingState.additionalSkills,
                address: workerOnboardingState.address,
                villageTown: workerOnboardingState.villageTown,
                city: workerOnboardingState.city,
                state: workerOnboardingState.state,
                pincode: workerOnboardingState.pincode,
                latitude: workerOnboardingState.lat,
                longitude: workerOnboardingState.lng,
                availability: workerOnboardingState.availability.join(", ")
            })
        });
        const data = await res.json();
        if (data.success && data.worker) {
            workerOnboardingState.workerId = data.worker.id;
            localStorage.setItem("sahkaar_worker_id", data.worker.id);
            localStorage.setItem("sahkaar_worker_name", data.worker.name);
            localStorage.setItem("sahkaar_worker_skill", data.worker.skill);
            localStorage.setItem("sahkaar_worker_verified", data.worker.verified ? "1" : "0");
        }
    } catch (err) {
        console.error("Worker register API error, using local state:", err);
    }

    // Fill review card on Step 5
    document.getElementById("reviewWrkName").textContent = workerOnboardingState.name;
    document.getElementById("reviewWrkSkill").textContent = workerOnboardingState.skill;
    document.getElementById("reviewWrkExp").textContent = `${workerOnboardingState.experience} years`;
    document.getElementById("reviewWrkCert").textContent = workerOnboardingState.certification;
    document.getElementById("reviewWrkLoc").textContent = `${workerOnboardingState.city}, ${workerOnboardingState.state}`;
    document.getElementById("reviewWrkAvail").textContent = workerOnboardingState.availability.join(", ");

    // Save worker credentials in local state
    localStorage.setItem("sahkaar_worker_name", workerOnboardingState.name);
    localStorage.setItem("sahkaar_worker_skill", workerOnboardingState.skill);
    localStorage.setItem("sahkaar_worker_location", `${workerOnboardingState.city}, ${workerOnboardingState.state}`);
    localStorage.setItem("sahkaar_worker_availability", workerOnboardingState.availability.join(", "));
    localStorage.setItem("sahkaar_worker_is_new", "false");

    showWorkerOnboardingStep(5);
}

function finishWorkerOnboarding() {
    showWorkerDashboard();
    const phone = workerOnboardingState.phone || localStorage.getItem("sahkaar_worker_phone");
    const lookupEl = document.getElementById("workerLookupPhone");
    if (lookupEl && phone) lookupEl.value = phone;
}

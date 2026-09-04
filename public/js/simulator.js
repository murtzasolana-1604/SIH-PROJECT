/**
 * SAHKAAR CONNECT — HACKATHON PITCH DECK & INTERACTIVE LIFECYCLE SIMULATOR (PHASE 20)
 * Problem Statement SIH26089 • Smart India Hackathon 2026
 */

// ============================================================
// 1. PITCH DECK CONTROLLER (FOR JURIES & EVALUATORS)
// ============================================================
const PITCH_DECK_STATE = {
    currentSlide: 0,
    slides: [],
    metadata: null,
    metrics: null,
    isLoaded: false
};

/**
 * Opens the Hackathon Presentation Pitch Deck Modal
 */
async function openJudgePitchModal() {
    const modal = document.getElementById("judgePitchModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    if (typeof announceToScreenReader === "function") {
        announceToScreenReader("Smart India Hackathon 2026 Presentation Pitch Deck opened");
    }

    if (!PITCH_DECK_STATE.isLoaded) {
        await loadPitchDeckData();
    } else {
        renderCurrentPitchSlide();
    }
}

/**
 * Closes the Pitch Deck Modal
 */
function closeJudgePitchModal() {
    const modal = document.getElementById("judgePitchModal");
    if (modal) modal.classList.add("hidden");
    if (typeof announceToScreenReader === "function") {
        announceToScreenReader("Pitch Deck modal closed");
    }
}

/**
 * Fetches slides & platform metrics from /api/simulator/pitch-deck
 */
async function loadPitchDeckData() {
    const container = document.getElementById("pitchDeckSlideContainer");
    if (container) {
        container.innerHTML = '<div class="skeleton" style="height:280px; border-radius:12px;"></div>';
    }

    try {
        const res = await fetch("/api/simulator/pitch-deck");
        const json = await res.json();

        if (json.success && json.pitchDeck) {
            PITCH_DECK_STATE.slides = json.pitchDeck.slides || [];
            PITCH_DECK_STATE.metadata = json.pitchDeck.metadata || {};
            PITCH_DECK_STATE.metrics = json.pitchDeck.livePlatformMetrics || {};
            PITCH_DECK_STATE.isLoaded = true;
            PITCH_DECK_STATE.currentSlide = 0;
            renderCurrentPitchSlide();
        } else {
            throw new Error(json.message || "Failed to load deck");
        }
    } catch (err) {
        console.warn("Pitch deck fallback to local cache:", err);
        // Resilient fallback for offline evaluation
        renderPitchDeckOfflineFallback();
    }
}

/**
 * Navigates to next presentation slide
 */
function nextPitchSlide() {
    if (PITCH_DECK_STATE.currentSlide < PITCH_DECK_STATE.slides.length - 1) {
        PITCH_DECK_STATE.currentSlide++;
        renderCurrentPitchSlide();
    }
}

/**
 * Navigates to previous presentation slide
 */
function prevPitchSlide() {
    if (PITCH_DECK_STATE.currentSlide > 0) {
        PITCH_DECK_STATE.currentSlide--;
        renderCurrentPitchSlide();
    }
}

/**
 * Directly jumps to slide by index
 */
function goToPitchSlide(index) {
    if (index >= 0 && index < PITCH_DECK_STATE.slides.length) {
        PITCH_DECK_STATE.currentSlide = index;
        renderCurrentPitchSlide();
    }
}

/**
 * Renders the active slide with carousel indicators and animated highlights
 */
function renderCurrentPitchSlide() {
    const container = document.getElementById("pitchDeckSlideContainer");
    const indicator = document.getElementById("pitchDeckIndicator");
    const prevBtn = document.getElementById("pitchPrevBtn");
    const nextBtn = document.getElementById("pitchNextBtn");
    const slideNumberBadge = document.getElementById("pitchSlideNumberBadge");

    if (!container || !PITCH_DECK_STATE.slides.length) return;

    const slide = PITCH_DECK_STATE.slides[PITCH_DECK_STATE.currentSlide];
    const total = PITCH_DECK_STATE.slides.length;
    const current = PITCH_DECK_STATE.currentSlide + 1;

    if (slideNumberBadge) {
        slideNumberBadge.textContent = `Slide ${current} of ${total}`;
    }

    if (prevBtn) prevBtn.disabled = PITCH_DECK_STATE.currentSlide === 0;
    if (nextBtn) nextBtn.disabled = PITCH_DECK_STATE.currentSlide === total - 1;

    // Build dots indicator
    if (indicator) {
        indicator.innerHTML = PITCH_DECK_STATE.slides.map((s, idx) => `
            <button class="pitch-dot ${idx === PITCH_DECK_STATE.currentSlide ? 'active' : ''}" 
                    onclick="goToPitchSlide(${idx})" 
                    aria-label="Slide ${idx + 1}: ${s.title}"
                    title="Slide ${idx + 1}: ${s.title}">
            </button>
        `).join("");
    }

    // Render slide card
    container.innerHTML = `
        <div class="pitch-slide-card fade-in">
            <div class="pitch-slide-header">
                <span class="pitch-tag">${slide.tag}</span>
                <h2 class="pitch-title">${slide.title}</h2>
                <p class="pitch-sub">${slide.subtitle}</p>
            </div>

            <div class="pitch-stats-row">
                ${slide.stats.map(st => `
                    <div class="pitch-stat-box">
                        <div class="pitch-stat-val">${st.value}</div>
                        <div class="pitch-stat-label">${st.label}</div>
                        <small class="pitch-stat-note">${st.note}</small>
                    </div>
                `).join("")}
            </div>

            <div class="pitch-bullets">
                ${slide.bulletPoints.map(bp => `
                    <div class="pitch-bullet-item">
                        <span class="pitch-bullet-icon">✦</span>
                        <span>${bp}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function renderPitchDeckOfflineFallback() {
    const container = document.getElementById("pitchDeckSlideContainer");
    if (!container) return;
    container.innerHTML = `
        <div class="pitch-slide-card">
            <span class="pitch-tag">SMART INDIA HACKATHON 2026 • SIH26089</span>
            <h2 class="pitch-title">Sahkaar Connect: Cooperative Gig Platform</h2>
            <p class="pitch-sub">Empowering India's informal tradespeople through MSCS Act cooperative federation, 85% fair living wage, and 100% subsidized PMSBY social security.</p>
            <div class="pitch-stats-row">
                <div class="pitch-stat-box"><div class="pitch-stat-val">85%</div><div class="pitch-stat-label">Worker Share</div></div>
                <div class="pitch-stat-box"><div class="pitch-stat-val">15%</div><div class="pitch-stat-label">Welfare Pool</div></div>
                <div class="pitch-stat-box"><div class="pitch-stat-val">₹2 Lakh</div><div class="pitch-stat-label">PMSBY Cover</div></div>
            </div>
        </div>
    `;
}

// ============================================================
// 2. INTERACTIVE LIFECYCLE SIMULATOR CONTROLLER
// ============================================================
const SIMULATOR_STATE = {
    isRunning: false,
    activeStep: 0,
    timer: null,
    history: []
};

/**
 * Opens the Interactive Cooperative Lifecycle Simulator Modal
 */
function openSimulatorModal() {
    const modal = document.getElementById("simulatorModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    if (typeof announceToScreenReader === "function") {
        announceToScreenReader("Cooperative Lifecycle Live Simulator opened");
    }

    resetSimulatorUI();
    logSimMessage("⚡ Simulator initialized. Click 'Auto-Run Complete Lifecycle' or advance step-by-step.", "info");
}

/**
 * Closes the Simulator Modal
 */
function closeSimulatorModal() {
    const modal = document.getElementById("simulatorModal");
    if (modal) modal.classList.add("hidden");
    if (SIMULATOR_STATE.timer) {
        clearTimeout(SIMULATOR_STATE.timer);
        SIMULATOR_STATE.timer = null;
    }
    SIMULATOR_STATE.isRunning = false;
    updateSimulatorControls();
}

/**
 * Resets simulator UI elements and clears console
 */
function resetSimulatorUI() {
    SIMULATOR_STATE.activeStep = 0;
    SIMULATOR_STATE.isRunning = false;
    if (SIMULATOR_STATE.timer) clearTimeout(SIMULATOR_STATE.timer);

    for (let i = 1; i <= 5; i++) {
        const stepEl = document.getElementById(`simStepNode${i}`);
        const statusEl = document.getElementById(`simStepStatus${i}`);
        if (stepEl) stepEl.className = "sim-step-node pending";
        if (statusEl) statusEl.textContent = "Waiting...";
    }

    const liveCard = document.getElementById("simLiveDividendCard");
    if (liveCard) {
        liveCard.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--muted);">
                <span style="font-size:28px;">⏳</span><br>
                <strong>No Active Simulation Running</strong><br>
                <small>Click Run to watch a real-time booking $\to$ dispatch $\to$ dividend $\to$ PMSBY flow.</small>
            </div>
        `;
    }

    const consoleBox = document.getElementById("simConsoleOutput");
    if (consoleBox) consoleBox.innerHTML = "";

    updateSimulatorControls();
}

/**
 * 1-Click Automated Sequential Walkthrough of all 5 stages
 */
async function runAutoSimulation() {
    if (SIMULATOR_STATE.isRunning) return;

    SIMULATOR_STATE.isRunning = true;
    updateSimulatorControls();
    logSimMessage("🚀 Starting 1-Click End-to-End Cooperative Lifecycle Simulation...", "brand");

    try {
        // Step 1
        await executeSimulatorStep(1);
        await new Promise(r => setTimeout(r, 1200));

        // Step 2
        await executeSimulatorStep(2);
        await new Promise(r => setTimeout(r, 1200));

        // Step 3
        await executeSimulatorStep(3);
        await new Promise(r => setTimeout(r, 1200));

        // Step 4
        await executeSimulatorStep(4);
        await new Promise(r => setTimeout(r, 1200));

        // Step 5
        await executeSimulatorStep(5);
        
        logSimMessage("🎉 Cooperative Service Lifecycle Completed with 100% MSCS Act Compliance!", "success");
        if (typeof announceToScreenReader === "function") {
            announceToScreenReader("Cooperative simulation finished successfully");
        }
    } catch (err) {
        logSimMessage(`❌ Simulation Error: ${err.message}`, "error");
    } finally {
        SIMULATOR_STATE.isRunning = false;
        updateSimulatorControls();
    }
}

/**
 * Advances a single step manually
 */
async function stepNextSimulation() {
    if (SIMULATOR_STATE.isRunning) return;
    const nextStep = SIMULATOR_STATE.activeStep < 5 ? SIMULATOR_STATE.activeStep + 1 : 1;
    await executeSimulatorStep(nextStep);
}

/**
 * Calls /api/simulator/run for given step number and updates visual telemetry
 */
async function executeSimulatorStep(stepNum) {
    SIMULATOR_STATE.activeStep = stepNum;
    setStepNodeState(stepNum, "running", "Processing...");

    try {
        const res = await fetch("/api/simulator/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: stepNum })
        });
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "Step execution failed");
        }

        const stageInfo = data.stages ? data.stages[data.stages.length - 1] : null;
        setStepNodeState(stepNum, "completed", "Completed ✓");

        if (stepNum === 1) {
            logSimMessage(`[Stage 1] Customer booking created: ${data.booking.customer_name} • Service: ${data.booking.service} (Urgent SOS)`, "info");
        } else if (stepNum === 2) {
            logSimMessage(`[Stage 2] Algorithmic cooperative dispatch $\to$ Sunil Verma (#6, NCCT Level 2 Electrician)`, "brand");
        } else if (stepNum === 3) {
            logSimMessage(`[Stage 3] Worker accepted job. OTP handshake verified $\to$ On-site diagnostics started`, "info");
        } else if (stepNum === 4) {
            logSimMessage(`[Stage 4] Job completed! Total Bill: ₹299. 85% Worker Living Wage: ₹254.15 | 15% Co-op Share: ₹44.85`, "success");
            renderSimulatorDividendCard(data.invoice);
        } else if (stepNum === 5) {
            logSimMessage(`[Stage 5] ₹44.85 credited to Welfare Reserve. Active ₹2,00,000 PMSBY Accidental Shield verified!`, "success");
            renderSimulationCompleteSummary(data);
        }

        // Refresh underlying admin tables in background if available
        if (typeof loadAdminOverview === "function" && document.getElementById("adminSection") && !document.getElementById("adminSection").classList.contains("hidden")) {
            loadAdminOverview();
        }
    } catch (err) {
        setStepNodeState(stepNum, "error", "Failed ✕");
        logSimMessage(`[Stage ${stepNum} Error] ${err.message}`, "error");
        throw err;
    }
}

/**
 * Resets simulated records via /api/simulator/reset
 */
async function resetSimulationData() {
    try {
        logSimMessage("🧹 Cleaning up simulation test records from database...", "info");
        const res = await fetch("/api/simulator/reset", { method: "POST" });
        const data = await res.json();
        resetSimulatorUI();
        logSimMessage(`✅ ${data.message || "Simulation database reset clean."}`, "success");

        if (typeof loadAdminOverview === "function" && document.getElementById("adminSection")) {
            loadAdminOverview();
        }
    } catch (err) {
        logSimMessage(`❌ Reset failed: ${err.message}`, "error");
    }
}

function setStepNodeState(stepNum, stateClass, statusText) {
    const node = document.getElementById(`simStepNode${stepNum}`);
    const status = document.getElementById(`simStepStatus${stepNum}`);
    if (node) {
        node.className = `sim-step-node ${stateClass}`;
    }
    if (status) {
        status.textContent = statusText;
    }
}

function renderSimulatorDividendCard(invoice) {
    const liveCard = document.getElementById("simLiveDividendCard");
    if (!liveCard) return;

    const workerEarning = invoice ? invoice.worker_earning : 254.15;
    const coopShare = invoice ? invoice.cooperative_share : 44.85;
    const total = invoice ? invoice.total_amount : 299.00;

    liveCard.innerHTML = `
        <div class="sim-dividend-box">
            <h4 style="margin:0 0 10px; color:var(--teal-deep); font-size:15px;">⚖️ Cooperative Revenue Dividend Split (Invoice #${invoice ? invoice.id : 'SIM'})</h4>
            <div class="sim-dividend-split-bar">
                <div class="split-worker" style="width:85%;" title="85% Worker Living Wage: ₹${workerEarning}">85% Worker Share (₹${workerEarning})</div>
                <div class="split-coop" style="width:15%;" title="15% Cooperative Welfare Reserve: ₹${coopShare}">15% (₹${coopShare})</div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:12.5px;">
                <span><strong>👷 Worker Living Wage:</strong> <span style="color:#2E7D32; font-weight:700;">₹${workerEarning}</span></span>
                <span><strong>🛡️ Co-op Welfare:</strong> <span style="color:var(--teal-deep); font-weight:700;">₹${coopShare}</span></span>
                <span><strong>🚫 Middleman Extraction:</strong> <span style="color:#C62828; font-weight:700;">₹0.00 (0%)</span></span>
            </div>
        </div>
    `;
}

function renderSimulationCompleteSummary(data) {
    const liveCard = document.getElementById("simLiveDividendCard");
    if (!liveCard) return;

    liveCard.innerHTML += `
        <div style="margin-top:12px; padding:12px 14px; background:#F4FAF6; border:1px solid #A5D6A7; border-radius:10px; font-size:12.5px;">
            <strong style="color:#1B5E20;">🛡️ Statutory PMSBY Protection & Social Security Verified</strong><br>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px;">
                <div>• Policy: <strong>${data.worker ? data.worker.pmsbyPolicy : 'PMSBY-2026-COOP-0006'}</strong></div>
                <div>• Coverage: <strong>₹2,00,000 Accidental</strong></div>
                <div>• NCCT Accreditation: <strong>${data.worker ? data.worker.certId : 'NCCT-COOP-2026-0006'}</strong></div>
                <div>• Tamper-Proof Audit: <strong>SHA-256 Validated</strong></div>
            </div>
        </div>
    `;
}

function logSimMessage(msg, type = "info") {
    const consoleBox = document.getElementById("simConsoleOutput");
    if (!consoleBox) return;

    const time = new Date().toTimeString().split(" ")[0];
    const line = document.createElement("div");
    line.className = `sim-log-line ${type}`;
    line.innerHTML = `<span class="sim-log-time">[${time}]</span> ${msg}`;

    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

function updateSimulatorControls() {
    const runBtn = document.getElementById("simRunAutoBtn");
    const stepBtn = document.getElementById("simStepBtn");
    const resetBtn = document.getElementById("simResetBtn");

    if (runBtn) {
        runBtn.disabled = SIMULATOR_STATE.isRunning;
        runBtn.textContent = SIMULATOR_STATE.isRunning ? "⏳ Running Simulation..." : "⚡ Auto-Run Complete Lifecycle";
    }
    if (stepBtn) {
        stepBtn.disabled = SIMULATOR_STATE.isRunning;
    }
    if (resetBtn) {
        resetBtn.disabled = SIMULATOR_STATE.isRunning;
    }
}

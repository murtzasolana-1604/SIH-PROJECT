// ============================================================
// SAHKAAR SAATHI (सहकार साथी) - 24/7 Cooperative AI Assistant
// SIH26089 • Smart India Hackathon 2026
// Bilingual local NLP assistant with 1-click action triggers & voice
// ============================================================

let isChatbotOpen = false;
let isTtsEnabled = false;
let isChatbotListening = false;

/**
 * Initialize Sahkaar Saathi Widget
 */
function initSahkaarSaathi() {
    loadChatbotPrompts();

    // Check saved TTS preference
    isTtsEnabled = localStorage.getItem("sahkaar_saathi_tts") === "1";
    updateTtsToggleButton();

    // Handle Enter key in chat input
    const input = document.getElementById("sahkaarSaathiInput");
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatbotMessage();
            }
        });
    }
}

/**
 * Toggles Chatbot Drawer open / closed
 */
function toggleSahkaarSaathi() {
    const drawer = document.getElementById("sahkaarSaathiDrawer");
    const fab = document.getElementById("sahkaarSaathiFab");
    const ping = document.getElementById("sahkaarSaathiPing");

    if (!drawer) return;

    isChatbotOpen = !isChatbotOpen;

    if (isChatbotOpen) {
        drawer.classList.add("open");
        if (ping) ping.style.display = "none";
        const input = document.getElementById("sahkaarSaathiInput");
        if (input) setTimeout(() => input.focus(), 150);
    } else {
        drawer.classList.remove("open");
    }
}

/**
 * Loads starter prompts from backend based on role and language
 */
async function loadChatbotPrompts() {
    try {
        const lang = localStorage.getItem("sahkaar_lang") || "en";
        const role = localStorage.getItem("sahkaar_role") || "customer";

        const res = await fetch(`/api/chatbot/prompts?lang=${encodeURIComponent(lang)}&role=${encodeURIComponent(role)}`);
        if (!res.ok) return;

        const data = await res.json();
        renderChatbotSuggestions(data.prompts || []);
    } catch (err) {
        console.warn("Could not load chatbot starter prompts:", err);
    }
}

/**
 * Renders quick reply suggestion chips
 */
function renderChatbotSuggestions(suggestions) {
    const container = document.getElementById("sahkaarSaathiSuggestions");
    if (!container) return;

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = suggestions.map(text => `
        <button type="button" class="saathi-suggestion-chip" onclick="handleSuggestionClick('${escapeHtml(text)}')">
            ${escapeHtml(text)}
        </button>
    `).join("");
}

function handleSuggestionClick(text) {
    const input = document.getElementById("sahkaarSaathiInput");
    if (input) {
        input.value = text;
        sendChatbotMessage();
    }
}

/**
 * Send user message to Sahkaar Saathi backend
 */
async function sendChatbotMessage() {
    const input = document.getElementById("sahkaarSaathiInput");
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Append user message to chat UI
    appendChatMessage("user", message);
    input.value = "";

    // Show typing indicator
    showChatbotTyping();

    const lang = localStorage.getItem("sahkaar_lang") || "en";
    const role = localStorage.getItem("sahkaar_role") || "customer";

    try {
        const res = await fetch("/api/chatbot/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                language: lang,
                role: role
            })
        });

        removeChatbotTyping();

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            appendChatMessage("bot", lang === "hi" 
                ? "क्षमा करें, संदेश संसाधित करने में समस्या हुई। कृपया पुनः प्रयास करें।"
                : "Sorry, I had trouble processing that request. Please try again.");
            return;
        }

        const data = await res.json();

        // Append bot reply with optional interactive action button
        appendChatMessage("bot", data.reply, data.action);

        // Update suggestion chips
        if (data.suggestions && data.suggestions.length > 0) {
            renderChatbotSuggestions(data.suggestions);
        }

        // Voice Readout if enabled
        if (isTtsEnabled && typeof speak === "function") {
            const cleanText = data.reply.replace(/[*#_`]/g, "").replace(/\n+/g, " ");
            speak(cleanText, lang);
        }

    } catch (err) {
        console.error("Chatbot request failed:", err);
        removeChatbotTyping();
        appendChatMessage("bot", "Network connection issue. Please verify server connectivity.");
    }
}

/**
 * Appends a message bubble to the chat container
 */
function appendChatMessage(sender, text, action = null) {
    const messagesEl = document.getElementById("sahkaarSaathiMessages");
    if (!messagesEl) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const bubble = document.createElement("div");
    bubble.className = `saathi-message ${sender}`;

    // Format basic markdown (bold, bullets)
    const formattedText = formatChatbotText(text);

    let actionHtml = "";
    if (action && action.type) {
        actionHtml = `
            <div class="saathi-action-container">
                <button type="button" class="saathi-action-btn" onclick="dispatchChatbotAction('${escapeHtml(JSON.stringify(action))}')">
                    ${escapeHtml(action.label || "Take Action")}
                </button>
            </div>
        `;
    }

    bubble.innerHTML = `
        <div class="saathi-bubble">
            <div class="saathi-text">${formattedText}</div>
            ${actionHtml}
            <div class="saathi-time">${time}</div>
        </div>
    `;

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Formats Markdown bolding and line breaks for display
 */
function formatChatbotText(text) {
    if (!text) return "";
    let escaped = escapeHtml(text);
    // Convert **bold** to <strong>
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Convert newlines to <br>
    escaped = escaped.replace(/\n/g, "<br>");
    return escaped;
}

function showChatbotTyping() {
    const messagesEl = document.getElementById("sahkaarSaathiMessages");
    if (!messagesEl) return;

    const typing = document.createElement("div");
    typing.id = "saathiTypingIndicator";
    typing.className = "saathi-message bot typing";
    typing.innerHTML = `
        <div class="saathi-bubble">
            <div class="saathi-typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeChatbotTyping() {
    const typing = document.getElementById("saathiTypingIndicator");
    if (typing) typing.remove();
}

/**
 * Executes UI action directly from bot message
 */
function dispatchChatbotAction(actionJsonStr) {
    try {
        const action = JSON.parse(actionJsonStr);
        const lang = localStorage.getItem("sahkaar_lang") || "en";

        if (action.type === "OPEN_BOOKING" && action.service) {
            if (typeof openBooking === "function") {
                openBooking(action.service);
                toggleSahkaarSaathi(); // minimize chat so user can fill form
                if (typeof speak === "function" && isTtsEnabled) {
                    speak(lang === "hi" 
                        ? `${action.service} के लिए बुकिंग फॉर्म खोला गया है` 
                        : `Opening booking form for ${action.service}`);
                }
            }
        } else if (action.type === "OPEN_SOS") {
            if (typeof openEmergencySOSModal === "function") {
                openEmergencySOSModal();
                toggleSahkaarSaathi();
            }
        } else if (action.type === "SHOW_SERVICES") {
            if (typeof showServices === "function") {
                showServices();
                toggleSahkaarSaathi();
            }
        } else if (action.type === "SHOW_MY_BOOKINGS") {
            if (typeof showMyBookings === "function") {
                showMyBookings();
                toggleSahkaarSaathi();
            }
        } else if (action.type === "SHOW_WORKER_DASHBOARD") {
            if (typeof showWorkerDashboard === "function") {
                showWorkerDashboard();
                toggleSahkaarSaathi();
            }
        }
    } catch (err) {
        console.error("Failed to dispatch chatbot action:", err);
    }
}

/**
 * Voice Input inside Chatbot via Web Speech API
 */
function startChatbotVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const lang = localStorage.getItem("sahkaar_lang") || "en";

    if (!SpeechRecognition) {
        alert(lang === "hi" 
            ? "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया क्रोम का उपयोग करें।" 
            : "Voice input is not supported in this browser. Try Chrome.");
        return;
    }

    const micBtn = document.getElementById("sahkaarSaathiMicBtn");
    const input = document.getElementById("sahkaarSaathiInput");

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;

    if (micBtn) {
        micBtn.classList.add("recording");
        micBtn.title = lang === "hi" ? "सुन रहे हैं..." : "Listening...";
    }

    recognition.onresult = function (event) {
        const spoken = event.results[0][0].transcript;
        if (input) {
            input.value = spoken;
            // Automatically submit after a quick delay
            setTimeout(() => sendChatbotMessage(), 300);
        }
    };

    recognition.onerror = function () {
        if (micBtn) {
            micBtn.classList.remove("recording");
            micBtn.title = "Voice Input";
        }
    };

    recognition.onend = function () {
        if (micBtn) {
            micBtn.classList.remove("recording");
            micBtn.title = "Voice Input";
        }
    };

    recognition.start();
}

/**
 * Toggles Text-To-Speech (TTS) voice readout
 */
function toggleChatbotTts() {
    isTtsEnabled = !isTtsEnabled;
    localStorage.setItem("sahkaar_saathi_tts", isTtsEnabled ? "1" : "0");
    updateTtsToggleButton();

    const lang = localStorage.getItem("sahkaar_lang") || "en";
    if (isTtsEnabled && typeof speak === "function") {
        speak(lang === "hi" ? "आवाज चालू की गई" : "Voice readout enabled", lang);
    }
}

function updateTtsToggleButton() {
    const btn = document.getElementById("sahkaarSaathiTtsToggle");
    if (!btn) return;
    if (isTtsEnabled) {
        btn.textContent = "🔊";
        btn.classList.add("active");
        btn.title = "Voice readout: ON";
    } else {
        btn.textContent = "🔇";
        btn.classList.remove("active");
        btn.title = "Voice readout: OFF";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    initSahkaarSaathi();
});

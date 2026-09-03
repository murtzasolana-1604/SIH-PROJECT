// =========================
// VOICE FEATURES (Web Speech API).
// Works best in Chrome. Fails gracefully everywhere else.
// =========================

function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
}

function startVoiceBooking() {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice input isn't supported in this browser. Try Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    const micBtn = document.getElementById("voiceBookBtn");
    micBtn.textContent = "🎙️ Listening...";

    recognition.onresult = function (event) {

        const spoken = event.results[0][0].transcript.toLowerCase();

        const knownServices = [
            "electrician", "plumber", "carpenter", "painter",
            "cleaner", "driver", "caregiver", "technician"
        ];

        const matched = knownServices.find(s => spoken.includes(s));

        if (matched) {
            const serviceName = matched.charAt(0).toUpperCase() + matched.slice(1);
            openBooking(serviceName);
            speak(`Opening booking for ${serviceName}`);
        } else {
            alert(`Heard: "${spoken}" — couldn't match it to a known service. Try saying a service name like "electrician".`);
        }
    };

    recognition.onerror = function () {
        micBtn.textContent = "🎤 Speak a Service";
    };

    recognition.onend = function () {
        micBtn.textContent = "🎤 Speak a Service";
    };

    recognition.start();
}
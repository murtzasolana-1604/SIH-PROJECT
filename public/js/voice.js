// =========================
// VOICE FEATURES (Web Speech API).
// Works best in Chrome. Fails gracefully everywhere else.
// Bilingual support: Hindi (hi-IN) and English (en-IN).
// =========================

function speak(text, lang) {
    if (!("speechSynthesis" in window)) return;
    const currentLang = lang || localStorage.getItem("sahkaar_lang") || "en";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
}

function startVoiceBooking() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const currentLang = localStorage.getItem("sahkaar_lang") || "en";

    if (!SpeechRecognition) {
        alert(currentLang === "hi"
            ? "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया क्रोम का उपयोग करें।"
            : "Voice input isn't supported in this browser. Try Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;

    const micBtn = document.getElementById("voiceBookBtn");
    if (micBtn) {
        micBtn.textContent = currentLang === "hi" ? "🎙️ सुन रहे हैं..." : "🎙️ Listening...";
    }

    recognition.onresult = function (event) {
        const spoken = event.results[0][0].transcript.toLowerCase();

        // Bilingual keyword mapping to standard service names
        const serviceMap = [
            { name: "Electrician", keywords: ["electrician", "bijli", "बिजली", "इलेक्ट्रीशियन", "current", "wire", "वायर"] },
            { name: "Plumber", keywords: ["plumber", "नल", "प्लंबर", "paani", "पानी", "leak", "लीक", "pipe", "पाइप"] },
            { name: "Carpenter", keywords: ["carpenter", "बढ़ई", "कारपेंटर", "wood", "लकड़ी", "darwaza", "दरवाजा", "furniture", "फर्नीचर"] },
            { name: "Painter", keywords: ["painter", "पेंटर", "रंग", "पुताई", "paint", "रंगाई"] },
            { name: "Cleaner", keywords: ["cleaner", "सफाई", "क्लीनर", "झाड़ू", "पोछा", "cleaning", "स्वच्छता"] },
            { name: "Driver", keywords: ["driver", "ड्राइवर", "गाड़ी", "चालक", "car", "कार"] },
            { name: "Caregiver", keywords: ["caregiver", "देखभाल", "केयरगिवर", "तीमारदार", "मरीज", "बुजुर्ग"] },
            { name: "Technician", keywords: ["technician", "तकनीशियन", "मिस्त्री", "repair", "रिपेयर", "ac", "एसी"] }
        ];

        let matchedService = null;
        for (const item of serviceMap) {
            if (item.keywords.some(kw => spoken.includes(kw.toLowerCase()))) {
                matchedService = item.name;
                break;
            }
        }

        if (matchedService) {
            openBooking(matchedService);
            const speakMsg = currentLang === "hi"
                ? `${matchedService} सेवा के लिए बुकिंग खोली जा रही है`
                : `Opening booking for ${matchedService}`;
            speak(speakMsg, currentLang);
        } else {
            const notFoundMsg = currentLang === "hi"
                ? `सुना: "${spoken}" — किसी ज्ञात सेवा से मेल नहीं खाया। कृपया "इलेक्ट्रीशियन" या "प्लंबर" बोलकर प्रयास करें।`
                : `Heard: "${spoken}" — couldn't match it to a known service. Try saying a service name like "Electrician".`;
            alert(notFoundMsg);
        }
    };

    recognition.onerror = function () {
        if (micBtn) {
            micBtn.textContent = currentLang === "hi" ? "🎤 बोलकर सेवा चुनें" : "🎤 Speak a Service";
        }
    };

    recognition.onend = function () {
        if (micBtn) {
            micBtn.textContent = currentLang === "hi" ? "🎤 बोलकर सेवा चुनें" : "🎤 Speak a Service";
        }
    };

    recognition.start();
}
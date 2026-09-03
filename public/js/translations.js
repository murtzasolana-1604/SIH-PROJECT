const translations = {
    en: {
        appTitle: "🤝 Sahkaar Connect",
        appSubtitle: "Cooperative Gig Services Platform",
        welcomeTitle: "Trusted Local Services",
        welcomeText: "Connect with verified cooperative workers for household and community services.",
        btnFindService: "🔎 Find a Service",
        btnJoinWorker: "👷 Join as a Worker",
        btnMyBookings: "📖 My Bookings",
        btnWorkerDashboard: "🛠️ Worker Dashboard",
        btnAdmin: "🏛️ Federation Admin",
        chooseService: "Choose a Service",
        bookService: "📅 Book Service",
        registerWorker: "👷 Register as a Worker",
        myBookingsTitle: "📖 My Bookings",
        workerDashboardTitle: "🛠️ Worker Dashboard",
        adminTitle: "🏛️ Federation Admin Dashboard",
        footer: "SIH26089 • Smart Automation • HacNova"
    },
    hi: {
        appTitle: "🤝 सहकार कनेक्ट",
        appSubtitle: "सहकारी गिग सेवा मंच",
        welcomeTitle: "भरोसेमंद स्थानीय सेवाएं",
        welcomeText: "घरेलू और सामुदायिक सेवाओं के लिए सत्यापित सहकारी कामगारों से जुड़ें।",
        btnFindService: "🔎 सेवा खोजें",
        btnJoinWorker: "👷 कामगार के रूप में जुड़ें",
        btnMyBookings: "📖 मेरी बुकिंग",
        btnWorkerDashboard: "🛠️ कामगार डैशबोर्ड",
        btnAdmin: "🏛️ फेडरेशन एडमिन",
        chooseService: "सेवा चुनें",
        bookService: "📅 सेवा बुक करें",
        registerWorker: "👷 कामगार के रूप में पंजीकरण करें",
        myBookingsTitle: "📖 मेरी बुकिंग",
        workerDashboardTitle: "🛠️ कामगार डैशबोर्ड",
        adminTitle: "🏛️ फेडरेशन एडमिन डैशबोर्ड",
        footer: "SIH26089 • स्मार्ट ऑटोमेशन • HacNova"
    }
};

function applyLanguage(lang) {
    localStorage.setItem("sahkaar_lang", lang);
    const dict = translations[lang] || translations.en;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) el.textContent = dict[key];
    });

    const toggleBtn = document.getElementById("langToggle");
    if (toggleBtn) toggleBtn.textContent = lang === "en" ? "हिंदी" : "English";
}

function toggleLanguage() {
    const current = localStorage.getItem("sahkaar_lang") || "en";
    applyLanguage(current === "en" ? "hi" : "en");
}

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("sahkaar_lang") || "en";
    applyLanguage(saved);
});
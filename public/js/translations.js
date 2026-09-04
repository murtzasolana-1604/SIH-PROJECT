const translations = {
    en: {
        appTitle: "🤝 Sahkaar Connect",
        appSubtitle: "Cooperative Gig Services Platform",
        coopInitiative: "Ministry of Cooperation • National Council for Cooperative Training (NCCT)",
        problemStatement: "Problem Statement SIH26089 • Labour Cooperative Services",
        welcomeTitle: "Trusted Local Services",
        welcomeText: "Connect with verified cooperative workers for household and community services with guaranteed fair wages and zero private middleman commissions.",
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
        adminTitle: "🏛️ Federation Admin Command Center",
        footer: "SIH26089 • Smart India Hackathon 2026 • Ministry of Cooperation / NCCT",

        // Role Switcher
        roleSelectTitle: "Choose Your Sahkaar Portal",
        roleSelectSub: "Empowering local gig workers and citizens through democratic cooperative societies.",
        roleCustomerTitle: "👤 Citizen / Customer Portal",
        roleCustomerDesc: "Book verified tradespeople, track emergency calls, and enjoy 100% transparent pricing without private surge multipliers.",
        roleCustomerAction: "Enter Customer Portal →",
        roleWorkerTitle: "👷 Cooperative Worker Portal",
        roleWorkerDesc: "Receive steady local jobs, keep 85% direct take-home earnings, and access PM Suraksha Bima cooperative insurance.",
        roleWorkerAction: "Enter Worker Portal →",
        roleAdminTitle: "🏛️ Federation Admin Center",
        roleAdminDesc: "Monitor cooperative dispatch allocations, verify certified tradespeople, and inspect welfare fund balances.",
        roleAdminAction: "Enter Admin Center →",

        // Authentication & Login
        loginCustomerTitle: "👤 Citizen & Customer Login",
        loginWorkerTitle: "👷 Cooperative Worker Member Login",
        loginAdminTitle: "🏛️ Federation Administrator Login",
        phoneLabel: "Mobile Phone Number",
        phonePlaceholder: "10-digit mobile number",
        btnSendOtp: "📲 Send Secure OTP",
        otpLabel: "Enter 6-Digit OTP",
        otpPlaceholder: "6-digit OTP (Demo: 123456)",
        btnVerifyOtp: "🔐 Verify & Continue",
        btnBack: "← Back",
        demoOtpHint: "💡 Demo Evaluation: Enter 123456 as verification code.",
        btnLogout: "🚪 Logout",
        btnSwitchRole: "🔄 Switch Role",

        // Customer Dashboard & Form
        customerPortalBadge: "👤 Customer Portal",
        welcomeBack: "Welcome back",
        gpsSynced: "GPS Synced",
        btnUpdateLocation: "📍 Update Location",
        emergencyBannerTitle: "EMERGENCY REQUEST MODE",
        emergencyBannerSub: "Prioritizes immediate dispatch for urgent household crises (pipe bursts, power outages, leaks).",
        btnSosCall: "🚨 1-Click SOS Call",
        fairWageEstimate: "Fair Wage Estimate:",
        coopVerified: "🤝 NCCT Cooperative Verified",
        coopPricingNote: "Zero exploitative private middleman commission — platform runs on a transparent cooperative model: 85% to worker, 15% to NCCT welfare fund.",
        selectedServiceLabel: "Selected Service",
        customerNameLabel: "Your Full Name",
        customerNamePlaceholder: "Enter your full name",
        customerPhoneLabel: "Phone Number",
        customerAddressLabel: "Service Delivery Address",
        customerAddressPlaceholder: "Enter complete service address",
        btnSyncGps: "📍 Sync Current GPS Location",
        bookingDateLabel: "Service Date",
        bookingTimeLabel: "Preferred Time",
        btnConfirmBooking: "📅 Confirm Cooperative Booking",

        // SOS Emergency Modal
        sosModalTitle: "🚨 1-Click Emergency SOS Call",
        sosModalSub: "Instant priority broadcast to verified, available cooperative tradespeople near your location with target 15-30m response.",
        sosCrisisTitle: "Select Urgent Crisis Type:",
        sosPowerTitle: "Power Outage / Sparks",
        sosPowerSub: "Electrician • Urgent",
        sosPipeTitle: "Pipe Burst / Flooding",
        sosPipeSub: "Plumber • Urgent",
        sosLockoutTitle: "Door Jam / Lockout",
        sosLockoutSub: "Carpenter • Urgent",
        sosApplianceTitle: "Appliance Hazard",
        sosApplianceSub: "Technician • Urgent",
        btnAutoLockGps: "📍 Auto-Lock GPS",
        sosBasePriceLabel: "Base Cooperative Fair Wage:",
        sosRapidSurchargeLabel: "Rapid Mobilization Surcharge:",
        sosTotalBillLabel: "Total Emergency Bill:",
        sosPricingGuarantee: "🛡️ Fixed ₹50 rapid mobilization fee • Zero surge multiplier • Target response SLA: 15–30 mins.",
        btnActivateSos: "🚨 ACTIVATE EMERGENCY DISPATCH NOW",

        // Worker Portal & Ledger
        workerPortalBadge: "👷 Worker Portal",
        availabilityStatusLabel: "Live Availability Status:",
        statusAvailable: "AVAILABLE FOR JOBS",
        statusBusy: "BUSY / ON LEAVE",
        btnGoBusy: "⏸️ Switch to Busy",
        btnGoAvailable: "✓ Switch to Available",
        earningsLedgerTitle: "💰 Cooperative Earnings Ledger",
        jobsCompletedChip: "Jobs Completed",
        todayEarnings: "Today's Earnings",
        weekEarnings: "This Week",
        coopShare15: "Coop Share (15%)",
        netTakeHome: "Net Take-Home (85%)",
        ledgerNote: "Transparent cooperative ledger: zero private middleman commission — 85% directly to you, 15% to NCCT welfare fund.",
        myActiveJobsTitle: "My Active Jobs",
        incomingJobsTitle: "Incoming Available Jobs",
        btnStartJob: "⚡ Start Job (In Progress)",
        btnMarkComplete: "✅ Mark Complete & Generate Invoice",
        btnAcceptJob: "Accept Job",
        btnPassJob: "Pass / Decline",
        busyAlertBanner: "⏸️ You are currently marked as BUSY / ON LEAVE. Switch your status above to AVAILABLE to accept new jobs.",
        completedSettlementTitle: "Completed Jobs & Settlement Status",

        // Cooperative Invoicing & Payment
        officialInvoice: "OFFICIAL COOPERATIVE INVOICE",
        officialSettlement: "OFFICIAL COOPERATIVE SETTLEMENT",
        paymentPendingBadge: "⏳ Payment Pending",
        settledBadge: "SETTLED & VERIFIED",
        baseServiceDelivery: "Base Service Delivery:",
        emergencySurchargeText: "🚨 Emergency Priority Dispatch Surcharge:",
        workerDirectEarning: "👷 Worker Direct Earning (85%):",
        coopWelfareShareText: "🏛️ Cooperative Welfare & Training Fund (15%):",
        totalAmountDue: "Total Amount Due:",
        totalAmountPaid: "Total Settled Amount:",
        selectPaymentMethod: "Select Payment Settlement Method:",
        payMethodUpi: "📱 UPI / QR Code",
        payMethodCash: "💵 Cash on Completion",
        payMethodCredit: "🏛️ Cooperative Credit",
        upiScanNote: "Scan & Pay via any UPI App (GPay, PhonePe, Paytm, BHIM)",
        cashHandoverNote: "💵 Cash on Completion: Please pay directly to your verified cooperative partner after inspecting completed service.",
        creditAccountNote: "🏛️ Cooperative Society Credit: Settle directly against your verified Sahkaar member cooperative account balance.",
        btnSettlePayment: "💳 Settle Payment",
        btnViewReceipt: "🖨️ View & Print Official Receipt",

        // Ratings & Feedback
        rateServiceHeading: "⭐ Rate Your Cooperative Service",
        tagPunctual: "⏱️ Punctual",
        tagSkilled: "🛠️ Skilled",
        tagCooperative: "🤝 Cooperative",
        tagCleanWork: "🧹 Clean Work",
        tagHonestPricing: "💡 Honest Pricing",
        btnSubmitReview: "🤝 Submit Verified Review",
        verifiedReviewBadge: "✅ Verified Cooperative Review",
        memberRatingsHeading: "⭐ Member Ratings & Feedback",

        // Admin Dashboard
        adminBannerTitle: "🏛️ Cooperative Federation Control Center",
        adminBannerSub: "Monitoring real-time gig service dispatch, cooperative member verification, and welfare security pools.",
        tabOverview: "📊 Federation Overview",
        tabWorkers: "👷 Worker Verification & Roster",
        tabBookings: "📋 Booking Allocations & Dispatch",
        tabEmergency: "🚨 Emergency SLA Queue",
        tabForecast: "📈 NCCT Demand Forecast",
        metricsHeading: "Key Cooperative Metrics & Performance",
        emergencyQueueHeading: "🚨 Emergency Rapid Dispatch & Response SLA Monitor",
        btnRefreshQueue: "🔄 Refresh Queue"
    },
    hi: {
        appTitle: "🤝 सहकार कनेक्ट",
        appSubtitle: "सहकारी गिग सेवा मंच",
        coopInitiative: "सहकारिता मंत्रालय • राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)",
        problemStatement: "समस्या विवरण SIH26089 • श्रम सहकारी सेवाएं",
        welcomeTitle: "भरोसेमंद स्थानीय सेवाएं",
        welcomeText: "उचित पारदर्शी मजदूरी और शून्य निजी बिचौलिया कमीशन के साथ घरेलू व सामुदायिक सेवाओं के लिए सत्यापित सहकारी कामगारों से जुड़ें।",
        btnFindService: "🔎 सेवा खोजें",
        btnJoinWorker: "👷 कामगार के रूप में जुड़ें",
        btnMyBookings: "📖 मेरी बुकिंग",
        btnWorkerDashboard: "🛠️ कामगार डैशबोर्ड",
        btnAdmin: "🏛️ फेडरेशन एडमिन",
        chooseService: "सेवा चुनें",
        bookService: "📅 सेवा बुक करें",
        registerWorker: "👷 कामगार पंजीकरण",
        myBookingsTitle: "📖 मेरी बुकिंग और रसीदें",
        workerDashboardTitle: "🛠️ कामगार डैशबोर्ड",
        adminTitle: "🏛️ फेडरेशन एडमिन कंट्रोल सेंटर",
        footer: "SIH26089 • स्मार्ट इंडिया हैकाथॉन 2026 • सहकारिता मंत्रालय / NCCT",

        // Role Switcher
        roleSelectTitle: "सहकार कनेक्ट पोर्टल चुनें",
        roleSelectSub: "लोकतांत्रिक सहकारी समितियों के माध्यम से स्थानीय कामगारों और नागरिकों का सशक्तिकरण।",
        roleCustomerTitle: "👤 नागरिक / ग्राहक पोर्टल",
        roleCustomerDesc: "सत्यापित कामगार बुक करें, आपातकालीन सेवाएं प्राप्त करें, और बिना किसी निजी सर्ज मूल्य के 100% पारदर्शी दरें पाएं।",
        roleCustomerAction: "ग्राहक पोर्टल में प्रवेश करें →",
        roleWorkerTitle: "👷 सहकारी कामगार पोर्टल",
        roleWorkerDesc: "नियमित स्थानीय काम पाएं, 85% सीधी कमाई अपने पास रखें, और पीएम सुरक्षा बीमा का सहकारी संरक्षण प्राप्त करें।",
        roleWorkerAction: "कामगार पोर्टल में प्रवेश करें →",
        roleAdminTitle: "🏛️ फेडरेशन एडमिन केंद्र",
        roleAdminDesc: "सहकारी सेवा आवंटन की निगरानी करें, प्रमाणित कामगारों को सत्यापित करें, और कल्याण कोष का निरीक्षण करें।",
        roleAdminAction: "एडमिन केंद्र में प्रवेश करें →",

        // Authentication & Login
        loginCustomerTitle: "👤 नागरिक और ग्राहक लॉगिन",
        loginWorkerTitle: "👷 सहकारी कामगार सदस्य लॉगिन",
        loginAdminTitle: "🏛️ फेडरेशन एडमिनिस्ट्रेटर लॉगिन",
        phoneLabel: "मोबाइल फोन नंबर",
        phonePlaceholder: "10-अंकीय मोबाइल नंबर",
        btnSendOtp: "📲 सुरक्षित ओटीपी भेजें",
        otpLabel: "6-अंकीय ओटीपी दर्ज करें",
        otpPlaceholder: "6-अंकीय ओटीपी (डेमो: 123456)",
        btnVerifyOtp: "🔐 सत्यापित करें और आगे बढ़ें",
        btnBack: "← वापस",
        demoOtpHint: "💡 मूल्यांकन डेमो: सत्यापन के लिए 123456 दर्ज करें।",
        btnLogout: "🚪 लॉगआउट",
        btnSwitchRole: "🔄 भूमिका बदलें",

        // Customer Dashboard & Form
        customerPortalBadge: "👤 ग्राहक पोर्टल",
        welcomeBack: "वापसी पर स्वागत है",
        gpsSynced: "जीपीएस सिंक हुआ",
        btnUpdateLocation: "📍 लोकेशन अपडेट करें",
        emergencyBannerTitle: "आपातकालीन सेवा मोड",
        emergencyBannerSub: "घरेलू संकट (पाइप फटना, बिजली गुल, लीकेज) के लिए तत्काल प्राथमिकता आवंटन।",
        btnSosCall: "🚨 1-क्लिक एसओएस कॉल",
        fairWageEstimate: "उचित सहकारी मजदूरी:",
        coopVerified: "🤝 NCCT सहकारी सत्यापित",
        coopPricingNote: "शून्य निजी बिचौलिया कमीशन — मंच एक पारदर्शी सहकारी मॉडल पर चलता है: 85% कामगार को, 15% NCCT कल्याण कोष में।",
        selectedServiceLabel: "चयनित सेवा",
        customerNameLabel: "आपका पूरा नाम",
        customerNamePlaceholder: "अपना पूरा नाम दर्ज करें",
        customerPhoneLabel: "फोन नंबर",
        customerAddressLabel: "सेवा का पूरा पता",
        customerAddressPlaceholder: "मकान/सड़क/लैंडमार्क का पता दर्ज करें",
        btnSyncGps: "📍 वर्तमान जीपीएस लोकेशन सिंक करें",
        bookingDateLabel: "सेवा की तारीख",
        bookingTimeLabel: "पसंदीदा समय",
        btnConfirmBooking: "📅 सहकारी बुकिंग की पुष्टि करें",

        // SOS Emergency Modal
        sosModalTitle: "🚨 1-क्लिक आपातकालीन एसओएस कॉल",
        sosModalSub: "15-30 मिनट के लक्षित रिस्पॉन्स समय के साथ आपके निकटतम सत्यापित सहकारी कामगारों को त्वरित प्राथमिकता प्रसारण।",
        sosCrisisTitle: "आपातकालीन समस्या का प्रकार चुनें:",
        sosPowerTitle: "बिजली गुल / स्पार्क",
        sosPowerSub: "इलेक्ट्रीशियन • तत्काल",
        sosPipeTitle: "पाइप फटना / जलभराव",
        sosPipeSub: "प्लंबर • तत्काल",
        sosLockoutTitle: "ताला जाम / घर बंद",
        sosLockoutSub: "कारपेंटर • तत्काल",
        sosApplianceTitle: "उपकरण में आग / धुआं",
        sosApplianceSub: "तकनीशियन • तत्काल",
        btnAutoLockGps: "📍 जीपीएस ऑटो-लॉक करें",
        sosBasePriceLabel: "मूल सहकारी मजदूरी:",
        sosRapidSurchargeLabel: "त्वरित आवंटन अधिभार:",
        sosTotalBillLabel: "कुल आपातकालीन शुल्क:",
        sosPricingGuarantee: "🛡️ निश्चित ₹50 त्वरित शुल्क • शून्य निजी सर्ज मल्टीप्लायर • लक्षित समय: 15–30 मिनट।",
        btnActivateSos: "🚨 आपातकालीन सेवा अभी शुरू करें",

        // Worker Portal & Ledger
        workerPortalBadge: "👷 कामगार पोर्टल",
        availabilityStatusLabel: "कार्य उपलब्धता स्थिति:",
        statusAvailable: "काम के लिए उपलब्ध",
        statusBusy: "व्यस्त / अवकाश पर",
        btnGoBusy: "⏸️ व्यस्त मोड चालू करें",
        btnGoAvailable: "✓ उपलब्ध मोड चालू करें",
        earningsLedgerTitle: "💰 सहकारी कमाई बहीखाता",
        jobsCompletedChip: "कार्य पूर्ण किए",
        todayEarnings: "आज की कमाई",
        weekEarnings: "इस सप्ताह",
        coopShare15: "सहकारी कोष (15%)",
        netTakeHome: "शुद्ध कमाई (85%)",
        ledgerNote: "पारदर्शी सहकारी बहीखाता: शून्य निजी कमीशन — 85% सीधे आपको, 15% NCCT कल्याण कोष में।",
        myActiveJobsTitle: "मेरे सक्रिय कार्य",
        incomingJobsTitle: "नए उपलब्ध कार्य",
        btnStartJob: "⚡ काम शुरू करें (प्रगति में)",
        btnMarkComplete: "✅ काम पूरा करें और बिल बनाएं",
        btnAcceptJob: "काम स्वीकार करें",
        btnPassJob: "छोड़ें / अस्वीकार",
        busyAlertBanner: "⏸️ आप वर्तमान में व्यस्त / अवकाश पर हैं। नए कार्य स्वीकार करने के लिए ऊपर अपनी स्थिति 'उपलब्ध' में बदलें।",
        completedSettlementTitle: "पूर्ण कार्य और भुगतान स्थिति",

        // Cooperative Invoicing & Payment
        officialInvoice: "आधिकारिक सहकारी चालान",
        officialSettlement: "आधिकारिक सहकारी भुगतान रसीद",
        paymentPendingBadge: "⏳ भुगतान लंबित",
        settledBadge: "चुकता और सत्यापित",
        baseServiceDelivery: "मूल सेवा शुल्क:",
        emergencySurchargeText: "🚨 आपातकालीन प्राथमिकता अधिभार:",
        workerDirectEarning: "👷 कामगार सीधी कमाई (85%):",
        coopWelfareShareText: "🏛️ सहकारी कल्याण एवं प्रशिक्षण कोष (15%):",
        totalAmountDue: "कुल देय राशि:",
        totalAmountPaid: "कुल चुकता राशि:",
        selectPaymentMethod: "भुगतान का तरीका चुनें:",
        payMethodUpi: "📱 यूपीआई / क्यूआर कोड",
        payMethodCash: "💵 कार्य समापन पर नकद",
        payMethodCredit: "🏛️ सहकारी क्रेडिट",
        upiScanNote: "किसी भी यूपीआई ऐप (GPay, PhonePe, Paytm, BHIM) से स्कैन करके भुगतान करें",
        cashHandoverNote: "💵 कार्य समापन पर नकद: कृपया सेवा की संतुष्टि के बाद सीधे अपने सत्यापित सहकारी साथी को भुगतान करें।",
        creditAccountNote: "🏛️ सहकारी समिति क्रेडिट: अपने सत्यापित सहकार सदस्य खाते से सीधे समायोजित करें।",
        btnSettlePayment: "💳 भुगतान पूरा करें",
        btnViewReceipt: "🖨️ आधिकारिक रसीद देखें और प्रिंट करें",

        // Ratings & Feedback
        rateServiceHeading: "⭐ अपनी सहकारी सेवा का मूल्यांकन करें",
        tagPunctual: "⏱️ समयबद्ध",
        tagSkilled: "🛠️ कुशल",
        tagCooperative: "🤝 मिलनसार",
        tagCleanWork: "🧹 स्वच्छ कार्य",
        tagHonestPricing: "💡 ईमानदार दरें",
        btnSubmitReview: "🤝 सत्यापित समीक्षा भेजें",
        verifiedReviewBadge: "✅ सत्यापित सहकारी समीक्षा",
        memberRatingsHeading: "⭐ सदस्य रेटिंग और समीक्षाएं",

        // Admin Dashboard
        adminBannerTitle: "🏛️ सहकारी फेडरेशन नियंत्रण केंद्र",
        adminBannerSub: "वास्तविक समय सेवा आवंटन, कामगार सत्यापन, और सामाजिक कल्याण सुरक्षा कोष की निगरानी।",
        tabOverview: "📊 फेडरेशन अवलोकन",
        tabWorkers: "👷 कामगार सत्यापन व रोस्टर",
        tabBookings: "📋 सेवा आवंटन व प्रेषण",
        tabEmergency: "🚨 आपातकालीन SLA कतार",
        tabForecast: "📈 NCCT मांग पूर्वानुमान",
        metricsHeading: "प्रमुख सहकारी मेट्रिक्स और प्रदर्शन",
        emergencyQueueHeading: "🚨 आपातकालीन प्रेषण और प्रतिक्रिया SLA मॉनिटर",
        btnRefreshQueue: "🔄 कतार रीफ्रेश करें"
    }
};

/**
 * Universal in-code translation helper for dynamic JavaScript template literals.
 */
function t(key, fallback = "") {
    const lang = localStorage.getItem("sahkaar_lang") || "en";
    const dict = translations[lang] || translations.en;
    return dict[key] || fallback || key;
}

/**
 * Applies the selected language to all DOM elements with data-i18n and data-i18n-placeholder.
 */
function applyLanguage(lang) {
    const activeLang = (lang === "hi" || lang === "en") ? lang : "en";
    localStorage.setItem("sahkaar_lang", activeLang);
    const dict = translations[activeLang] || translations.en;

    // 1. Text content
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // 2. Placeholder attributes
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) {
            el.setAttribute("placeholder", dict[key]);
        }
    });

    // 3. Toggle buttons
    document.querySelectorAll(".lang-toggle, #langToggle").forEach(btn => {
        btn.textContent = activeLang === "en" ? "हिंदी" : "English";
    });

    // 4. Update html lang attribute
    document.documentElement.lang = activeLang;
}

/**
 * Toggles between English and Hindi
 */
function toggleLanguage() {
    const current = localStorage.getItem("sahkaar_lang") || "en";
    const next = current === "en" ? "hi" : "en";
    applyLanguage(next);

    // Refresh dynamic lists on active screens if already loaded
    try {
        if (typeof fetchMyBookings === "function" && document.getElementById("myBookingsSection") && !document.getElementById("myBookingsSection").classList.contains("hidden")) {
            fetchMyBookings();
        }
        if (typeof fetchWorkerDashboard === "function" && document.getElementById("workerDashboardSection") && !document.getElementById("workerDashboardSection").classList.contains("hidden")) {
            fetchWorkerDashboard();
        }
    } catch (e) {
        console.warn("Language re-render notice:", e);
    }
}

if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", () => {
        const saved = localStorage.getItem("sahkaar_lang") || "en";
        applyLanguage(saved);
    });
}
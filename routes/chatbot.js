const express = require("express");
const router = express.Router();
const db = require("../database");

/**
 * Knowledge Base for Cooperative Services & Household Issues
 */
const SERVICES = [
    {
        name: "Electrician",
        nameHi: "इलेक्ट्रीशियन (बिजली मिस्त्री)",
        basePrice: 249,
        enKeywords: ["electrician", "electricity", "power", "fan", "light", "wire", "wiring", "spark", "sparking", "switch", "socket", "short circuit", "mcb", "fuse", "bulb", "inverter", "current", "voltage"],
        hiKeywords: ["बिजली", "इलेक्ट्रीशियन", "पंखा", "तार", "स्विच", "सॉकेट", "स्पार्क", "करंट", "फ्यूज", "एमसीबी", "बल्ब", "शॉर्ट सर्किट", "इन्वर्टर", "लाइट"]
    },
    {
        name: "Plumber",
        nameHi: "प्लंबर (नल मिस्त्री)",
        basePrice: 279,
        enKeywords: ["plumber", "plumbing", "pipe", "tap", "leak", "leaking", "drain", "drainage", "sink", "toilet", "flush", "water", "clog", "clogged", "bathroom", "shower", "geyser fit", "sewage"],
        hiKeywords: ["नल", "प्लंबर", "पाइप", "पानी", "लीक", "लीकेज", "नाली", "सिंक", "टॉयलेट", "फ्लश", "बाथरूम", "टपकना", "जाम", "गटर"]
    },
    {
        name: "Carpenter",
        nameHi: "कारपेंटर (बढ़ई)",
        basePrice: 349,
        enKeywords: ["carpenter", "wood", "wooden", "door", "lock", "locked", "window", "furniture", "table", "chair", "bed", "drawer", "cupboard", "wardrobe", "hinge", "latch", "cabinet"],
        hiKeywords: ["बढ़ई", "कारपेंटर", "लकड़ी", "दरवाजा", "ताला", "खिड़की", "फर्नीचर", "कुर्सी", "मेज", "अलमारी", "दराज", "बेड", "कुंडी", "कब्जा"]
    },
    {
        name: "Painter",
        nameHi: "पेंटर (रंगसाज)",
        basePrice: 319,
        enKeywords: ["painter", "paint", "painting", "wall", "color", "whitewash", "putty", "primer", "damp", "dampness", "polish", "waterproof", "texture"],
        hiKeywords: ["पेंटर", "रंग", "पुताई", "दीवार", "सफेदी", "प्राइमर", "पोटीन", "पेंट", "सीलन", "पॉलिश", "रंगाई"]
    },
    {
        name: "Cleaner",
        nameHi: "क्लीनर (सफाई सहायक)",
        basePrice: 249,
        enKeywords: ["cleaner", "cleaning", "clean", "broom", "mop", "dust", "deep clean", "kitchen clean", "bathroom clean", "floor", "sanitization", "trash", "waste", "maid", "housekeeping"],
        hiKeywords: ["सफाई", "क्लीनर", "झाड़ू", "पोछा", "स्वच्छता", "कचरा", "फर्श", "गहरी सफाई", "धुलाई"]
    },
    {
        name: "Driver",
        nameHi: "ड्राइवर (वाहन चालक)",
        basePrice: 449,
        enKeywords: ["driver", "driving", "car", "cab", "chauffeur", "vehicle", "outstation", "commute", "pickup", "drop"],
        hiKeywords: ["ड्राइवर", "चालक", "गाड़ी", "कार", "सवारी", "यात्रा", "वाहन"]
    },
    {
        name: "Caregiver",
        nameHi: "केयरगिवर (देखभाल सहायक)",
        basePrice: 399,
        enKeywords: ["caregiver", "elderly", "senior", "patient", "nursing", "attendant", "bedside", "medicine", "baby sitting", "care"],
        hiKeywords: ["देखभाल", "केयरगिवर", "बुजुर्ग", "मरीज", "रोगी", "तीमारदार", "अटेंडेंट", "दवा", "सेवा"]
    },
    {
        name: "Technician",
        nameHi: "तकनीशियन (उपकरण मिस्त्री)",
        basePrice: 299,
        enKeywords: ["technician", "appliance", "ac", "air conditioner", "fridge", "refrigerator", "washing machine", "microwave", "ro", "water purifier", "repair", "service appliance"],
        hiKeywords: ["तकनीशियन", "मिस्त्री", "एसी", "फ्रिज", "वाशिंग मशीन", "माइक्रोवेव", "आरओ", "वाटर प्यूरीफायर", "रिपेयर", "उपकरण"]
    }
];

/**
 * Emergency Crisis Keywords
 */
const EMERGENCY_KEYWORDS = {
    en: ["emergency", "urgent", "sos", "immediately", "hazard", "danger", "burst pipe", "flooding", "blackout", "sparking", "locked out", "burning smell", "fire", "smoke"],
    hi: ["आपातकाल", "आपातकालीन", "तत्काल", "तुरंत", "खतरा", "एसओएस", "पाइप फट", "बाढ़", "बिजली गुल", "स्पार्क", "ताला बंद", "घर बंद", "धुआं", "आग"]
};

/**
 * Cooperative Pricing / Fair Wage Keywords
 */
const FAIR_WAGE_KEYWORDS = {
    en: ["fair wage", "pricing", "price", "rate", "cost", "charge", "commission", "middleman", "cooperative", "ncct", "surge", "welfare fund", "85%"],
    hi: ["उचित मजदूरी", "दर", "कीमत", "लागत", "शुल्क", "कमीशन", "बिचौलिया", "सहकारी", "एनसीसीटी", "कल्याण कोष", "सर्ज"]
};

/**
 * Booking Status / Invoice Keywords
 */
const STATUS_KEYWORDS = {
    en: ["my booking", "status", "track", "check booking", "invoice", "receipt", "bill", "payment status", "my order"],
    hi: ["मेरी बुकिंग", "स्थिति", "ट्रैक", "चालान", "रसीद", "बिल", "भुगतान", "ऑर्डर"]
};

/**
 * Worker Portal / Registration Keywords
 */
const WORKER_KEYWORDS = {
    en: ["worker", "join as worker", "register worker", "availability", "worker ledger", "earnings", "take home", "pmsby", "insurance", "welfare pool"],
    hi: ["कामगार", "पंजीकरण", "उपलब्धता", "कमाई", "बहीखाता", "बीमा", "सुरक्षा", "कल्याण कोष"]
};

/**
 * Detect language from text or preferred setting
 */
function detectLanguage(text, explicitLang) {
    if (explicitLang === "hi" || explicitLang === "en") return explicitLang;
    // Check for Devanagari Unicode characters (U+0900 to U+097F)
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    return hasDevanagari ? "hi" : "en";
}

/**
 * Checks if a keyword matches as a distinct word/phrase in text
 */
function hasWordMatch(text, kw) {
    const kwLower = kw.toLowerCase();
    // For English words/phrases, ensure word boundary matching so "ac" doesn't match "track"
    if (/^[a-z0-9\s]+$/i.test(kwLower)) {
        const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
        return regex.test(text);
    }
    // For Devanagari or other Unicode, substring check is standard
    return text.includes(kwLower);
}

/**
 * Scores and selects best matching cooperative service
 */
function matchService(queryLower) {
    let bestService = null;
    let maxMatches = 0;

    for (const service of SERVICES) {
        let matches = 0;
        for (const kw of service.enKeywords) {
            if (hasWordMatch(queryLower, kw)) matches += 2;
        }
        for (const kw of service.hiKeywords) {
            if (hasWordMatch(queryLower, kw)) matches += 2;
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            bestService = service;
        }
    }
    return maxMatches > 0 ? bestService : null;
}

/**
 * Main Chatbot Response Engine
 */
function processUserMessage(message, preferredLang = "en", role = "customer") {
    const text = (message || "").trim();
    const queryLower = text.toLowerCase();
    const lang = detectLanguage(text, preferredLang);

    // 1. Check for Greetings / Hello
    const greetings = ["hi", "hello", "hey", "namaste", "pranam", "नमस्ते", "प्रणाम", "हाय", "हैलो"];
    if (greetings.some(g => queryLower === g || queryLower === `${g}!` || queryLower.startsWith(`${g} `))) {
        if (lang === "hi") {
            return {
                reply: "नमस्ते! 🙏 मैं **सहकार साथी** (Sahkaar Saathi) हूँ — आपका 24/7 एआई सहकारी सहायक। मैं आपको सही सेवा चुनने, उचित मजदूरी समझने, या आपातकालीन सहायता प्राप्त करने में मदद कर सकता हूँ। आप क्या सहायता चाहते हैं?",
                intent: "GREETING",
                suggestions: ["💡 सेवा सुझाव", "🚨 आपातकालीन एसओएस", "💰 उचित मजदूरी नीति", "📖 मेरी बुकिंग"],
                action: null
            };
        } else {
            return {
                reply: "Hello! 🙏 I am **Sahkaar Saathi** — your 24/7 Cooperative AI Assistant. I can help diagnose home repair needs, connect you with verified tradespeople, explain fair cooperative pricing, or launch immediate emergency dispatches. How may I assist you today?",
                intent: "GREETING",
                suggestions: ["🔎 Recommend a Service", "🚨 Emergency SOS", "💰 Fair Pricing FAQ", "📖 Track My Bookings"],
                action: null
            };
        }
    }

    // 2. Check for Emergency Distress
    const isEmergency = EMERGENCY_KEYWORDS[lang].some(kw => hasWordMatch(queryLower, kw)) ||
                        EMERGENCY_KEYWORDS.en.some(kw => hasWordMatch(queryLower, kw));

    if (isEmergency) {
        // Try to identify emergency trade
        const matched = matchService(queryLower);
        const serviceName = matched ? matched.name : "Electrician";
        const serviceNameHi = matched ? matched.nameHi : "इलेक्ट्रीशियन";

        if (lang === "hi") {
            return {
                reply: `🚨 **आपातकालीन स्थिति पहचानी गई!** घरेलू संकट (जैसे पाइप फटना, बिजली स्पार्क, या ताला जाम) के लिए सहकार कनेक्ट 15-30 मिनट के अंदर निकटतम सत्यापित ${serviceNameHi} को प्राथमिकता से भेजता है।\n\n🛡️ **शून्य सर्ज गारंटी:** केवल निश्चित ₹50 त्वरित अधिभार। नीचे दिए गए बटन से तुरंत आपातकालीन एसओएस सक्रिय करें:`,
                intent: "EMERGENCY_DISPATCH",
                suggestions: ["🚨 आपातकालीन एसओएस अभी शुरू करें", "📞 सहायता हेल्पलाइन"],
                action: {
                    type: "OPEN_SOS",
                    service: serviceName,
                    label: "🚨 1-क्लिक आपातकालीन एसओएस खोलें"
                }
            };
        } else {
            return {
                reply: `🚨 **Urgent Emergency Detected!** For crisis situations (like pipe flooding, power sparks, appliance smoke, or lockouts), Sahkaar Connect dispatches the nearest verified ${serviceName} with a target 15–30 minute response SLA.\n\n🛡️ **Zero Surge Multiplier Guarantee:** Flat ₹50 rapid mobilization fee only. You can launch emergency dispatch immediately below:`,
                intent: "EMERGENCY_DISPATCH",
                suggestions: ["🚨 Activate 1-Click SOS Now", "🛡️ Emergency Pricing Policy"],
                action: {
                    type: "OPEN_SOS",
                    service: serviceName,
                    label: "🚨 Open 1-Click SOS Dispatch"
                }
            };
        }
    }

    // 3. Check for Booking Status & Tracking (before service recommendation to handle "track my booking")
    const isStatusQuery = STATUS_KEYWORDS[lang].some(kw => hasWordMatch(queryLower, kw)) ||
                          STATUS_KEYWORDS.en.some(kw => hasWordMatch(queryLower, kw));

    if (isStatusQuery) {
        if (lang === "hi") {
            return {
                reply: `📖 आप अपने पंजीकृत 10-अंकीय फोन नंबर से अपनी सभी बुकिंग स्थिति, आवंटित कामगार, और आधिकारिक चालान/रसीदें देख सकते हैं।\n\nअपनी बुकिंग देखने के लिए नीचे दिए गए बटन पर क्लिक करें:`,
                intent: "BOOKING_TRACKING",
                suggestions: ["📖 मेरी बुकिंग खोलें", "🔎 नई सेवा बुक करें"],
                action: {
                    type: "SHOW_MY_BOOKINGS",
                    label: "📖 मेरी बुकिंग स्क्रीन खोलें"
                }
            };
        } else {
            return {
                reply: `📖 You can track all current and completed bookings, view assigned cooperative workers, and download official cooperative invoices using your registered mobile number.\n\nClick below to navigate directly to your bookings:`,
                intent: "BOOKING_TRACKING",
                suggestions: ["📖 View My Bookings", "📅 Book a New Service"],
                action: {
                    type: "SHOW_MY_BOOKINGS",
                    label: "📖 View My Bookings Screen"
                }
            };
        }
    }

    // 4. Check for Fair Wage & Cooperative Model FAQs
    const isPricingQuery = FAIR_WAGE_KEYWORDS[lang].some(kw => hasWordMatch(queryLower, kw)) ||
                           FAIR_WAGE_KEYWORDS.en.some(kw => hasWordMatch(queryLower, kw));

    if (isPricingQuery) {
        if (lang === "hi") {
            return {
                reply: `🤝 **सहकार कनेक्ट का पारदर्शी सहकारी मॉडल:**\n\n1. **शून्य निजी बिचौलिया कमीशन:** निजी ऐप 25-35% तक भारी कमीशन काटते हैं। सहकार कनेक्ट पर 100% पारदर्शी दरें हैं।\n2. **85/15 पारदर्शी विभाजन:** ग्राहक द्वारा दिए गए प्रत्येक भुगतान का **85% सीधे कामगार को मिलता है**, और **15% NCCT कामगार कल्याण एवं पीएम सुरक्षा बीमा कोष** में जाता है।\n3. **शून्य सर्ज शुल्क:** बारिश, त्योहार या पीक ऑवर में कोई मनमाना सर्ज मल्टीप्लायर नहीं!`,
                intent: "COOPERATIVE_MODEL_FAQ",
                suggestions: ["🔎 उपलब्ध सेवाएं देखें", "🚨 आपातकालीन दरें", "👷 कामगार लाभ"],
                action: {
                    type: "SHOW_SERVICES",
                    label: "🔎 सभी सहकारी सेवाएं देखें"
                }
            };
        } else {
            return {
                reply: `🤝 **The Sahkaar Connect Cooperative Advantage:**\n\n1. **Zero Exploitative Middleman:** Unlike private platforms taking 25–35% cut, Sahkaar runs on a democratic cooperative framework.\n2. **85% / 15% Transparent Ledger:** 85% of total payment goes directly to the tradesperson's account. 15% funds the NCCT Welfare, Skills Training & PM Suraksha Bima insurance pool.\n3. **No Surge Multipliers:** Predictable fair wages across standard hours with zero demand inflation!`,
                intent: "COOPERATIVE_MODEL_FAQ",
                suggestions: ["🔎 Browse Services", "🚨 Emergency SOS Fees", "👷 Worker Rights"],
                action: {
                    type: "SHOW_SERVICES",
                    label: "🔎 Browse Cooperative Services"
                }
            };
        }
    }

    // 5. Check for Service Recommendations (Problem Diagnosis)
    const matchedService = matchService(queryLower);
    if (matchedService) {
        if (lang === "hi") {
            return {
                reply: `🛠️ आपकी समस्या के लिए **${matchedService.nameHi}** सबसे उपयुक्त सहकारी सेवा है।\n\n- **उचित सहकारी मजदूरी:** ₹${matchedService.basePrice} (पारदर्शी मानक दर)\n- **सत्यापन:** 100% NCCT प्रमाणित एवं पुलिस सत्यापित सदस्य\n- **कमीशन:** 0% निजी बिचौलिया शुल्क — 85% सीधे कामगार को\n\nक्या आप अभी बुकिंग फॉर्म खोलना चाहते हैं?`,
                intent: "SERVICE_RECOMMENDATION",
                suggestions: [`📅 ${matchedService.name} बुक करें`, "💰 मूल्य विवरण", "📖 मेरी बुकिंग"],
                action: {
                    type: "OPEN_BOOKING",
                    service: matchedService.name,
                    label: `📅 ${matchedService.name} बुकिंग खोलें (₹${matchedService.basePrice})`
                }
            };
        } else {
            return {
                reply: `🛠️ Based on your description, you need a verified **${matchedService.name}**.\n\n- **Cooperative Fair Wage:** ₹${matchedService.basePrice} (guaranteed standard estimate)\n- **Verification:** NCCT skill certified & background verified member\n- **Zero Exploitation:** 85% direct take-home to the worker; zero middleman fees\n\nWould you like to open the cooperative booking form now?`,
                intent: "SERVICE_RECOMMENDATION",
                suggestions: [`📅 Book ${matchedService.name}`, "💡 How pricing works", "📖 Check Bookings"],
                action: {
                    type: "OPEN_BOOKING",
                    service: matchedService.name,
                    label: `📅 Open ${matchedService.name} Booking (₹${matchedService.basePrice})`
                }
            };
        }
    }

    // 6. Check for Worker Dashboard & Benefits
    const isWorkerQuery = WORKER_KEYWORDS[lang].some(kw => queryLower.includes(kw.toLowerCase())) ||
                          WORKER_KEYWORDS.en.some(kw => queryLower.includes(kw.toLowerCase()));

    if (isWorkerQuery || role === "worker") {
        if (lang === "hi") {
            return {
                reply: `👷 **सहकारी कामगार पोर्टल व सुविधाएं:**\n\n- **85% सीधी कमाई:** बिचौलिया रहित प्रत्यक्ष बैंक/यूपीआई निपटान।\n- **उपलब्धता नियंत्रण:** अपनी सुविधानुसार 'उपलब्ध' या 'व्यस्त' मोड में स्विच करें।\n- **सामाजिक सुरक्षा:** पीएम सुरक्षा बीमा, NCCT कौशल विकास एवं उपकरण ऋण सहायता।\n\nडैशबोर्ड देखने के लिए नीचे क्लिक करें:`,
                intent: "WORKER_PORTAL",
                suggestions: ["🛠️ कामगार डैशबोर्ड", "💰 बहीखाता विवरण", "🔄 उपलब्धता बदलें"],
                action: {
                    type: "SHOW_WORKER_DASHBOARD",
                    label: "🛠️ कामगार डैशबोर्ड खोलें"
                }
            };
        } else {
            return {
                reply: `👷 **Cooperative Worker Portal & Welfare Protections:**\n\n- **85% Direct Take-Home:** Direct cooperative settlement with zero private agency commission cuts.\n- **Flexible Status:** Easily toggle Live Availability between AVAILABLE and BUSY.\n- **Social Safety Net:** PM Suraksha Bima insurance cover and NCCT trade certification.\n\nClick below to access your worker dashboard:`,
                intent: "WORKER_PORTAL",
                suggestions: ["🛠️ Worker Dashboard", "💰 Earnings Ledger", "🔄 Toggle Availability"],
                action: {
                    type: "SHOW_WORKER_DASHBOARD",
                    label: "🛠️ Open Worker Dashboard"
                }
            };
        }
    }

    // 7. General Fallback
    if (lang === "hi") {
        return {
            reply: `मैं आपकी बात पूरी तरह समझ नहीं पाया। मैं इन मामलों में तुरंत सहायता कर सकता हूँ:\n\n1. **सेवा सुझाव:** समस्या बताएं (जैसे: "पाइप से पानी टपक रहा है" या "पंखा खराब है")\n2. **आपातकाल:** संकट के लिए तुरंत 1-क्लिक एसओएस सहायता\n3. **सहकारी मॉडल:** उचित मजदूरी और 85/15 नीति की जानकारी\n4. **बुकिंग जांच:** अपनी सक्रिय बुकिंग ट्रैक करें`,
            intent: "UNKNOWN_FALLBACK",
            suggestions: ["🚰 नल ठीक करना", "⚡ बिजली का काम", "🚨 आपातकालीन एसओएस", "💰 उचित दरें"],
            action: null
        };
    } else {
        return {
            reply: `I'm not sure I understood completely. Here is what I can help you with right away:\n\n1. **Service Diagnosis:** Describe your problem (e.g., "water leaking under sink", "ceiling fan sparking")\n2. **Emergency SOS:** Rapid response dispatch for urgent crises\n3. **Cooperative Pricing:** Learn about our zero-middleman, 85/15 fair wage policy\n4. **Bookings & Receipts:** Track bookings and view settled invoices`,
            intent: "UNKNOWN_FALLBACK",
            suggestions: ["🚰 Leaking Pipe (Plumber)", "⚡ Sparking Wire (Electrician)", "🚨 Emergency SOS", "💰 Fair Pricing FAQ"],
            action: null
        };
    }
}

/**
 * POST /api/chatbot/message
 * Handles incoming chat messages and generates local bilingual NLP responses
 */
router.post("/message", (req, res) => {
    try {
        const { message, language, role, context } = req.body || {};

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Message content is required"
            });
        }

        const result = processUserMessage(message, language, role);
        return res.json({
            reply: result.reply,
            intent: result.intent,
            suggestions: result.suggestions || [],
            action: result.action || null,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Chatbot message processing error:", err);
        return res.status(500).json({
            error: "Failed to process chat query"
        });
    }
});

/**
 * GET /api/chatbot/prompts
 * Returns starter suggestions for initial chat render
 */
router.get("/prompts", (req, res) => {
    const lang = req.query.lang === "hi" ? "hi" : "en";
    const role = req.query.role || "customer";

    if (role === "worker") {
        const prompts = lang === "hi" ? [
            "🛠️ मैं अपनी कार्य स्थिति 'उपलब्ध' कैसे करूँ?",
            "💰 85% सीधी कमाई और बहीखाता कैसे काम करता है?",
            "🛡️ पीएम सुरक्षा बीमा और NCCT कल्याण कोष क्या है?"
        ] : [
            "🛠️ How do I toggle my availability status?",
            "💰 How does the 85% direct take-home earnings ledger work?",
            "🛡️ What are the NCCT welfare and insurance benefits?"
        ];
        return res.json({ prompts });
    }

    const prompts = lang === "hi" ? [
        "🚰 मेरे बेसिन का नल और पाइप लीक हो रहा है",
        "⚡ बिजली के बोर्ड में स्पार्क हो रहा है",
        "🚨 आपातकालीन एसओएस सेवा कैसे काम करती है?",
        "💰 सहकार कनेक्ट की उचित मजदूरी दरें क्या हैं?"
    ] : [
        "🚰 My sink pipe is leaking water",
        "⚡ Switchboard is sparking and power is out",
        "🚨 How does 1-Click Emergency SOS dispatch work?",
        "💰 Explain fair wages and zero-middleman pricing"
    ];

    return res.json({ prompts });
});

module.exports = router;
module.exports.processUserMessage = processUserMessage;

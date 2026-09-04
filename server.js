const express = require("express");
const path = require("path");

const statusRoute = require("./routes/status");
const workersRoute = require("./routes/workers");
const servicesRoute = require("./routes/services");
const bookings = require("./routes/bookings");
const admin = require("./routes/admin");
const adminAuth = require("./routes/adminAuth");
const ratingsRoute = require("./routes/ratings");
const invoicesRoute = require("./routes/invoices");
const paymentsRoute = require("./routes/payments");
const forecastRoute = require("./routes/forecast");
const auth = require("./routes/auth");
const customerRoute = require("./routes/customer");
const emergencyRoute = require("./routes/emergency");
const chatbotRoute = require("./routes/chatbot");
const societiesRoute = require("./routes/societies");
const analyticsRoute = require("./routes/analytics");
const welfareRoute = require("./routes/welfare");
const simulatorRoute = require("./routes/simulator");

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for all local development and PWA clients
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Status
app.get("/api/status", statusRoute);

// Services
app.use("/api/services", servicesRoute);

// Customer Profile & Location
app.get("/api/customer/profile", customerRoute.getProfile);
app.post("/api/customer/profile", customerRoute.saveProfile);
app.post("/api/customer/location", customerRoute.updateLocation);

// Workers
app.get("/api/workers", workersRoute);
app.post("/api/workers", workersRoute);
app.post("/api/workers/:id/availability", workersRoute.updateAvailability);
app.get("/api/workers/:id/earnings", workersRoute.getEarnings);
app.get("/api/workers/:id/badge", workersRoute.getWorkerBadge);
app.get("/api/verify/worker/:hash", workersRoute.verifyWorkerByHash);

// Bookings
app.get("/api/bookings", bookings.bookingsRoute);
app.post("/api/bookings", bookings.bookingsRoute);
app.post("/api/bookings/:id/accept", bookings.acceptBooking);
app.post("/api/bookings/:id/start", bookings.startBooking);
app.post("/api/bookings/:id/complete", bookings.completeBooking);
app.post("/api/bookings/:id/cancel", bookings.cancelBooking);

// Emergency Rapid Dispatch (Phase 11)
app.post("/api/emergency/sos", emergencyRoute.triggerEmergencySOS);
app.get("/api/emergency/queue", emergencyRoute.getEmergencyQueue);
app.post("/api/emergency/:id/reassign", adminAuth.requireAdminAuth, emergencyRoute.reassignEmergency);

// Authentication (Customer, Worker, Logout)
app.post("/api/auth/customer/send-otp", auth.customerSendOtp);
app.post("/api/auth/customer/verify-otp", auth.customerVerifyOtp);
app.post("/api/auth/worker/send-otp", auth.workerSendOtp);
app.post("/api/auth/worker/verify-otp", auth.workerVerifyOtp);
app.post("/api/auth/logout", auth.logout);

// Admin login (public — this is how you GET a token)
app.post("/api/admin/login", adminAuth.adminLogin);

// Admin (Federation dashboard) — all protected by requireAdminAuth below
app.get("/api/admin/stats", adminAuth.requireAdminAuth, admin.getStats);
app.get("/api/admin/workers", adminAuth.requireAdminAuth, admin.getAllWorkers);
app.get("/api/admin/bookings", adminAuth.requireAdminAuth, admin.getAllBookings);
app.post("/api/admin/verify", adminAuth.requireAdminAuth, admin.verifyWorker);
app.post("/api/admin/workers/:id/badge", adminAuth.requireAdminAuth, admin.issueWorkerBadge);
app.post("/api/admin/workers/:id/revoke-badge", adminAuth.requireAdminAuth, admin.revokeWorkerBadge);
app.post("/api/admin/assign", adminAuth.requireAdminAuth, admin.assignWorker);
app.get("/api/admin/match/:bookingId", adminAuth.requireAdminAuth, admin.matchWorkers);

// Ratings
app.get("/api/ratings", ratingsRoute.getRatings);
app.post("/api/ratings", ratingsRoute.addRating);

// Invoices
app.get("/api/invoices", invoicesRoute.getInvoice);

// Payments (mock only)
app.post("/api/payments/mock", paymentsRoute.mockPay);

// AI-style forecast (rule-based)
app.get("/api/forecast", forecastRoute.getForecast);

// AI Chatbot "Sahkaar Saathi" (Phase 13)
app.use("/api/chatbot", chatbotRoute);

// Cooperative Societies & PACS Clusters (Phase 14)
app.use("/api/societies", societiesRoute);

// Predictive Demand & Fair Wage Analytics Engine (Phase 15)
app.use("/api/analytics", analyticsRoute);

// Cooperative Welfare & PMSBY Insurance Pool (Phase 18)
app.get("/api/welfare/worker/:id", welfareRoute.getWorkerWelfare);
app.post("/api/welfare/claims", welfareRoute.submitWelfareClaim);
app.get("/api/welfare/stats", welfareRoute.getWelfareStats);

// Admin Welfare Management (Phase 18)
app.get("/api/admin/welfare/claims", adminAuth.requireAdminAuth, admin.getAdminClaims);
app.post("/api/admin/welfare/claims/:id/process", adminAuth.requireAdminAuth, admin.processAdminClaim);
app.post("/api/admin/welfare/batch-renew-pmsby", adminAuth.requireAdminAuth, admin.batchRenewPmsby);
app.get("/api/admin/welfare/ledger", adminAuth.requireAdminAuth, admin.getWelfareLedger);

// Hackathon Pitch Deck & Cooperative Lifecycle Simulator (Phase 20)
app.use("/api/simulator", simulatorRoute);

// 404
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        requestedUrl: req.url
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
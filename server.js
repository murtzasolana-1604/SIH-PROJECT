const express = require("express");
const path = require("path");

const statusRoute = require("./routes/status");
const workersRoute = require("./routes/workers");
const servicesRoute = require("./routes/services");
const bookings = require("./routes/bookings");
const admin = require("./routes/admin");
const ratingsRoute = require("./routes/ratings");
const invoicesRoute = require("./routes/invoices");
const paymentsRoute = require("./routes/payments");
const forecastRoute = require("./routes/forecast");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Status
app.get("/api/status", statusRoute);

// Services
app.get("/api/services", servicesRoute);

// Workers
app.get("/api/workers", workersRoute);
app.post("/api/workers", workersRoute);

// Bookings
app.get("/api/bookings", bookings.bookingsRoute);
app.post("/api/bookings", bookings.bookingsRoute);
app.post("/api/bookings/:id/accept", bookings.acceptBooking);
app.post("/api/bookings/:id/complete", bookings.completeBooking);

// Admin (Federation dashboard)
app.get("/api/admin/stats", admin.getStats);
app.get("/api/admin/workers", admin.getAllWorkers);
app.post("/api/admin/verify", admin.verifyWorker);
app.post("/api/admin/assign", admin.assignWorker);
app.get("/api/admin/match/:bookingId", admin.matchWorkers);

// Ratings
app.get("/api/ratings", ratingsRoute.getRatings);
app.post("/api/ratings", ratingsRoute.addRating);

// Invoices
app.get("/api/invoices", invoicesRoute.getInvoice);

// Payments (mock only)
app.post("/api/payments/mock", paymentsRoute.mockPay);

// AI-style forecast (rule-based)
app.get("/api/forecast", forecastRoute.getForecast);

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
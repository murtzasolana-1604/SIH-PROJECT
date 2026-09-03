const services = [
    {
        id: 1,
        name: "Electrician",
        category: "Electrical",
        icon: "⚡"
    },
    {
        id: 2,
        name: "Plumber",
        category: "Home Repair",
        icon: "🔧"
    },
    {
        id: 3,
        name: "Carpenter",
        category: "Home Repair",
        icon: "🪚"
    },
    {
        id: 4,
        name: "Painter",
        category: "Home Improvement",
        icon: "🎨"
    },
    {
        id: 5,
        name: "Cleaner",
        category: "Household",
        icon: "🧹"
    },
    {
        id: 6,
        name: "Driver",
        category: "Transport",
        icon: "🚗"
    },
    {
        id: 7,
        name: "Caregiver",
        category: "Care",
        icon: "❤️"
    },
    {
        id: 8,
        name: "Technician",
        category: "Technical",
        icon: "🛠️"
    }
];

function servicesRoute(req, res) {

    res.json({
        success: true,
        services: services
    });

}

module.exports = servicesRoute;
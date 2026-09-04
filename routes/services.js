const services = [
    {
        id: 1,
        name: "Electrician",
        category: "Electrical",
        icon: "⚡",
        description: "Fan repair, switchboard replacement, short-circuit troubleshooting & appliance wiring.",
        fairWagePrice: 249,
        fairWageLabel: "₹249 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 2,
        name: "Plumber",
        category: "Home Repair",
        icon: "🔧",
        description: "Pipe leakage fix, tap/cistern repair, drain clearing & bathroom fittings installation.",
        fairWagePrice: 279,
        fairWageLabel: "₹279 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 3,
        name: "Carpenter",
        category: "Home Repair",
        icon: "🪚",
        description: "Door lock repair, furniture assembly, hinges fix & custom woodwork modifications.",
        fairWagePrice: 349,
        fairWageLabel: "₹349 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 4,
        name: "Painter",
        category: "Home Improvement",
        icon: "🎨",
        description: "Wall touch-ups, moisture damp treatment, single-room repainting & exterior whitewash.",
        fairWagePrice: 319,
        fairWageLabel: "₹319 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 5,
        name: "Cleaner",
        category: "Household",
        icon: "🧹",
        description: "Deep home sanitation, kitchen/bathroom scrub, sofa shampooing & floor polishing.",
        fairWagePrice: 249,
        fairWageLabel: "₹249 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 6,
        name: "Driver",
        category: "Transport",
        icon: "🚗",
        description: "Verified on-demand personal and commercial chauffeur for local and outstation trips.",
        fairWagePrice: 449,
        fairWageLabel: "₹449 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 7,
        name: "Caregiver",
        category: "Care",
        icon: "❤️",
        description: "Compassionate elderly assistance, patient escorting, vital monitoring & daily companion care.",
        fairWagePrice: 399,
        fairWageLabel: "₹399 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    },
    {
        id: 8,
        name: "Technician",
        category: "Technical",
        icon: "🛠️",
        description: "RO water purifier service, AC filter cleaning, microwave repair & electronic diagnostics.",
        fairWagePrice: 299,
        fairWageLabel: "₹299 Fair Wage Estimate",
        benefitNote: "Fair wages, verified worker, community owned"
    }
];

function servicesRoute(req, res) {

    res.json({
        success: true,
        services: services
    });

}

module.exports = servicesRoute;
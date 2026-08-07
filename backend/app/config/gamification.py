POINTS = {
    "report_submitted": 10,
    "ticket_resolved": 20,
    "streak_bonus": 5,
}

BADGES = [
    {"name": "First Reporter", "description": "Submitted your first campus report", "threshold_points": 10, "icon": "🌱"},
    {"name": "Eco Warrior", "description": "Earned 50 sustainability points", "threshold_points": 50, "icon": "🌿"},
    {"name": "Green Champion", "description": "Earned 150 sustainability points", "threshold_points": 150, "icon": "🏆"},
    {"name": "Campus Hero", "description": "Earned 300 sustainability points", "threshold_points": 300, "icon": "🦸"},
    {"name": "Eco Legend", "description": "Earned 600 sustainability points", "threshold_points": 600, "icon": "🌍"},
]

ACTION_MAP = {
    "organic": {
        "action": "Dispose in the Green (Organic) Bin. Notify housekeeping for composting.",
        "tip": "Organic waste can be composted to enrich campus gardens!",
    },
    "recyclable": {
        "action": "Dispose in the Blue (Recyclable) Bin. Separate paper, plastic, and metal.",
        "tip": "Recycling one plastic bottle saves enough energy to power a light bulb for 6 hours.",
    },
    "hazardous": {
        "action": "Do NOT handle. Alert the Safety Office immediately via the admin portal.",
        "tip": "Hazardous materials require special disposal to protect campus health.",
    },
    "general_waste": {
        "action": "Dispose in the Red (General Waste) Bin. Alert housekeeping for cleanup.",
        "tip": "Reducing general waste starts with mindful consumption on campus.",
    },
    "resource_wastage": {
        "action": "Alert the Maintenance Department. Record meter reading if possible.",
        "tip": "Fixing one leaking tap can save up to 15,000 litres of water a year!",
    },
}

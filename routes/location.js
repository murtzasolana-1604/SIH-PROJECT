/**
 * SAHKAAR CONNECT — Reverse Geocoding & Geospatial Address Proxy
 * Converts GPS coordinates (latitude, longitude) into readable postal addresses.
 */

const express = require("express");
const router = express.Router();

// Simple in-memory cache for geocoding results (key: lat.toFixed(4),lng.toFixed(4))
const geocodeCache = new Map();
const MAX_CACHE_SIZE = 500;

function formatAddressFromNominatim(data) {
    if (!data || !data.address) {
        return data.display_name || null;
    }

    const a = data.address;
    const parts = [];

    // 1. House / Building / Flat
    const house = a.house_number || a.building || a.flat || a.apartment;
    const road = a.road || a.street || a.pedestrian;
    if (house && road) {
        parts.push(`${house}, ${road}`);
    } else if (road) {
        parts.push(road);
    } else if (house) {
        parts.push(house);
    }

    // 2. Sub-locality / Sector / Mohalla / Village
    const locality = a.suburb || a.neighbourhood || a.residential || a.village || a.subdistrict;
    if (locality && !parts.includes(locality)) {
        parts.push(locality);
    }

    // 3. City / Town / District
    const city = a.city || a.town || a.city_district || a.district || a.county;
    if (city && !parts.includes(city)) {
        parts.push(city);
    }

    // 4. State
    const state = a.state;
    if (state && !parts.includes(state)) {
        parts.push(state);
    }

    // 5. Postal Code
    const postcode = a.postcode;
    if (postcode) {
        parts.push(postcode);
    }

    // 6. Country
    const country = a.country || "India";
    parts.push(country);

    return parts.filter(Boolean).join(", ");
}

router.get("/reverse-geocode", async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng || req.query.lon);

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        return res.status(400).json({
            success: false,
            message: "Valid non-zero latitude and longitude coordinates are required."
        });
    }

    // Check bounds (roughly India: Lat 6 to 38, Lng 68 to 98, or global)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
            success: false,
            message: "Coordinates out of geographic range."
        });
    }

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
        return res.json({
            success: true,
            cached: true,
            address: geocodeCache.get(cacheKey),
            latitude: lat,
            longitude: lng
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "SahkaarConnect-CooperativeApp/1.0 (sih.cooperative.platform@gov.in)",
                "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8"
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Reverse geocoder responded with status ${response.status}`);
        }

        const data = await response.json();
        const readableAddress = formatAddressFromNominatim(data) || data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        // Cache result
        if (geocodeCache.size >= MAX_CACHE_SIZE) {
            const firstKey = geocodeCache.keys().next().value;
            geocodeCache.delete(firstKey);
        }
        geocodeCache.set(cacheKey, readableAddress);

        return res.json({
            success: true,
            cached: false,
            address: readableAddress,
            raw: data.address || null,
            latitude: lat,
            longitude: lng
        });

    } catch (err) {
        console.warn("[Reverse Geocode Warning]", err.message);
        // Graceful fallback to formatted coordinate description so UI does not break
        const fallbackAddress = `Service Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        return res.json({
            success: true,
            fallback: true,
            address: fallbackAddress,
            latitude: lat,
            longitude: lng,
            note: "Automatic address resolution was unavailable; please verify or edit your address manually."
        });
    }
});

module.exports = router;

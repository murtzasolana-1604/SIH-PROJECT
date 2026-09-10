/**
 * SAHKAAR CONNECT — Centralized Business Rules Configuration
 * SIH26089: Cooperative Gig Services Platform for Household & Community Services
 * 
 * Defines statutory cooperative financial models, geospatial matching radii,
 * and authoritative server-side distance and living wage computation formulas.
 */

const DEFAULT_CUSTOMER_RADIUS_KM = 20;
const DEFAULT_WORKER_RADIUS_KM = 20;
const COOPERATIVE_COMMISSION_RATE = 0.07; // 7% Cooperative Welfare & Training Pool
const WORKER_PAYOUT_RATE = 0.93;          // 93% Direct Member Living Wage
const ALLOWED_RADII_KM = [5, 10, 20, 30, 50];
const EMERGENCY_SURCHARGE = 50;           // Fixed ₹50 Rapid Mobilization Bonus

/**
 * Calculates Great-Circle Distance (Haversine Formula) between two coordinates in kilometers.
 * Never calculates distance silently from null, undefined, or 0,0 coordinates.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined ||
        lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) {
        return null;
    }

    const lat1Num = Number(lat1);
    const lon1Num = Number(lon1);
    const lat2Num = Number(lat2);
    const lon2Num = Number(lon2);

    if (isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
        return null;
    }

    if ((lat1Num === 0 && lon1Num === 0) || (lat2Num === 0 && lon2Num === 0)) {
        return null;
    }

    const R = 6371; // Earth's mean radius in kilometers
    const toRad = (angle) => (angle * Math.PI) / 180;

    const p1 = toRad(lat1Num);
    const p2 = toRad(lat2Num);
    const deltaLat = toRad(lat2Num - lat1Num);
    const deltaLon = toRad(lon2Num - lon1Num);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10;
}

/**
 * Authoritative pricing breakdown helper.
 * Ensures transparent 7% cooperative share and 93% worker direct living wage.
 * 
 * Example:
 * Total applicable service amount = ₹1000
 * Cooperative share (7%) = ₹70
 * Worker earning (93%) = ₹930
 */
function calculatePricingBreakdown(basePrice, isEmergency = false) {
    const base = Number(basePrice) || 299;
    const surcharge = isEmergency ? EMERGENCY_SURCHARGE : 0;
    const totalAmount = base + surcharge;

    const cooperativeShare = Math.round(totalAmount * COOPERATIVE_COMMISSION_RATE * 100) / 100;
    const workerEarning = Math.round((totalAmount - cooperativeShare) * 100) / 100;

    return {
        basePrice: base,
        emergencySurcharge: surcharge,
        totalAmount,
        cooperativeShare,
        workerEarning,
        commissionRate: COOPERATIVE_COMMISSION_RATE,
        workerPayoutRate: WORKER_PAYOUT_RATE,
        commissionPercent: Math.round(COOPERATIVE_COMMISSION_RATE * 100),
        workerPayoutPercent: Math.round(WORKER_PAYOUT_RATE * 100)
    };
}

module.exports = {
    DEFAULT_CUSTOMER_RADIUS_KM,
    DEFAULT_WORKER_RADIUS_KM,
    COOPERATIVE_COMMISSION_RATE,
    WORKER_PAYOUT_RATE,
    ALLOWED_RADII_KM,
    EMERGENCY_SURCHARGE,
    calculateHaversineDistance,
    calculatePricingBreakdown
};

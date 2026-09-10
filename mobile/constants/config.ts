/**
 * Sahkaar Connect Mobile App Configuration
 */

export const CONFIG = {
  // Centralized backend URL (Defaults to Render production PostgreSQL backend)
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || "https://sih-project-v7qg.onrender.com",
  
  // Prototype demo OTP and credentials for testing
  DEMO_OTP: "123456",
  DEMO_WORKER_PHONE: "9876543210",
  DEMO_CUSTOMER_PHONE: "9876543210",
  
  // App Identity
  APP_NAME: "Sahkaar Connect",
  TAGLINE: "Cooperative Gig Services Platform",
  VERSION: "1.0.0",
  SIH_PS_ID: "SIH26089",
  MINISTRY: "Ministry of Cooperation, Govt. of India",
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: "@sahkaar_auth_token",
    USER_ROLE: "@sahkaar_user_role",
    USER_PROFILE: "@sahkaar_user_profile",
    LANGUAGE: "@sahkaar_language",
    OFFLINE_CACHE: "@sahkaar_offline_cache"
  },

  // Centralized Business Rules (aligned with backend config/businessRules.js)
  DEFAULT_CUSTOMER_RADIUS_KM: 20,
  DEFAULT_WORKER_RADIUS_KM: 20,
  COOPERATIVE_COMMISSION_RATE: 0.07,
  WORKER_PAYOUT_RATE: 0.93,
  ALLOWED_RADII_KM: [5, 10, 20, 30, 50],
  EMERGENCY_SURCHARGE: 50,

  // SLA Timings
  EMERGENCY_DISPATCH_MINUTES: 15,
  REQUEST_TIMEOUT_MS: 15000,
};

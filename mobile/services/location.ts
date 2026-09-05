/**
 * Location Service
 * Encapsulates Expo Location permissions and coordinates acquisition
 */

import * as Location from "expo-location";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export const LocationService = {
  // Request GPS permission contextually
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (err) {
      console.warn("Location permission error:", err);
      return false;
    }
  },

  // Acquire current location
  async getCurrentLocation(): Promise<GeoCoordinates | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to human-readable address
      let addressDetails: Partial<GeoCoordinates> = {};
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
          addressDetails = {
            address: [geo.name, geo.street, geo.subregion].filter(Boolean).join(", "),
            city: geo.city || geo.district || undefined,
            state: geo.region || undefined,
            pincode: geo.postalCode || undefined,
          };
        }
      } catch (geocodeErr) {
        console.warn("Reverse geocode warning:", geocodeErr);
      }

      return {
        latitude,
        longitude,
        ...addressDetails,
      };
    } catch (err) {
      console.warn("Failed to get current location:", err);
      return null;
    }
  },

  // Calculate approximate straight-line distance in km
  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
};

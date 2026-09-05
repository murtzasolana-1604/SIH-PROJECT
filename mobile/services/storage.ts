/**
 * Mobile Storage Service
 * Handles persistence for auth tokens, user preferences, and offline cache
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../constants/config";
import { AuthSession } from "../types/auth";
import { Language } from "../constants/translations";

export const StorageService = {
  // Auth Token
  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.warn("Error saving auth token:", e);
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch (e) {
      console.warn("Error reading auth token:", e);
      return null;
    }
  },

  async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch (e) {
      console.warn("Error removing auth token:", e);
    }
  },

  // User Session / Profile
  async setSession(session: AuthSession): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(session));
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_ROLE, session.role);
      if (session.token) {
        await this.setAuthToken(session.token);
      }
    } catch (e) {
      console.warn("Error saving session:", e);
    }
  },

  async getSession(): Promise<AuthSession | null> {
    try {
      const data = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Error reading session:", e);
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        CONFIG.STORAGE_KEYS.USER_PROFILE,
        CONFIG.STORAGE_KEYS.USER_ROLE
      ]);
    } catch (e) {
      console.warn("Error clearing session:", e);
    }
  },

  // Language Preference
  async setLanguage(lang: Language): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, lang);
    } catch (e) {
      console.warn("Error saving language:", e);
    }
  },

  async getLanguage(): Promise<Language> {
    try {
      const lang = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE);
      return (lang === "hi" || lang === "en") ? lang : "en";
    } catch (e) {
      return "en";
    }
  },

  // Cache safe non-sensitive data
  async setCache(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`@cache_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn("Error caching data:", e);
    }
  },

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(`@cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }
};

/**
 * Authentication Service
 * Manages OTP generation, verification, and session lifecycle
 */

import { api } from "./api";
import { StorageService } from "./storage";
import { AuthSession, UserRole, CustomerProfile, WorkerProfile } from "../types/auth";

export const AuthService = {
  // Customer OTP Request
  async customerSendOtp(phone: string): Promise<{ success: boolean; message: string; demoOtp?: string }> {
    return api.post("/api/auth/customer/send-otp", { phone });
  },

  // Customer OTP Verification
  async customerVerifyOtp(phone: string, otp: string): Promise<{
    success: boolean;
    token: string;
    isNew: boolean;
    customer: CustomerProfile;
  }> {
    const res = await api.post("/api/auth/customer/verify-otp", { phone, otp });
    if (res.token) {
      const session: AuthSession = {
        token: res.token,
        role: "customer",
        phone,
        name: res.customer?.name || undefined,
        id: res.customer?.id,
        customer: res.customer,
      };
      await StorageService.setSession(session);
    }
    return res;
  },

  // Worker OTP Request
  async workerSendOtp(phone: string): Promise<{ success: boolean; message: string; demoOtp?: string }> {
    return api.post("/api/auth/worker/send-otp", { phone });
  },

  // Worker OTP Verification
  async workerVerifyOtp(phone: string, otp: string): Promise<{
    success: boolean;
    token: string;
    isNew: boolean;
    worker: WorkerProfile;
  }> {
    const res = await api.post("/api/auth/worker/verify-otp", { phone, otp });
    if (res.token) {
      const session: AuthSession = {
        token: res.token,
        role: "worker",
        phone,
        name: res.worker?.name || undefined,
        id: res.worker?.id,
        worker: res.worker,
      };
      await StorageService.setSession(session);
    }
    return res;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      await StorageService.clearSession();
    }
  },

  // Restore active session
  async restoreSession(): Promise<AuthSession | null> {
    return StorageService.getSession();
  }
};

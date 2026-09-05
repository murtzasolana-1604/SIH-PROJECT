/**
 * Authentication Context
 * Manages user session, role switching, and profile synchronization
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthSession, UserRole, CustomerProfile, WorkerProfile } from "../types/auth";
import { AuthService } from "../services/auth";
import { StorageService } from "../services/storage";
import { api } from "../services/api";

interface AuthContextType {
  session: AuthSession | null;
  role: UserRole | null;
  token: string | null;
  customer: CustomerProfile | null;
  worker: WorkerProfile | null;
  isLoading: boolean;
  setRole: (role: UserRole | null) => void;
  loginCustomer: (phone: string, otp: string) => Promise<boolean>;
  loginWorker: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCustomerState: (profile: CustomerProfile) => void;
  updateWorkerState: (worker: WorkerProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app launch
  useEffect(() => {
    async function restore() {
      try {
        const stored = await AuthService.restoreSession();
        if (stored) {
          setSession(stored);
          setRoleState(stored.role);
          if (stored.customer) setCustomer(stored.customer);
          if (stored.worker) setWorker(stored.worker);
        }
      } catch (e) {
        console.warn("Session restore error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
  };

  const loginCustomer = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await AuthService.customerVerifyOtp(phone, otp);
      if (res.success && res.token) {
        const newSession: AuthSession = {
          token: res.token,
          role: "customer",
          phone,
          name: res.customer?.name,
          id: res.customer?.id,
          customer: res.customer,
        };
        setSession(newSession);
        setRoleState("customer");
        setCustomer(res.customer || { phone });
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWorker = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await AuthService.workerVerifyOtp(phone, otp);
      if (res.success && res.token) {
        const newSession: AuthSession = {
          token: res.token,
          role: "worker",
          phone,
          name: res.worker?.name,
          id: res.worker?.id,
          worker: res.worker,
        };
        setSession(newSession);
        setRoleState("worker");
        setWorker(res.worker);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await AuthService.logout();
    setSession(null);
    setRoleState(null);
    setCustomer(null);
    setWorker(null);
  };

  const refreshProfile = async (): Promise<void> => {
    if (!session) return;
    try {
      if (session.role === "customer" && session.phone) {
        const res = await api.get("/api/customer/profile", { phone: session.phone });
        if (res.success && res.customer) {
          setCustomer(res.customer);
          const updated = { ...session, customer: res.customer };
          setSession(updated);
          await StorageService.setSession(updated);
        }
      } else if (session.role === "worker" && session.id) {
        const res = await api.get(`/api/workers/${session.id}/badge`);
        if (res.success && res.badge) {
          const updatedWorker = { ...(worker || {}), ...res.badge } as WorkerProfile;
          setWorker(updatedWorker);
          const updated = { ...session, worker: updatedWorker };
          setSession(updated);
          await StorageService.setSession(updated);
        }
      }
    } catch (e) {
      console.warn("Profile refresh error:", e);
    }
  };

  const updateCustomerState = (profile: CustomerProfile) => {
    setCustomer(profile);
    if (session) {
      const updated = { ...session, customer: profile, name: profile.name };
      setSession(updated);
      StorageService.setSession(updated);
    }
  };

  const updateWorkerState = (w: WorkerProfile) => {
    setWorker(w);
    if (session) {
      const updated = { ...session, worker: w, name: w.name };
      setSession(updated);
      StorageService.setSession(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
        token: session?.token || null,
        customer,
        worker,
        isLoading,
        setRole,
        loginCustomer,
        loginWorker,
        logout,
        refreshProfile,
        updateCustomerState,
        updateWorkerState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

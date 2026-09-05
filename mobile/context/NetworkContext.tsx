/**
 * Network and Server Health Context
 * Monitors connection to Render PostgreSQL backend and handles cold-start states
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

interface NetworkContextType {
  isServerHealthy: boolean;
  isChecking: boolean;
  isRenderWarmingUp: boolean;
  dbType: string | null;
  serverLatency: number | null;
  checkServerHealth: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isServerHealthy, setIsServerHealthy] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [dbType, setDbType] = useState<string | null>(null);
  const [serverLatency, setServerLatency] = useState<number | null>(null);

  const checkServerHealth = async () => {
    setIsChecking(true);
    try {
      const data = await api.get("/api/status");
      if (data && data.database === "connected") {
        setIsServerHealthy(true);
        setDbType(data.dbType || "PostgreSQL");
        setServerLatency(data.latencyMs || 0);
      } else {
        setIsServerHealthy(false);
      }
    } catch (err) {
      console.warn("Server health check warning:", err);
      setIsServerHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isServerHealthy,
        isChecking,
        isRenderWarmingUp: isChecking && !isServerHealthy,
        dbType,
        serverLatency,
        checkServerHealth,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

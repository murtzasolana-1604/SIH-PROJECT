/**
 * Splash Screen
 * Features Sahkaar Connect branding, SIH metadata, and cloud connectivity check
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { THEME } from "../constants/theme";
import { useLanguage } from "../context/LanguageContext";
import { useNetwork } from "../context/NetworkContext";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useLanguage();
  const { isServerHealthy, dbType } = useNetwork();

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoIcon}>🤝</Text>
      </View>

      <Text style={styles.appName}>{t.appName}</Text>
      <Text style={styles.tagline}>{t.sihTagline}</Text>

      <View style={styles.ministryBadge}>
        <Text style={styles.ministryText}>🏛️ {t.ministry}</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={THEME.colors.textInverse} />
        <Text style={styles.loadingText}>
          {dbType ? `Cloud Backend Active (${dbType})` : "Connecting to Cooperative Cloud..."}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: THEME.spacing.xl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.lg,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: THEME.colors.textInverse,
    textAlign: "center",
  },
  tagline: {
    fontSize: THEME.typography.sizes.body,
    color: "#DCFCE7",
    textAlign: "center",
    marginTop: THEME.spacing.xs,
    maxWidth: 280,
  },
  ministryBadge: {
    marginTop: THEME.spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
  },
  ministryText: {
    fontSize: 12,
    color: "#FEF08A",
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
  },
  loadingText: {
    marginTop: THEME.spacing.sm,
    fontSize: 12,
    color: "#E2E8F0",
  },
});

/**
 * Error State Component
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Button } from "./Button";
import { useLanguage } from "../../context/LanguageContext";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      <Text style={styles.title}>Connection Issue</Text>
      <Text style={styles.message}>
        {message || "Unable to retrieve data from Sahkaar Connect server. Please verify network and try again."}
      </Text>
      {onRetry && (
        <Button
          title={t.retry}
          variant="outline"
          onPress={onRetry}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: THEME.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.dangerMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "700",
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  message: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    textAlign: "center",
    marginBottom: THEME.spacing.lg,
    maxWidth: 300,
  },
  button: {
    minWidth: 140,
  },
});

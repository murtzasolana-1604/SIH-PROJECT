/**
 * Loading State Component
 * Features polite loading indicator with Render cold-start explanation
 */

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";

interface LoadingStateProps {
  message?: string;
  isColdStart?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  isColdStart = false,
}) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={THEME.colors.primary} />
      <Text style={styles.message}>{message || t.loading}</Text>
      {isColdStart && (
        <Text style={styles.coldStartNotice}>
          Connecting to Sahkaar Connect secure cloud... First request may take a few seconds to warm up.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: THEME.spacing.hero,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: THEME.spacing.md,
    fontSize: THEME.typography.sizes.body,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
    textAlign: "center",
  },
  coldStartNotice: {
    marginTop: THEME.spacing.sm,
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
  },
});

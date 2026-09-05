/**
 * Empty State Component
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "file-tray-outline",
  title,
  description,
  subtitle,
  actionTitle,
  onAction,
}) => {
  const finalDesc = description || subtitle || "";

  return (
    <View style={styles.container}>
      {icon.length > 2 ? (
        <Ionicons name={icon as any} size={48} color={COLORS.textTertiary} style={styles.icon} />
      ) : (
        <Text style={styles.emojiIcon}>{icon}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {finalDesc ? <Text style={styles.description}>{finalDesc}</Text> : null}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          variant="outline"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.lg,
  },
  icon: {
    marginBottom: SPACING.sm,
  },
  emojiIcon: {
    fontSize: 44,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: SPACING.md,
  },
  button: {
    minWidth: 160,
  },
});

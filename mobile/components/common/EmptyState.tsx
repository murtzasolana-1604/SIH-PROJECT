/**
 * Empty State Component
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📂",
  title,
  description,
  actionTitle,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
    padding: THEME.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: THEME.spacing.lg,
  },
  icon: {
    fontSize: 44,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "700",
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
    textAlign: "center",
  },
  description: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: THEME.spacing.md,
  },
  button: {
    minWidth: 160,
  },
});

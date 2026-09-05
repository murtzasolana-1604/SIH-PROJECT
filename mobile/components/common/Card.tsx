/**
 * Reusable Card Component
 */

import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  variant?: "elevated" | "outlined" | "flat";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = "elevated",
}) => {
  const cardStyle = [
    styles.card,
    variant === "elevated" && THEME.shadows.md,
    variant === "outlined" && styles.outlined,
    variant === "flat" && styles.flat,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.sm,
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: THEME.colors.borderStrong,
  },
  flat: {
    backgroundColor: THEME.colors.background,
    borderWidth: 0,
  },
});

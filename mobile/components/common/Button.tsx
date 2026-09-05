/**
 * Reusable Button Component
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { THEME } from "../../constants/theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return THEME.colors.border;
    switch (variant) {
      case "primary":
        return THEME.colors.primary;
      case "secondary":
        return THEME.colors.secondary;
      case "danger":
        return THEME.colors.danger;
      case "outline":
      case "ghost":
        return "transparent";
      default:
        return THEME.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return THEME.colors.textMuted;
    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        return THEME.colors.textInverse;
      case "outline":
        return THEME.colors.primary;
      case "ghost":
        return THEME.colors.text;
      default:
        return THEME.colors.textInverse;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return disabled ? THEME.colors.border : THEME.colors.primary;
    }
    return "transparent";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1.5 : 0,
        },
        variant !== "outline" && variant !== "ghost" && !disabled && THEME.shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? THEME.colors.primary : THEME.colors.textInverse}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                marginLeft: icon ? THEME.spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: THEME.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: THEME.spacing.xl,
    marginVertical: THEME.spacing.xs,
  },
  text: {
    fontSize: THEME.typography.sizes.body,
    fontWeight: "600",
  },
});

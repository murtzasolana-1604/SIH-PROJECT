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
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants/theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  leftIcon?: any;
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
  leftIcon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.border;
    switch (variant) {
      case "primary":
        return COLORS.primary;
      case "secondary":
        return COLORS.secondary;
      case "danger":
        return COLORS.danger;
      case "outline":
      case "ghost":
        return "transparent";
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textTertiary;
    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        return COLORS.textInverse;
      case "outline":
        return COLORS.primary;
      case "ghost":
        return COLORS.textPrimary;
      default:
        return COLORS.textInverse;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return disabled ? COLORS.border : COLORS.primary;
    }
    return "transparent";
  };

  const textColor = getTextColor();

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
        variant !== "outline" && variant !== "ghost" && !disabled && SHADOWS.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? COLORS.primary : COLORS.textInverse}
        />
      ) : (
        <View style={styles.innerRow}>
          {leftIcon && (
            typeof leftIcon === "string" ? (
              <Ionicons name={leftIcon as any} size={18} color={textColor} style={{ marginRight: SPACING.xs }} />
            ) : leftIcon
          )}
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                marginLeft: (icon || leftIcon) ? SPACING.xs : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
});

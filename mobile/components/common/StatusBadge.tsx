/**
 * Reusable Status Badge Component
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { THEME } from "../../constants/theme";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  style,
}) => {
  const getBadgeStyle = () => {
    const s = (status || "").toLowerCase();
    if (s.includes("completed") || s.includes("paid") || s.includes("online") || s.includes("verified") || s.includes("active")) {
      return {
        bg: THEME.colors.primaryMuted,
        text: THEME.colors.primaryDark,
        border: THEME.colors.primaryLight,
      };
    }
    if (s.includes("progress") || s.includes("assigned")) {
      return {
        bg: THEME.colors.secondaryMuted,
        text: THEME.colors.secondary,
        border: THEME.colors.secondaryLight,
      };
    }
    if (s.includes("pending") || s.includes("offline") || s.includes("busy")) {
      return {
        bg: THEME.colors.accentMuted,
        text: THEME.colors.accent,
        border: THEME.colors.accentLight,
      };
    }
    if (s.includes("cancel") || s.includes("emergency") || s.includes("rejected") || s.includes("suspended")) {
      return {
        bg: THEME.colors.dangerMuted,
        text: THEME.colors.danger,
        border: THEME.colors.dangerLight,
      };
    }
    return {
      bg: THEME.colors.background,
      text: THEME.colors.textSecondary,
      border: THEME.colors.border,
    };
  };

  const badgeTheme = getBadgeStyle();
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeTheme.bg,
          borderColor: badgeTheme.border,
          paddingHorizontal: isSm ? 6 : 10,
          paddingVertical: isSm ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: badgeTheme.text,
            fontSize: isSm ? THEME.typography.sizes.caption - 1 : THEME.typography.sizes.caption,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

/**
 * Customer Service Category Card
 * Displays dynamic fair-wage pricing, icon, and high-demand indicator
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";
import { ServiceItem } from "../../types/booking";

interface ServiceCardProps {
  service: ServiceItem;
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case "Electrician": return "⚡";
      case "Plumber": return "🔧";
      case "Carpenter": return "🪚";
      case "Painter": return "🎨";
      case "Cleaner": return "🧹";
      case "Driver": return "🚗";
      case "Caregiver": return "🩺";
      case "Technician": return "🛠️";
      default: return "🤝";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, THEME.shadows.sm]}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{getIcon(service.name)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{service.name}</Text>
          {service.isHighDemand && (
            <View style={styles.scarcityBadge}>
              <Text style={styles.scarcityText}>⚡ High Demand</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {service.description || "Verified cooperative tradesperson with zero middleman exploitation."}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{service.effectivePrice || service.basePrice}</Text>
          <Text style={styles.priceLabel}>Fair Wage Estimate</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  icon: {
    fontSize: 26,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  scarcityBadge: {
    backgroundColor: THEME.colors.accentMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.accentLight,
  },
  scarcityText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  description: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  price: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "800",
    color: THEME.colors.primary,
    marginRight: 6,
  },
  priceLabel: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textMuted,
    fontWeight: "600",
  },
});

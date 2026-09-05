/**
 * Customer Booking Summary Card
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";
import { Booking } from "../../types/booking";
import { StatusBadge } from "../common/StatusBadge";

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  onPay?: () => void;
  onRate?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  onPay,
  onRate,
}) => {
  const isEmergency = booking.is_emergency === 1;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isEmergency && styles.emergencyBorder,
        THEME.shadows.sm,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.idContainer}>
          <Text style={styles.serviceName}>{booking.service}</Text>
          <Text style={styles.bookingId}>#{booking.id}</Text>
        </View>
        <View style={styles.badgeGroup}>
          {isEmergency && (
            <View style={styles.emergencyPill}>
              <Text style={styles.emergencyText}>🚨 SOS</Text>
            </View>
          )}
          <StatusBadge status={booking.status} size="sm" />
        </View>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailText}>
          📅 {booking.booking_date} • ⏰ {booking.booking_time}
        </Text>
      </View>

      <View style={styles.addressRow}>
        <Text style={styles.addressText} numberOfLines={1}>
          📍 {booking.address}
        </Text>
      </View>

      {booking.worker_name ? (
        <View style={styles.workerRow}>
          <Text style={styles.workerLabel}>Assigned Member:</Text>
          <Text style={styles.workerName}>
            👤 {booking.worker_name} ({booking.worker_skill || booking.service})
          </Text>
        </View>
      ) : (
        <View style={styles.workerRow}>
          <Text style={styles.unassignedText}>
            ⏳ Routing to nearest verified cooperative member...
          </Text>
        </View>
      )}

      {booking.status === "Completed" && (
        <View style={styles.actionRow}>
          {onPay && (
            <TouchableOpacity onPress={onPay} style={styles.payAction}>
              <Text style={styles.payText}>💳 Settle via UPI</Text>
            </TouchableOpacity>
          )}
          {onRate && (
            <TouchableOpacity onPress={onRate} style={styles.rateAction}>
              <Text style={styles.rateText}>★ Rate Service</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emergencyBorder: {
    borderColor: THEME.colors.dangerLight,
    backgroundColor: "#FFF5F5",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  serviceName: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "700",
    color: THEME.colors.text,
    marginRight: 6,
  },
  bookingId: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textMuted,
    fontWeight: "600",
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyPill: {
    backgroundColor: THEME.colors.dangerMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.full,
    marginRight: 6,
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: "800",
    color: THEME.colors.danger,
  },
  detailRow: {
    marginTop: THEME.spacing.xs,
  },
  detailText: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    fontWeight: "500",
  },
  addressRow: {
    marginTop: 3,
  },
  addressText: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textMuted,
  },
  workerRow: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  workerLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  workerName: {
    fontSize: THEME.typography.sizes.subtext,
    fontWeight: "600",
    color: THEME.colors.primaryDark,
    marginTop: 1,
  },
  unassignedText: {
    fontSize: 12,
    fontStyle: "italic",
    color: THEME.colors.accent,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    justifyContent: "flex-end",
  },
  payAction: {
    backgroundColor: THEME.colors.secondaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    marginLeft: THEME.spacing.sm,
  },
  payText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.secondary,
  },
  rateAction: {
    backgroundColor: THEME.colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    marginLeft: THEME.spacing.sm,
  },
  rateText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.primaryDark,
  },
});

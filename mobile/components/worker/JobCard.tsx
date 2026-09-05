/**
 * Worker Job Card Component
 * Manages job workflow: Accept -> Start -> Complete
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME, COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants/theme";
import { Booking } from "../../types/booking";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../common/Button";

export interface JobCardProps {
  job?: Booking;
  booking?: Booking;
  onPress: () => void;
  onAccept?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  loadingAction?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  booking,
  onPress,
  onAccept,
  onStart,
  onComplete,
  loadingAction = false,
}) => {
  const b = booking || job;
  if (!b) return null;

  const isEmergency = b.is_emergency === 1 || b.isEmergency === true || b.isEmergency === 1;
  const statusStr = String(b.status || "").toLowerCase();

  const customerName = b.customerName || b.customer_name || "Citizen";
  const address = b.address || "";
  const dateStr = b.bookingDate || b.booking_date || "";
  const timeStr = b.bookingTime || b.booking_time || "";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isEmergency && styles.emergencyBorder,
        SHADOWS.sm,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.serviceName}>{b.service}</Text>
          <Text style={styles.jobId}>#{String(b.id).slice(0, 8)}</Text>
        </View>
        <View style={styles.badgeGroup}>
          {isEmergency && (
            <View style={styles.emergencyPill}>
              <Text style={styles.emergencyText}>🚨 SOS</Text>
            </View>
          )}
          <StatusBadge status={b.status as any} size="sm" />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.customerName}>👤 {customerName}</Text>
        <Text style={styles.address} numberOfLines={2}>
          📍 {address}
        </Text>
        <Text style={styles.timeSlot}>
          📅 {dateStr} • ⏰ {timeStr}
        </Text>
      </View>

      <View style={styles.actionRow}>
        {statusStr === "pending" && onAccept && (
          <Button
            title="Accept Request"
            variant="primary"
            onPress={onAccept}
            loading={loadingAction}
            style={styles.actionBtn}
          />
        )}
        {(statusStr === "confirmed" || statusStr === "assigned") && onStart && (
          <Button
            title="Start Work (On-Site)"
            variant="secondary"
            onPress={onStart}
            loading={loadingAction}
            style={styles.actionBtn}
          />
        )}
        {statusStr === "in_progress" && onComplete && (
          <Button
            title="Complete & Invoice"
            variant="primary"
            onPress={onComplete}
            loading={loadingAction}
            style={styles.actionBtn}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emergencyBorder: {
    borderColor: COLORS.danger,
    backgroundColor: "#FFF5F5",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCol: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  serviceName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  jobId: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    fontWeight: "600",
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyPill: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginRight: 6,
  },
  emergencyText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.danger,
  },
  infoSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeSlot: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primaryDark,
    fontWeight: "600",
    marginTop: 3,
  },
  actionRow: {
    marginTop: SPACING.sm,
  },
  actionBtn: {
    height: 40,
    marginVertical: 0,
  },
});

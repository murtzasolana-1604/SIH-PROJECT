/**
 * Worker Job Card Component
 * Manages job workflow: Accept -> Start -> Complete
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";
import { Booking } from "../../types/booking";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../common/Button";

interface JobCardProps {
  job: Booking;
  onPress: () => void;
  onAccept?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  loadingAction?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onAccept,
  onStart,
  onComplete,
  loadingAction = false,
}) => {
  const isEmergency = job.is_emergency === 1;

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
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.serviceName}>{job.service}</Text>
          <Text style={styles.jobId}>Job #{job.id}</Text>
        </View>
        <View style={styles.badgeGroup}>
          {isEmergency && (
            <View style={styles.emergencyPill}>
              <Text style={styles.emergencyText}>🚨 SOS PRIORITY</Text>
            </View>
          )}
          <StatusBadge status={job.status} size="sm" />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.customerName}>👤 Citizen: {job.customer_name}</Text>
        <Text style={styles.address} numberOfLines={2}>
          📍 {job.address}
        </Text>
        <Text style={styles.timeSlot}>
          📅 {job.booking_date} • ⏰ {job.booking_time}
        </Text>
      </View>

      <View style={styles.actionRow}>
        {job.status === "Pending" && onAccept && (
          <Button
            title="Accept Request"
            variant="primary"
            onPress={onAccept}
            loading={loadingAction}
            style={styles.actionBtn}
          />
        )}
        {job.status === "Assigned" && onStart && (
          <Button
            title="Start Work (On-Site)"
            variant="secondary"
            onPress={onStart}
            loading={loadingAction}
            style={styles.actionBtn}
          />
        )}
        {job.status === "In Progress" && onComplete && (
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
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emergencyBorder: {
    borderColor: THEME.colors.danger,
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
    fontSize: THEME.typography.sizes.title,
    fontWeight: "700",
    color: THEME.colors.text,
    marginRight: 6,
  },
  jobId: {
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
    fontSize: 9,
    fontWeight: "800",
    color: THEME.colors.danger,
  },
  infoSection: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  customerName: {
    fontSize: THEME.typography.sizes.subtext,
    fontWeight: "600",
    color: THEME.colors.text,
  },
  address: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  timeSlot: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.primaryDark,
    fontWeight: "600",
    marginTop: 3,
  },
  actionRow: {
    marginTop: THEME.spacing.sm,
  },
  actionBtn: {
    height: 40,
    marginVertical: 0,
  },
});

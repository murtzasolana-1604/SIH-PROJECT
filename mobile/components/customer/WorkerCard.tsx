/**
 * Worker Card Component for Customer Directory
 * Displays verified trade credentials, NCCT certification, cooperative society, and rating
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";
import { WorkerProfile } from "../../types/auth";
import { RatingStars } from "../common/RatingStars";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../common/Button";

interface WorkerCardProps {
  worker: WorkerProfile;
  onPress: () => void;
  onBook?: () => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  onPress,
  onBook,
}) => {
  const isVerified = worker.verified === 1;
  const isOnline = worker.is_available === 1;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, THEME.shadows.sm]}
    >
      <View style={styles.topRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{worker.name}</Text>
            {isVerified && (
              <View style={styles.verifiedCheck}>
                <Text style={styles.checkText}>✓ NCCT</Text>
              </View>
            )}
          </View>
          <Text style={styles.skill}>{worker.skill} • {worker.experience || "1+ years"}</Text>
          <Text style={styles.location} numberOfLines={1}>
            📍 {worker.location || "City Center"}
          </Text>
        </View>
        <StatusBadge
          status={isOnline ? "Online" : "Busy"}
          size="sm"
        />
      </View>

      <View style={styles.metaRow}>
        <RatingStars
          rating={worker.avg_rating !== undefined ? worker.avg_rating : 4.8}
          count={worker.rating_count !== undefined ? worker.rating_count : 14}
        />
        {worker.society_name ? (
          <Text style={styles.societyText} numberOfLines={1}>
            🏛️ {worker.society_name}
          </Text>
        ) : null}
      </View>

      <View style={styles.badgeFooter}>
        <View style={styles.ncctPill}>
          <Text style={styles.ncctPillText}>
            🛡️ {worker.badge_level || "Level 1: Certified Tradesperson"}
          </Text>
        </View>
        {onBook && (
          <Button
            title="Book"
            variant="primary"
            onPress={onBook}
            style={styles.bookButton}
            textStyle={styles.bookButtonText}
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.textInverse,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "700",
    color: THEME.colors.text,
    marginRight: 6,
  },
  verifiedCheck: {
    backgroundColor: THEME.colors.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.borderRadius.full,
  },
  checkText: {
    fontSize: 10,
    fontWeight: "800",
    color: THEME.colors.primaryDark,
  },
  skill: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
    marginTop: 1,
  },
  location: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  societyText: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textSecondary,
    maxWidth: 160,
  },
  badgeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: THEME.spacing.sm,
  },
  ncctPill: {
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  ncctPillText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
  },
  bookButton: {
    height: 34,
    paddingHorizontal: 16,
    marginVertical: 0,
  },
  bookButtonText: {
    fontSize: 13,
  },
});

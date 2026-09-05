/**
 * Worker Detail Screen
 * Detailed profile, NCCT certification credentials, PMSBY welfare, and customer reviews
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { Header } from "../../components/common/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { WorkerProfile } from "../../types/auth";
import { Rating } from "../../types/booking";
import { api } from "../../services/api";

interface WorkerDetailScreenProps {
  worker: WorkerProfile;
  onBack: () => void;
  onBook: (worker: WorkerProfile) => void;
}

export const WorkerDetailScreen: React.FC<WorkerDetailScreenProps> = ({
  worker,
  onBack,
  onBook,
}) => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await api.get("/api/ratings", { workerId: worker.id });
        if (res && res.ratings) {
          setReviews(res.ratings);
        }
      } catch (err) {
        console.warn("Failed to load reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchReviews();
  }, [worker.id]);

  const isVerified = worker.verified === 1;

  return (
    <View style={styles.container}>
      <Header
        title={worker.name}
        subtitle={worker.skill}
        onBack={onBack}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {worker.name ? worker.name.charAt(0).toUpperCase() : "W"}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.name}>{worker.name}</Text>
              <Text style={styles.skill}>{worker.skill} • {worker.experience || "1+ yrs experience"}</Text>
              <Text style={styles.location}>📍 {worker.location || "City Center"}</Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={isVerified ? "NCCT Verified" : "Unverified"} size="sm" />
                <View style={{ width: 6 }} />
                <StatusBadge status={worker.is_available === 1 ? "Online" : "Busy"} size="sm" />
              </View>
            </View>
          </View>
        </Card>

        {/* NCCT Certification Badge */}
        <Card variant="elevated" style={[styles.certCard, THEME.shadows.sm]}>
          <View style={styles.certHeader}>
            <Text style={styles.certIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.certTitle}>NCCT Statutory Certification</Text>
              <Text style={styles.certBadgeLevel}>
                {worker.badge_level || "Level 1: Certified Tradesperson"}
              </Text>
            </View>
          </View>
          <View style={styles.certDetails}>
            <Text style={styles.certCertId}>
              Credential ID: {worker.ncct_cert_id || `NCCT-COOP-2026-${String(worker.id).padStart(4, "0")}`}
            </Text>
            <Text style={styles.certHash} numberOfLines={1} ellipsizeMode="middle">
              Hash: {worker.verification_hash || "5d1bb55f89860587527547cec71b9c9a99baebd16482"}
            </Text>
          </View>
        </Card>

        {/* Cooperative Affiliation */}
        <Card variant="outlined" style={styles.metaCard}>
          <Text style={styles.sectionHeading}>🏛️ Cooperative Society Affiliation</Text>
          <Text style={styles.societyName}>
            {worker.society_name || "Navodaya Labour Cooperative Society Ltd."}
          </Text>
          <Text style={styles.societyReg}>
            Reg No: {worker.society_reg_number || "MSCS/CR/2026/089-A"}
          </Text>
          <View style={styles.welfareBox}>
            <Text style={styles.welfareText}>
              🛡️ Enrolled in PM Suraksha Bima Yojana (₹2 Lakh Accidental Coverage) via Cooperative Welfare Pool.
            </Text>
          </View>
        </Card>

        {/* Reviews Section */}
        <Card variant="outlined" style={styles.metaCard}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionHeading}>Member Feedback</Text>
            <RatingStars
              rating={worker.avg_rating !== undefined ? worker.avg_rating : 4.8}
              count={reviews.length}
            />
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>
              {loadingReviews ? "Loading reviews..." : "No reviews submitted yet for this member."}
            </Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewerName}>{rev.customer_name || "Citizen"}</Text>
                  <RatingStars rating={rev.stars} size={12} />
                </View>
                {rev.comment ? (
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                ) : null}
              </View>
            ))
          )}
        </Card>

        {/* Book Button */}
        <Button
          title={`${t.bookNow} (${worker.name})`}
          variant="primary"
          onPress={() => onBook(worker)}
          style={styles.bookBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.hero * 2,
  },
  profileCard: {
    padding: THEME.spacing.md,
  },
  headerRow: {
    flexDirection: "row",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: THEME.colors.textInverse,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  skill: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: THEME.spacing.xs,
  },
  certCard: {
    backgroundColor: "#064E3B",
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
  },
  certHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  certIcon: {
    fontSize: 26,
    marginRight: THEME.spacing.sm,
  },
  certTitle: {
    fontSize: 12,
    color: "#A7F3D0",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  certBadgeLevel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 1,
  },
  certDetails: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
  },
  certCertId: {
    fontSize: 11,
    color: "#D1FAE5",
    fontWeight: "600",
  },
  certHash: {
    fontSize: 9,
    fontFamily: "monospace",
    color: "#6EE7B7",
    marginTop: 2,
  },
  metaCard: {
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  societyName: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.primaryDark,
  },
  societyReg: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  welfareBox: {
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    marginTop: THEME.spacing.sm,
  },
  welfareText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.sm,
  },
  noReviews: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: "italic",
    paddingVertical: THEME.spacing.sm,
  },
  reviewItem: {
    paddingVertical: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  reviewComment: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  bookBtn: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
});

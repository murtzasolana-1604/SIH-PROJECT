/**
 * Role Selection Screen
 * "Who are you?" — Customer vs Cooperative Worker
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";
import { useLanguage } from "../context/LanguageContext";
import { Header } from "../components/common/Header";
import { Card } from "../components/common/Card";
import { UserRole } from "../types/auth";

interface RoleSelectScreenProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({ onSelectRole }) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Header
        title={t.appName}
        subtitle={t.ministry}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heading}>{t.whoAreYou}</Text>
          <Text style={styles.subheading}>{t.chooseRoleSubtitle}</Text>
        </View>

        {/* Customer Role Card */}
        <Card
          variant="elevated"
          onPress={() => onSelectRole("customer")}
          style={styles.roleCard}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: THEME.colors.primaryMuted }]}>
              <Text style={styles.roleIcon}>🏠</Text>
            </View>
            <View style={styles.cardTitleCol}>
              <Text style={styles.roleTitle}>{t.customerRoleTitle}</Text>
              <Text style={styles.roleSubtitle}>Household & Community Services</Text>
            </View>
          </View>
          <Text style={styles.roleDesc}>{t.customerRoleDesc}</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ 100% NCCT Skill Certified & Verified Members</Text>
            <Text style={styles.featureItem}>✓ Fair Transparent Pricing — 0% Surge Exploitation</Text>
            <Text style={styles.featureItem}>✓ 1-Click Emergency SOS Breakdown Response</Text>
          </View>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: THEME.colors.primary }]}
            onPress={() => onSelectRole("customer")}
          >
            <Text style={styles.continueButtonText}>{t.continueAsCustomer} →</Text>
          </TouchableOpacity>
        </Card>

        {/* Worker Role Card */}
        <Card
          variant="elevated"
          onPress={() => onSelectRole("worker")}
          style={[styles.roleCard, styles.workerBorder]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: THEME.colors.secondaryMuted }]}>
              <Text style={styles.roleIcon}>👷</Text>
            </View>
            <View style={styles.cardTitleCol}>
              <Text style={styles.roleTitle}>{t.workerRoleTitle}</Text>
              <Text style={styles.roleSubtitle}>Cooperative Member Dashboard</Text>
            </View>
          </View>
          <Text style={styles.roleDesc}>{t.workerRoleDesc}</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ 85% Direct Living Wage Take-Home</Text>
            <Text style={styles.featureItem}>✓ ₹2,00,000 PMSBY Accidental Insurance Cover</Text>
            <Text style={styles.featureItem}>✓ Democratic Cooperative Society Membership</Text>
          </View>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: THEME.colors.secondary }]}
            onPress={() => onSelectRole("worker")}
          >
            <Text style={styles.continueButtonText}>{t.continueAsWorker} →</Text>
          </TouchableOpacity>
        </Card>

        {/* SIH Governance Footer */}
        <View style={styles.governanceFooter}>
          <Text style={styles.governanceText}>
            Smart India Hackathon 2026 • Problem Statement SIH26089
          </Text>
          <Text style={styles.governanceSubtext}>
            NCCT Certified • Democratic Multi-State Cooperative Framework
          </Text>
        </View>
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
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.hero,
  },
  heroSection: {
    marginVertical: THEME.spacing.md,
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.colors.text,
    textAlign: "center",
  },
  subheading: {
    fontSize: THEME.typography.sizes.body,
    color: THEME.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  roleCard: {
    marginVertical: THEME.spacing.sm,
    padding: THEME.spacing.lg,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  workerBorder: {
    borderColor: THEME.colors.secondaryLight,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: THEME.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  roleIcon: {
    fontSize: 28,
  },
  cardTitleCol: {
    flex: 1,
  },
  roleTitle: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  roleSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: "600",
    marginTop: 1,
  },
  roleDesc: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
  },
  featureList: {
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  featureItem: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
    marginVertical: 2,
  },
  continueButton: {
    height: 44,
    borderRadius: THEME.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    fontSize: THEME.typography.sizes.body,
    fontWeight: "700",
    color: THEME.colors.textInverse,
  },
  governanceFooter: {
    marginTop: THEME.spacing.xl,
    alignItems: "center",
  },
  governanceText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textMuted,
    textAlign: "center",
  },
  governanceSubtext: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
});

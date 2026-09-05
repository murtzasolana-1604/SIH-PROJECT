/**
 * Worker Earnings Breakdown Card
 * Displays 85% living wage take-home vs 15% cooperative welfare & PMSBY allocation
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";

interface EarningsCardProps {
  todayEarnings: number;
  weekEarnings: number;
  totalEarnings: number;
  totalCoopShare?: number;
  completedJobsCount: number;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  todayEarnings,
  weekEarnings,
  totalEarnings,
  totalCoopShare = 0,
  completedJobsCount,
}) => {
  return (
    <View style={[styles.card, THEME.shadows.md]}>
      <View style={styles.topSection}>
        <Text style={styles.label}>Today's Direct Take-Home (85%)</Text>
        <Text style={styles.todayAmount}>₹{todayEarnings.toFixed(2)}</Text>
        <Text style={styles.zeroCommission}>0% Exploitative Private Platform Cut</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>7-Day Earnings</Text>
          <Text style={styles.statValue}>₹{weekEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Payouts</Text>
          <Text style={styles.statValue}>₹{totalEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Jobs Done</Text>
          <Text style={styles.statValue}>{completedJobsCount}</Text>
        </View>
      </View>

      <View style={styles.footerBanner}>
        <Text style={styles.footerText}>
          🛡️ ₹{totalCoopShare.toFixed(2)} contributed to your NCCT PMSBY Insurance & Welfare Fund.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.primaryDark,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.sm,
  },
  topSection: {
    alignItems: "center",
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
  },
  label: {
    fontSize: THEME.typography.sizes.caption,
    color: "#BBF7D0",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: THEME.colors.textInverse,
    marginVertical: 4,
  },
  zeroCommission: {
    fontSize: 12,
    color: "#86EFAC",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: THEME.spacing.md,
  },
  statCol: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#D1D5DB",
  },
  statValue: {
    fontSize: THEME.typography.sizes.body,
    fontWeight: "700",
    color: THEME.colors.textInverse,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  footerBanner: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#F3F4F6",
    textAlign: "center",
  },
});

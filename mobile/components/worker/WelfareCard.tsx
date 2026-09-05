/**
 * Worker PMSBY Insurance & Welfare Certificate Card
 * Displays Pradhan Mantri Suraksha Bima Yojana policy and verification hash
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "../../constants/theme";

interface WelfareCardProps {
  policyNumber?: string;
  coverageAmount?: number;
  status?: string;
  validTo?: string;
  certHash?: string;
  societyName?: string;
}

export const WelfareCard: React.FC<WelfareCardProps> = ({
  policyNumber = "PMSBY-2026-COOP-0006",
  coverageAmount = 200000,
  status = "ACTIVE",
  validTo = "2027-05-31",
  certHash = "e9f7823cba992384102934",
  societyName,
}) => {
  return (
    <View style={[styles.card, THEME.shadows.md]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.schemeName}>Pradhan Mantri Suraksha Bima Yojana</Text>
          <Text style={styles.schemeSubtitle}>Cooperative Subsidized Accidental Protection</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>● {status}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.coverageBox}>
          <Text style={styles.coverageLabel}>Statutory Protection Cover</Text>
          <Text style={styles.coverageAmount}>₹{coverageAmount.toLocaleString("en-IN")}</Text>
          <Text style={styles.premiumNote}>100% Annual Premium Sponsored by Cooperative Fund</Text>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Policy Number</Text>
            <Text style={styles.metaValue}>{policyNumber}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Valid Until</Text>
            <Text style={styles.metaValue}>{validTo}</Text>
          </View>
        </View>

        {societyName && (
          <View style={styles.societyRow}>
            <Text style={styles.societyLabel}>Affiliated Society:</Text>
            <Text style={styles.societyName}>{societyName}</Text>
          </View>
        )}

        <View style={styles.hashBox}>
          <Text style={styles.hashLabel}>NCCT Cryptographic Certificate Hash:</Text>
          <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
            {certHash}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#064E3B",
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.sm,
    borderWidth: 1.5,
    borderColor: "#059669",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
    paddingBottom: THEME.spacing.sm,
  },
  schemeName: {
    fontSize: THEME.typography.sizes.body,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  schemeSubtitle: {
    fontSize: 11,
    color: "#A7F3D0",
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: "#34D399",
  },
  activeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#34D399",
  },
  body: {
    marginTop: THEME.spacing.md,
  },
  coverageBox: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: "center",
  },
  coverageLabel: {
    fontSize: 11,
    color: "#D1FAE5",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  coverageAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FDE047",
    marginVertical: 2,
  },
  premiumNote: {
    fontSize: 11,
    color: "#6EE7B7",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: THEME.spacing.md,
  },
  metaLabel: {
    fontSize: 10,
    color: "#A7F3D0",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  societyRow: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  societyLabel: {
    fontSize: 10,
    color: "#A7F3D0",
  },
  societyName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 1,
  },
  hashBox: {
    marginTop: THEME.spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 6,
    borderRadius: THEME.borderRadius.xs,
  },
  hashLabel: {
    fontSize: 9,
    color: "#6EE7B7",
  },
  hashValue: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#D1D5DB",
    marginTop: 1,
  },
});

/**
 * Worker PMSBY Insurance & Welfare Certificate Card
 * Displays Pradhan Mantri Suraksha Bima Yojana policy and verification hash
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";
import { WorkerWelfareDetails } from "../../types/booking";

export interface WelfareCardProps {
  welfare?: WorkerWelfareDetails;
  onDownloadCertificate?: () => void;
  policyNumber?: string;
  coverageAmount?: number;
  status?: string;
  validTo?: string;
  certHash?: string;
  societyName?: string;
}

export const WelfareCard: React.FC<WelfareCardProps> = ({
  welfare,
  onDownloadCertificate,
  policyNumber,
  coverageAmount,
  status,
  validTo,
  certHash,
  societyName,
}) => {
  const finalPolicyNumber = welfare?.pmsbyPolicyNumber || welfare?.policy?.policyNumber || policyNumber || "PMSBY-2026-COOP-0006";
  const finalCoverageAmount = welfare?.coverageAmount || welfare?.policy?.coverageAmount || coverageAmount || 200000;
  const finalStatus = welfare?.pmsbyStatus || welfare?.policy?.status || status || "ACTIVE";
  const finalValidTo = welfare?.validUntil || welfare?.policy?.validTo || validTo || "2027-05-31";
  const finalCertHash = welfare?.certificateHash || welfare?.policy?.certificateHash || certHash || "e9f7823cba992384102934";
  const finalSocietyName = welfare?.society?.name || societyName;

  return (
    <View style={[styles.card, THEME.shadows.md]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.schemeName}>Pradhan Mantri Suraksha Bima Yojana</Text>
          <Text style={styles.schemeSubtitle}>Cooperative Subsidized Accidental Protection</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>● {finalStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.coverageBox}>
          <Text style={styles.coverageLabel}>Statutory Protection Cover</Text>
          <Text style={styles.coverageAmount}>₹{(finalCoverageAmount ?? 200000).toLocaleString("en-IN")}</Text>
          <Text style={styles.premiumNote}>100% Annual Premium Sponsored by Cooperative Fund</Text>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Policy Number</Text>
            <Text style={styles.metaValue}>{finalPolicyNumber}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Valid Until</Text>
            <Text style={styles.metaValue}>{finalValidTo}</Text>
          </View>
        </View>

        {finalSocietyName && (
          <View style={styles.societyRow}>
            <Text style={styles.societyLabel}>Affiliated Society:</Text>
            <Text style={styles.societyName}>{finalSocietyName}</Text>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.7} onPress={onDownloadCertificate} style={styles.hashBox}>
          <Text style={styles.hashLabel}>NCCT Cryptographic Certificate Hash:</Text>
          <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
            {finalCertHash}
          </Text>
        </TouchableOpacity>
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

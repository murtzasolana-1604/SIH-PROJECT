/**
 * Customer Login Screen
 * Request OTP via registered 10-digit mobile number
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { Header } from "../../components/common/Header";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { AuthService } from "../../services/auth";

interface CustomerLoginScreenProps {
  onBack: () => void;
  onOtpSent: (phone: string) => void;
}

export const CustomerLoginScreen: React.FC<CustomerLoginScreenProps> = ({
  onBack,
  onOtpSent,
}) => {
  const { t } = useLanguage();
  const [phone, setPhone] = useState<string>("9876543210"); // Pre-filled with demo citizen
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSendOtp = async () => {
    setError("");
    const clean = phone.trim();
    if (!clean || clean.length !== 10 || !/^[0-9]+$/.test(clean)) {
      setError(t.invalidPhone);
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.customerSendOtp(clean);
      if (res.success) {
        onOtpSent(clean);
      } else {
        setError(res.message || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header
        title={t.customerRoleTitle}
        subtitle="Citizen Access"
        onBack={onBack}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <Text style={styles.title}>{t.enterPhone}</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to access verified cooperative tradespeople.
          </Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <Input
            label={t.enterPhone}
            placeholder={t.phonePlaceholder}
            value={phone}
            onChangeText={(val) => {
              setPhone(val);
              if (error) setError("");
            }}
            keyboardType="number-pad"
            maxLength={10}
            error={error}
            helper="Demo Citizen Account: 9876543210"
          />

          <View style={styles.demoNoticeBox}>
            <Text style={styles.demoNoticeBadge}>PROTOTYPE DEMO</Text>
            <Text style={styles.demoNoticeText}>{t.demoOtpNotice}</Text>
          </View>

          <Button
            title={t.sendOtp}
            variant="primary"
            onPress={handleSendOtp}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: THEME.spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },
  formCard: {
    padding: THEME.spacing.lg,
  },
  demoNoticeBox: {
    backgroundColor: THEME.colors.accentMuted,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    marginVertical: THEME.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  demoNoticeBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: THEME.colors.accent,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 6,
  },
  demoNoticeText: {
    fontSize: 11,
    color: THEME.colors.accent,
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: THEME.spacing.md,
  },
});

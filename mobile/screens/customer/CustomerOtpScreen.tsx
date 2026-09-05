/**
 * Customer OTP Verification Screen
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/common/Header";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";

interface CustomerOtpScreenProps {
  phone: string;
  onBack: () => void;
  onSuccess: (isNew: boolean) => void;
}

export const CustomerOtpScreen: React.FC<CustomerOtpScreenProps> = ({
  phone,
  onBack,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { loginCustomer } = useAuth();
  const [otp, setOtp] = useState<string>("123456"); // Pre-filled with demo OTP
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleVerify = async () => {
    setError("");
    if (!otp.trim() || otp.trim().length !== 6) {
      setError(t.invalidOtp);
      return;
    }

    setLoading(true);
    try {
      const ok = await loginCustomer(phone, otp.trim());
      if (ok) {
        onSuccess(false);
      } else {
        setError("Invalid OTP. Please check the code and try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
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
        title={t.enterOtp}
        subtitle={`+91 ${phone}`}
        onBack={onBack}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔐</Text>
          </View>
          <Text style={styles.title}>{t.enterOtp}</Text>
          <Text style={styles.subtitle}>
            {t.otpSubtitle} {phone}
          </Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <Input
            label={t.enterOtp}
            placeholder="6-digit OTP (e.g. 123456)"
            value={otp}
            onChangeText={(val) => {
              setOtp(val);
              if (error) setError("");
            }}
            keyboardType="number-pad"
            maxLength={6}
            error={error}
            helper="Demo Prototype OTP: 123456"
          />

          <View style={styles.demoNoticeBox}>
            <Text style={styles.demoNoticeBadge}>PROTOTYPE DEMO</Text>
            <Text style={styles.demoNoticeText}>Auto-filled with demo OTP 123456</Text>
          </View>

          <Button
            title={t.verifyOtp}
            variant="primary"
            onPress={handleVerify}
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
    fontSize: 30,
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

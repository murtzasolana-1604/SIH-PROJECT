import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { CONFIG } from '../../constants/config';
import { authService } from '../../services/auth';

interface Props {
  phone: string;
  onBack: () => void;
  onSuccess: (needsOnboarding: boolean) => void;
}

export const WorkerOtpScreen: React.FC<Props> = ({ phone, onBack, onSuccess }) => {
  const { t, language } = useLanguage();
  const { loginWorker } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    const cleaned = otp.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setError(language === 'hi' ? 'कृपया 6-अंकीय ओटीपी दर्ज करें' : 'Please enter 6-digit OTP');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const session = await loginWorker(phone, cleaned);
      const isNew = !session.workerProfile?.name || !session.workerProfile?.skills?.length;
      onSuccess(isNew);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      await authService.workerSendOtp(phone);
      setTimer(30);
      Alert.alert(
        language === 'hi' ? 'ओटीपी पुनः भेजा गया' : 'OTP Resent',
        language === 'hi'
          ? 'नया ओटीपी आपके पंजीकृत नंबर पर भेज दिया गया है।'
          : 'A fresh OTP has been sent to your mobile.'
      );
    } catch {
      Alert.alert(t.error, 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleFillDemo = () => {
    setOtp(CONFIG.DEMO_OTP);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title={t.verifyOtp} onBack={onBack} />

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={28} color={COLORS.secondary} />
          </View>

          <Text style={styles.title}>{t.verifyOtp}</Text>
          <Text style={styles.subtitle}>
            {language === 'hi'
              ? `मोबाइल नंबर +91 ${phone} पर भेजा गया कोड दर्ज करें`
              : `Enter the code sent to mobile +91 ${phone}`}
          </Text>

          <Input
            label={t.enterOtp}
            placeholder="• • • • • •"
            value={otp}
            onChangeText={(txt) => {
              setOtp(txt);
              if (error) setError(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon="lock-closed-outline"
            error={error || undefined}
          />

          <Button
            title={t.verify}
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyBtn}
          />

          <TouchableOpacity style={styles.demoFillBtn} onPress={handleFillDemo}>
            <Ionicons name="flash-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.demoFillText}>
              {language === 'hi' ? `डेमो कोड भरें (${CONFIG.DEMO_OTP})` : `Fill Demo OTP (${CONFIG.DEMO_OTP})`}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendPrompt}>
              {language === 'hi' ? 'कोड नहीं मिला?' : "Didn't receive code?"}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0 || resending}>
              <Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                {timer > 0
                  ? `${t.resendOtp} (${timer}s)`
                  : resending
                  ? '...'
                  : t.resendOtp}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  card: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  verifyBtn: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  demoFillText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  resendPrompt: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: COLORS.textTertiary,
  },
});

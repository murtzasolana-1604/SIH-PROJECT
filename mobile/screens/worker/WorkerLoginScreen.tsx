import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { authService } from '../../services/auth';
import { CONFIG } from '../../constants/config';

interface Props {
  onBack: () => void;
  onOtpSent: (phone: string) => void;
}

export const WorkerLoginScreen: React.FC<Props> = ({ onBack, onOtpSent }) => {
  const { t, language } = useLanguage();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError(language === 'hi' ? 'कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authService.workerSendOtp(cleaned);
      onOtpSent(cleaned);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setPhone(CONFIG.DEMO_WORKER_PHONE);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title={t.workerLogin} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Worker Badge Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="briefcase" size={28} color={COLORS.secondary} />
          </View>
          <Text style={styles.bannerTitle}>
            {language === 'hi' ? 'सहकारी कामगार पोर्टल' : 'Cooperative Worker Portal'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {language === 'hi'
              ? '85% सीधी कमाई, पीएम सुरक्षा बीमा योजना और सहकारी कल्याण लाभ'
              : '85% Direct Living Wage, PMSBY Insurance & Cooperative Welfare'}
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>{t.enterMobile}</Text>
          <Text style={styles.formSubtitle}>
            {language === 'hi'
              ? 'हम आपके पंजीकृत मोबाइल नंबर पर 6-अंकीय सत्यापन कोड भेजेंगे'
              : 'We will send a 6-digit verification code to your registered mobile'}
          </Text>

          <Input
            label={t.phone}
            placeholder="98765 43210"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (error) setError(null);
            }}
            keyboardType="phone-pad"
            maxLength={10}
            leftIcon="call-outline"
            error={error || undefined}
          />

          <Button
            title={t.sendOtp}
            onPress={handleSendOtp}
            loading={loading}
            style={styles.actionBtn}
          />

          {/* Demo Account Helper */}
          <TouchableOpacity style={styles.demoBox} onPress={handleUseDemo}>
            <View style={styles.demoIcon}>
              <Ionicons name="flash" size={16} color={COLORS.secondary} />
            </View>
            <View style={styles.demoTextCol}>
              <Text style={styles.demoTitle}>
                {language === 'hi' ? 'डेमो कामगार खाता प्रयोग करें' : 'Quick Demo Worker Login'}
              </Text>
              <Text style={styles.demoSubtitle}>
                {language === 'hi'
                  ? `नंबर: ${CONFIG.DEMO_WORKER_PHONE} • ओटीपी: ${CONFIG.DEMO_OTP}`
                  : `Mobile: ${CONFIG.DEMO_WORKER_PHONE} • OTP: ${CONFIG.DEMO_OTP}`}
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Co-op Benefits Highlights */}
        <Card style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>
            {language === 'hi' ? 'सहकार कामगार लाभ' : 'Sahkaar Worker Benefits'}
          </Text>

          <View style={styles.benefitRow}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            <Text style={styles.benefitText}>
              {language === 'hi'
                ? 'कोई बिचौलिया कमीशन नहीं — 85% कमाई सीधे आपके खाते में'
                : 'Zero predatory commissions — 85% direct fair-wage payout'}
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.benefitText}>
              {language === 'hi'
                ? 'एनसीसीटी प्रमाणित सहकारी पहचान पत्र और सुरक्षा बीमा'
                : 'NCCT-certified cooperative ID card & PMSBY accident insurance'}
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <Ionicons name="medkit-outline" size={20} color={COLORS.danger} />
            <Text style={styles.benefitText}>
              {language === 'hi'
                ? 'आपातकालीन कल्याण राहत कोष एवं दुर्घटना सहायता'
                : 'Emergency welfare relief fund & instant medical claims'}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  banner: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bannerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.surface,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: SPACING.sm,
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.2)',
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoTextCol: {
    flex: 1,
  },
  demoTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.secondaryDark,
  },
  demoSubtitle: {
    fontSize: 11,
    color: COLORS.secondaryDark,
    marginTop: 2,
  },
  benefitsCard: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  benefitsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

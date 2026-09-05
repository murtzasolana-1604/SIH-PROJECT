import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  onBack?: () => void;
  onLogout: () => void;
}

export const WorkerProfileScreen: React.FC<Props> = ({ onBack, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const { workerProfile } = useAuth();

  const handleConfirmLogout = () => {
    Alert.alert(
      t.logout,
      language === 'hi'
        ? 'क्या आप सहकार कनेक्ट से लॉग आउट करना चाहते हैं?'
        : 'Are you sure you want to log out of Sahkaar Connect?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={t.profile}
        subtitle={workerProfile?.phone ? `+91 ${workerProfile.phone}` : undefined}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Worker Badge Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Ionicons name="construct" size={36} color={COLORS.secondary} />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.name}>{workerProfile?.name || t.worker}</Text>
              <Text style={styles.phone}>+91 {workerProfile?.phone}</Text>
              <View style={styles.ncctBadge}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                <Text style={styles.ncctText}>
                  {language === 'hi' ? 'एनसीसीटी प्रमाणित सहकारी कामगार' : 'NCCT Certified Worker'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{workerProfile?.rating || 4.9} ★</Text>
              <Text style={styles.statLabel}>{language === 'hi' ? 'रेटिंग' : 'Rating'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{workerProfile?.experienceYears || 5} yr</Text>
              <Text style={styles.statLabel}>{language === 'hi' ? 'अनुभव' : 'Experience'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>₹19,040</Text>
              <Text style={styles.statLabel}>{language === 'hi' ? 'कुल वेतन' : 'Living Wage'}</Text>
            </View>
          </View>
        </Card>

        {/* Skills & Society */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'कौशल एवं संबद्ध समिति' : 'Skills & Cooperative Society'}
          </Text>

          <View style={styles.skillsWrapper}>
            {(workerProfile?.skills || ['Electrician', 'Appliance Repair']).map((s, idx) => (
              <View key={idx} style={styles.skillPill}>
                <Ionicons name="build" size={12} color={COLORS.secondary} />
                <Text style={styles.skillPillText}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.societyBox}>
            <Ionicons name="business-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.societyLabel}>
                {language === 'hi' ? 'पंजीकृत सहकारी समिति' : 'Registered Cooperative Society'}
              </Text>
              <Text style={styles.societyName}>
                {workerProfile?.cooperativeSociety || 'Sahkaar Multi-State Cooperative Society'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'भाषा प्राथमिकता (Language)' : 'Language Preference'}
          </Text>

          <View style={styles.langPillContainer}>
            <TouchableOpacity
              style={[styles.langPill, language === 'en' && styles.langPillActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langPillText, language === 'en' && styles.langPillTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langPill, language === 'hi' && styles.langPillActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={[styles.langPillText, language === 'hi' && styles.langPillTextActive]}>
                हिंदी (Hindi)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* SIH NCCT Trust Card */}
        <Card style={styles.trustCard}>
          <Ionicons name="ribbon" size={24} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.trustTitle}>Sahkaar Connect • SIH26089</Text>
            <Text style={styles.trustSub}>
              Ministry of Cooperation • National Council for Cooperative Training (NCCT){'\n'}
              Worker Helpline: 1800-SAHKAAR-WORKER
            </Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          title={t.logout}
          variant="danger"
          onPress={handleConfirmLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  phone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ncctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ncctText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  skillPillText: {
    fontSize: 11,
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },
  societyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  societyLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  societyName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  langPillActive: {
    backgroundColor: COLORS.primary,
  },
  langPillText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  langPillTextActive: {
    color: COLORS.surface,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trustTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trustSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: SPACING.sm,
  },
});

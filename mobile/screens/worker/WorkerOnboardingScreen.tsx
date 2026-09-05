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
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  onComplete: () => void;
}

const SKILL_OPTIONS = [
  { id: 'Electrician', en: 'Electrician', hi: 'इलेक्ट्रीशियन', icon: 'flash' },
  { id: 'Plumber', en: 'Plumber', hi: 'प्लंबर', icon: 'water' },
  { id: 'Carpenter', en: 'Carpenter', hi: 'बढ़ई', icon: 'construct' },
  { id: 'Appliance Repair', en: 'Appliance Repair', hi: 'उपकरण मरम्मत', icon: 'hardware-chip' },
  { id: 'Painter', en: 'Painter', hi: 'पेंटर', icon: 'color-palette' },
  { id: 'Cleaning', en: 'Home Cleaning', hi: 'सफाई', icon: 'sparkles' },
];

const COOP_SOCIETIES = [
  'Sahkaar Multi-State Cooperative Society',
  'Delhi NCR Cooperative Services Union',
  'National Urban Labour Co-op Fed',
  'Jan Seva Shramik Sahkari Samiti',
];

export const WorkerOnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { t, language } = useLanguage();
  const { workerProfile, updateWorkerProfile } = useAuth();

  const [name, setName] = useState(workerProfile?.name || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    workerProfile?.skills && workerProfile.skills.length > 0
      ? workerProfile.skills
      : ['Electrician']
  );
  const [experience, setExperience] = useState(
    workerProfile?.experienceYears ? String(workerProfile.experienceYears) : '5'
  );
  const [society, setSociety] = useState(
    workerProfile?.cooperativeSociety || COOP_SOCIETIES[0]
  );
  const [pincode, setPincode] = useState('110001');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter((s) => s !== skillId));
      }
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), language === 'hi' ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your name');
      return;
    }
    if (selectedSkills.length === 0) {
      Alert.alert(t('error'), language === 'hi' ? 'कृपया कम से कम एक हुनर चुनें' : 'Please select at least one skill');
      return;
    }

    setLoading(true);
    try {
      await updateWorkerProfile({
        name: name.trim(),
        skills: selectedSkills,
        experienceYears: parseInt(experience, 10) || 1,
        cooperativeSociety: society,
        isAvailable: 1,
        ncctCertified: true,
      });
      onComplete();
    } catch {
      Alert.alert(t('error'), 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={language === 'hi' ? 'कामगार पंजीकरण' : 'Worker Onboarding'}
        subtitle={language === 'hi' ? 'एनसीसीटी सहकारी सदस्यता' : 'NCCT Cooperative Membership'}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <Ionicons name="ribbon" size={28} color={COLORS.secondary} />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>
                {language === 'hi' ? 'सहकारी कामगार पहचान' : 'Cooperative Worker Identity'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {language === 'hi'
                  ? 'यह जानकारी आपके डिजिटल सहकार कार्ड पर दिखाई देगी।'
                  : 'This profile details will appear on your digital NCCT cooperative badge.'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Name input */}
        <Input
          label={t('fullName')}
          placeholder={language === 'hi' ? 'उदा. राजेश शर्मा' : 'e.g. Rajesh Sharma'}
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
        />

        {/* Skill Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'प्राथमिक हुनर / कौशल चुनें' : 'Select Primary Skills'}
          </Text>
          <View style={styles.skillsGrid}>
            {SKILL_OPTIONS.map((item) => {
              const isSelected = selectedSkills.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                  onPress={() => toggleSkill(item.id)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={isSelected ? COLORS.surface : COLORS.secondary}
                  />
                  <Text
                    style={[
                      styles.skillChipText,
                      isSelected && styles.skillChipTextSelected,
                    ]}
                  >
                    {language === 'hi' ? item.hi : item.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Experience & Pincode */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label={language === 'hi' ? 'अनुभव (वर्ष)' : 'Experience (Years)'}
              value={experience}
              onChangeText={setExperience}
              keyboardType="number-pad"
              maxLength={2}
              leftIcon="time-outline"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label={language === 'hi' ? 'पिनकोड' : 'Pincode'}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon="location-outline"
            />
          </View>
        </View>

        {/* Cooperative Society Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'संबद्ध सहकारी समिति' : 'Affiliated Cooperative Society'}
          </Text>
          {COOP_SOCIETIES.map((soc) => (
            <TouchableOpacity
              key={soc}
              style={[styles.socRow, society === soc && styles.socRowActive]}
              onPress={() => setSociety(soc)}
            >
              <Ionicons
                name={society === soc ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={society === soc ? COLORS.primary : COLORS.textTertiary}
              />
              <Text
                style={[
                  styles.socText,
                  society === soc && styles.socTextActive,
                ]}
              >
                {soc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={language === 'hi' ? 'प्रोफ़ाइल सहेजें एवं काम शुरू करें' : 'Save Profile & Start Earning'}
          onPress={handleSave}
          loading={loading}
          style={styles.submitBtn}
        />
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
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: 'rgba(234, 88, 12, 0.2)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.secondaryDark,
  },
  bannerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillChipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  skillChipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  skillChipTextSelected: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  socRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  socRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  socText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  socTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});

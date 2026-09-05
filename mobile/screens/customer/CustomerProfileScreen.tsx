import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { LocationService } from '../../services/location';

interface Props {
  onBack?: () => void;
  onLogout: () => void;
}

export const CustomerProfileScreen: React.FC<Props> = ({ onBack, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const { customerProfile, updateCustomerProfile } = useAuth();

  const [name, setName] = useState(customerProfile?.name || '');
  const [address, setAddress] = useState(customerProfile?.address || '');
  const [isEditing, setIsEditing] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDetectAddress = async () => {
    setDetectingLocation(true);
    try {
      const loc = await LocationService.getCurrentAddress();
      if (loc) {
        setAddress(loc.formattedAddress);
      }
    } catch {
      Alert.alert(t.error, 'Could not detect location. Please check GPS permissions.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert(t.error, 'Name and address cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateCustomerProfile({
        name: name.trim(),
        address: address.trim(),
      });
      setIsEditing(false);
      Alert.alert(
        language === 'hi' ? 'सफलता' : 'Success',
        language === 'hi' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई।' : 'Profile updated successfully.'
      );
    } catch {
      Alert.alert(t.error, 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

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
        subtitle={customerProfile?.phone ? `+91 ${customerProfile.phone}` : undefined}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={COLORS.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{customerProfile?.name || t.customer}</Text>
              <Text style={styles.userPhone}>+91 {customerProfile?.phone}</Text>
              <View style={styles.badgeRow}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                <Text style={styles.badgeText}>
                  {language === 'hi' ? 'सत्यापित नागरिक' : 'Verified Citizen'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Details & Edit */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {language === 'hi' ? 'व्यक्तिगत विवरण' : 'Personal Details'}
            </Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>{language === 'hi' ? 'संपादित करें' : 'Edit'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label={t.fullName}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
              />

              <Input
                label={t.address}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.gpsDetectBtn}
                onPress={handleDetectAddress}
                disabled={detectingLocation}
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.gpsDetectText}>
                      {language === 'hi' ? 'जीपीएस द्वारा पता खोजें' : 'Auto-detect current location'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.editActionRow}>
                <Button
                  title={t.cancel}
                  variant="outline"
                  onPress={() => {
                    setName(customerProfile?.name || '');
                    setAddress(customerProfile?.address || '');
                    setIsEditing(false);
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t.save}
                  onPress={handleSave}
                  loading={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t.fullName}</Text>
                <Text style={styles.infoValue}>{customerProfile?.name || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t.phone}</Text>
                <Text style={styles.infoValue}>+91 {customerProfile?.phone || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t.address}</Text>
                <Text style={styles.infoValue}>{customerProfile?.address || '—'}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'प्राथमिकताएं' : 'Preferences'}
          </Text>

          {/* Language Toggle Row */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextGroup}>
              <Text style={styles.prefTitle}>
                {language === 'hi' ? 'भाषा (Language)' : 'Language'}
              </Text>
              <Text style={styles.prefSubtitle}>
                {language === 'hi' ? 'वर्तमान: हिंदी' : 'Current: English'}
              </Text>
            </View>
            <View style={styles.langPillContainer}>
              <TouchableOpacity
                style={[styles.langPill, language === 'en' && styles.langPillActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langPillText, language === 'en' && styles.langPillTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langPill, language === 'hi' && styles.langPillActive]}
                onPress={() => setLanguage('hi')}
              >
                <Text style={[styles.langPillText, language === 'hi' && styles.langPillTextActive]}>
                  हिंदी
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Cooperative Trust & SIH Info */}
        <Card style={styles.trustCard}>
          <View style={styles.trustHeader}>
            <Ionicons name="ribbon" size={24} color={COLORS.primary} />
            <Text style={styles.trustTitle}>Sahkaar Connect</Text>
          </View>
          <Text style={styles.trustDesc}>
            Smart India Hackathon 2026 • SIH26089{'\n'}
            Ministry of Cooperation & National Council for Cooperative Training (NCCT){'\n'}
            100% Cooperative fair-wage model empowering local trade workers.
          </Text>
          <View style={styles.helplineRow}>
            <Ionicons name="call" size={16} color={COLORS.secondary} />
            <Text style={styles.helplineText}>
              {language === 'hi' ? 'नागरिक सहायता: 1800-SAHKAAR' : 'Citizen Helpline: 1800-SAHKAAR'}
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
  userCard: {
    backgroundColor: COLORS.surface,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  editBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoList: {
    gap: SPACING.sm,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  editForm: {
    gap: SPACING.sm,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  gpsDetectText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  prefTextGroup: {
    flex: 1,
  },
  prefTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  prefSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
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
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  trustTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trustDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  helplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  helplineText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  logoutBtn: {
    marginTop: SPACING.sm,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { WelfareCard } from '../../components/worker/WelfareCard';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { apiService } from '../../services/api';
import { WorkerWelfareDetails } from '../../types/booking';

interface Props {
  onBack?: () => void;
}

export const WorkerWelfareScreen: React.FC<Props> = ({ onBack }) => {
  const { t, language } = useLanguage();
  const { workerProfile } = useAuth();

  const [welfare, setWelfare] = useState<WorkerWelfareDetails>({
    pmsbyStatus: 'active',
    pmsbyPolicyNumber: 'PMSBY-2026-COOP-8921',
    coverageAmount: 200000,
    validUntil: '31 May 2027',
    certificateHash: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    claimsCount: 0,
    reliefDisbursed: 0,
  });

  const [claimType, setClaimType] = useState('Medical Emergency');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [recentClaims, setRecentClaims] = useState<any[]>([
    {
      id: 'CLM-101',
      type: 'Medical Emergency',
      amount: 5000,
      status: 'Approved',
      date: '15 Aug 2026',
    },
  ]);

  const loadWelfare = async () => {
    if (workerProfile?.id) {
      try {
        const res = await apiService.getWorkerWelfare(workerProfile.id);
        if (res) setWelfare(res);
      } catch {
        // Use default cooperative details
      }
    }
  };

  useEffect(() => {
    loadWelfare();
  }, [workerProfile]);

  const handleClaimSubmit = async () => {
    const amt = parseFloat(claimAmount);
    if (!amt || amt <= 0) {
      Alert.alert(t.error, 'Please enter a valid claim amount.');
      return;
    }
    if (!claimDescription.trim()) {
      Alert.alert(t.error, 'Please provide a brief description of the claim.');
      return;
    }

    setSubmittingClaim(true);
    try {
      if (workerProfile?.id) {
        await apiService.submitWelfareClaim({
          workerId: workerProfile.id,
          claimType,
          amount: amt,
          description: claimDescription.trim(),
        });
      }

      setRecentClaims((prev) => [
        {
          id: `CLM-${Date.now().toString().slice(-4)}`,
          type: claimType,
          amount: amt,
          status: 'Under Review',
          date: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);

      setShowClaimForm(false);
      setClaimAmount('');
      setClaimDescription('');

      Alert.alert(
        language === 'hi' ? 'दावा दर्ज किया गया' : 'Claim Submitted',
        language === 'hi'
          ? 'आपका राहत दावा सहकारी कल्याण समिति को भेज दिया गया है।'
          : 'Your claim has been submitted to the Cooperative Welfare Committee for verification.'
      );
    } catch {
      Alert.alert(t.error, 'Failed to submit claim. Please try again.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const CLAIM_TYPES = [
    { id: 'Medical Emergency', en: 'Medical Emergency', hi: 'चिकित्सा आपात स्थिति' },
    { id: 'Workplace Injury', en: 'Workplace Injury', hi: 'कार्यस्थल दुर्घटना' },
    { id: 'Tool Damage', en: 'Tool / Equipment Loss', hi: 'उपकरण / औजार क्षति' },
  ];

  return (
    <View style={styles.container}>
      <Header title={t.welfarePmsby} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PMSBY Card */}
        <WelfareCard
          welfare={welfare}
          onDownloadCertificate={() =>
            Alert.alert(
              language === 'hi' ? 'प्रमाणपत्र' : 'Certificate',
              `PMSBY Policy #${welfare.pmsbyPolicyNumber || ''}\nHash: ${(welfare.certificateHash || '').slice(0, 20)}...`
            )
          }
        />

        {/* Action: Submit Claim */}
        {!showClaimForm ? (
          <Button
            title={language === 'hi' ? '+ नया कल्याण / राहत दावा दर्ज करें' : '+ Submit Relief Claim'}
            variant="secondary"
            onPress={() => setShowClaimForm(true)}
            leftIcon="medkit-outline"
          />
        ) : (
          <Card style={styles.claimFormCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {language === 'hi' ? 'सहकारी राहत दावा फ़ॉर्म' : 'Emergency Relief Claim'}
              </Text>
              <TouchableOpacity onPress={() => setShowClaimForm(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.typeLabel}>
              {language === 'hi' ? 'दावा का प्रकार' : 'Claim Type'}
            </Text>
            <View style={styles.typesRow}>
              {CLAIM_TYPES.map((ct) => {
                const isSelected = claimType === ct.id;
                return (
                  <TouchableOpacity
                    key={ct.id}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setClaimType(ct.id)}
                  >
                    <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>
                      {language === 'hi' ? ct.hi : ct.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label={language === 'hi' ? 'दावा राशि (₹)' : 'Requested Amount (₹)'}
              value={claimAmount}
              onChangeText={setClaimAmount}
              placeholder="e.g. 5000"
              keyboardType="number-pad"
              leftIcon="cash-outline"
            />

            <Input
              label={language === 'hi' ? 'विवरण' : 'Reason / Details'}
              value={claimDescription}
              onChangeText={setClaimDescription}
              placeholder="Describe emergency circumstances..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <Button
                title={t.cancel}
                variant="outline"
                onPress={() => setShowClaimForm(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={language === 'hi' ? 'दावा भेजें' : 'Submit Claim'}
                onPress={handleClaimSubmit}
                loading={submittingClaim}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* Claim History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'हालिया दावे' : 'Claim History'}
          </Text>
        </View>

        {recentClaims.map((c) => (
          <Card key={c.id} style={styles.claimItem}>
            <View style={styles.claimTop}>
              <View>
                <Text style={styles.claimType}>{c.type}</Text>
                <Text style={styles.claimDate}>
                  {c.id} • {c.date}
                </Text>
              </View>
              <View style={styles.claimStatusCol}>
                <Text style={styles.claimAmount}>₹{(c?.amount ?? 0).toLocaleString()}</Text>
                <View
                  style={[
                    styles.statusPill,
                    c.status === 'Approved' ? styles.statusApproved : styles.statusReview,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      c.status === 'Approved' ? styles.textApproved : styles.textReview,
                    ]}
                  >
                    {c.status}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

        {/* Welfare Trust Footer */}
        <Card style={styles.trustCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.trustText}>
            {language === 'hi'
              ? 'सहकार कनेक्ट का 15% कल्याण कोष सीधे भारत सरकार के सामाजिक सुरक्षा मानकों के तहत कामगार सुरक्षा सुनिश्चित करता है।'
              : 'The 15% Cooperative Welfare Reserve strictly funds social security, PMSBY coverage, and emergency distress aid for all verified workers.'}
          </Text>
        </Card>
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
  claimFormCard: {
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  typeChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  typeChipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  typeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typeTextSelected: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionHeader: {
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  claimItem: {
    backgroundColor: COLORS.surface,
  },
  claimTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  claimDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  claimStatusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  claimAmount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusReview: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textApproved: {
    color: '#15803D',
  },
  textReview: {
    color: '#B45309',
  },
  trustCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
    borderWidth: 1,
    alignItems: 'center',
  },
  trustText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});

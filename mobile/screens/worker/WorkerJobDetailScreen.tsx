import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { apiService } from '../../services/api';
import { Booking } from '../../types/booking';

interface Props {
  bookingId: string;
  onBack: () => void;
}

export const WorkerJobDetailScreen: React.FC<Props> = ({ bookingId, onBack }) => {
  const { t, language } = useLanguage();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJob = async () => {
    try {
      const data = await apiService.getBookingById(bookingId);
      setBooking(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [bookingId]);

  const handleUpdateStatus = async (newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    setActionLoading(true);
    try {
      await apiService.updateBookingStatus(bookingId, newStatus);
      const updated = await apiService.getBookingById(bookingId);
      setBooking(updated);
      Alert.alert(
        language === 'hi' ? 'सफलता' : 'Status Updated',
        language === 'hi' ? `कार्य की स्थिति: ${newStatus}` : `Job status updated to ${newStatus}`
      );
    } catch {
      Alert.alert(t('error'), 'Failed to update job status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallCustomer = () => {
    if (booking?.customerPhone) {
      Linking.openURL(`tel:${booking.customerPhone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title={t('jobDetails')} onBack={onBack} />
        <LoadingState />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <Header title={t('jobDetails')} onBack={onBack} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {language === 'hi' ? 'कार्य विवरण नहीं मिला' : 'Job details not found'}
          </Text>
          <Button title={t('retry')} onPress={fetchJob} style={{ marginTop: SPACING.md }} />
        </View>
      </View>
    );
  }

  const basePrice = booking.price || 499;
  const workerCut = Math.round(basePrice * 0.85);
  const coopCut = basePrice - workerCut;

  return (
    <View style={styles.container}>
      <Header
        title={t('jobDetails')}
        subtitle={`ID: #${booking.id.slice(0, 8)}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status & Priority */}
        <Card style={styles.headerCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.serviceName}>{booking.service}</Text>
              <Text style={styles.bookingDate}>
                {booking.bookingDate} • {booking.bookingTime}
              </Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>

          {booking.isEmergency && (
            <View style={styles.emergencyBanner}>
              <Ionicons name="warning" size={16} color={COLORS.danger} />
              <Text style={styles.emergencyBannerText}>
                {language === 'hi'
                  ? 'तत्काल आपातकालीन सेवा अनुरोध (15-मिनट एसएलए)'
                  : 'EMERGENCY SOS REQUEST (15-min SLA Target)'}
              </Text>
            </View>
          )}
        </Card>

        {/* Customer Details Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'नागरिक / ग्राहक विवरण' : 'Customer Details'}
          </Text>

          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName}</Text>
              <Text style={styles.customerPhone}>+91 {booking.customerPhone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCallCustomer}>
              <Ionicons name="call" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addressText}>{booking.address}</Text>
          </View>
        </Card>

        {/* Living Wage & Payout Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'जीवन वेतन एवं पारिश्रमिक विवरण' : 'Fair Wage & Payout Breakdown'}
          </Text>

          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>
              {language === 'hi' ? 'कुल सेवा मूल्य' : 'Total Service Price'}
            </Text>
            <Text style={styles.payoutValue}>₹{basePrice}</Text>
          </View>

          <View style={styles.payoutRow}>
            <View style={styles.badgeLabelRow}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
              <Text style={[styles.payoutLabel, { color: COLORS.primary, fontWeight: '700' }]}>
                {language === 'hi' ? 'आपकी सीधी कमाई (85%)' : 'Your Direct Payout (85%)'}
              </Text>
            </View>
            <Text style={[styles.payoutValue, { color: COLORS.primary, fontWeight: '700' }]}>
              ₹{workerCut}
            </Text>
          </View>

          <View style={styles.payoutRow}>
            <View style={styles.badgeLabelRow}>
              <Ionicons name="shield-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.payoutLabel}>
                {language === 'hi' ? 'सहकारी कल्याण एवं सुरक्षा कोष (15%)' : 'Co-op Welfare Reserve (15%)'}
              </Text>
            </View>
            <Text style={styles.payoutValue}>₹{coopCut}</Text>
          </View>

          <View style={styles.trustFooter}>
            <Text style={styles.trustNotice}>
              {language === 'hi'
                ? 'यह पारिश्रमिक कार्य पूरा होते ही आपके सहकारी बैंक खाते में भेजा जाएगा।'
                : 'Living wage payout is credited to your cooperative account upon job completion.'}
            </Text>
          </View>
        </Card>

        {/* Actions based on Job Status */}
        <View style={styles.actionsContainer}>
          {booking.status === 'pending' && (
            <View style={styles.actionRow}>
              <Button
                title={language === 'hi' ? 'अस्वीकार करें' : 'Decline'}
                variant="outline"
                onPress={() => handleUpdateStatus('cancelled')}
                loading={actionLoading}
                style={{ flex: 1 }}
              />
              <Button
                title={language === 'hi' ? 'कार्य स्वीकार करें' : 'Accept Job'}
                onPress={() => handleUpdateStatus('confirmed')}
                loading={actionLoading}
                style={{ flex: 1 }}
              />
            </View>
          )}

          {booking.status === 'confirmed' && (
            <Button
              title={language === 'hi' ? 'कार्य स्थल पर पहुँचकर कार्य शुरू करें' : 'Start Job (On Site)'}
              onPress={() => handleUpdateStatus('in_progress')}
              loading={actionLoading}
              leftIcon="play"
            />
          )}

          {booking.status === 'in_progress' && (
            <Button
              title={language === 'hi' ? 'कार्य पूर्ण घोषित करें (85% भुगतान प्राप्त करें)' : 'Complete Job (Claim Payout)'}
              onPress={() => handleUpdateStatus('completed')}
              loading={actionLoading}
              leftIcon="checkmark-done"
            />
          )}

          {booking.status === 'completed' && (
            <View style={styles.completedBadgeBox}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              <Text style={styles.completedBadgeText}>
                {language === 'hi'
                  ? 'यह कार्य सफलतापूर्वक पूर्ण हो चुका है। पारिश्रमिक दर्ज है।'
                  : 'This job has been completed. Fair wage credited.'}
              </Text>
            </View>
          )}
        </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bookingDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dangerLight,
    padding: SPACING.xs,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  emergencyBannerText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  customerPhone: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  addressText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payoutLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  payoutValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trustFooter: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  trustNotice: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  completedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: '#F0FDF4',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  completedBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
});

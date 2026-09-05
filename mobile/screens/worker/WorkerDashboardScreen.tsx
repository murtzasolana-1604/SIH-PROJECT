import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { JobCard } from '../../components/worker/JobCard';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { apiService } from '../../services/api';
import { Booking, WorkerEarningsSummary } from '../../types/booking';

interface Props {
  onNavigateToJobs: (tab?: string) => void;
  onNavigateToJobDetail: (bookingId: string) => void;
  onNavigateToEarnings: () => void;
  onNavigateToWelfare: () => void;
  onNavigateToSaathi: () => void;
}

export const WorkerDashboardScreen: React.FC<Props> = ({
  onNavigateToJobs,
  onNavigateToJobDetail,
  onNavigateToEarnings,
  onNavigateToWelfare,
  onNavigateToSaathi,
}) => {
  const { t, language } = useLanguage();
  const { workerProfile, updateWorkerProfile } = useAuth();

  const [isOnline, setIsOnline] = useState(workerProfile?.isAvailable === 1);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<WorkerEarningsSummary>({
    totalEarnings: 14850,
    livingWageShare: 12622,
    cooperativeFundShare: 2228,
    completedJobsCount: 18,
    pendingPayout: 2150,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const allBookings = await apiService.getBookings();
      // Filter bookings for worker trade or assigned bookings
      const relevant = allBookings
        .filter((b) => {
          if (workerProfile?.skills && workerProfile.skills.length > 0) {
            return (
              workerProfile.skills.some((s) =>
                b.service.toLowerCase().includes(s.toLowerCase())
              ) || b.workerName === workerProfile.name
            );
          }
          return true;
        })
        .slice(0, 5);
      setRecentBookings(relevant);

      if (workerProfile?.id) {
        try {
          const stats = await apiService.getWorkerEarnings(workerProfile.id);
          if (stats) setEarnings(stats);
        } catch {
          // Keep defaults
        }
      }
    } catch {
      // Backend offline or loading
    }
  }, [workerProfile]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    setTogglingOnline(true);
    try {
      if (workerProfile?.id) {
        await apiService.updateWorkerAvailability(workerProfile.id, value ? 1 : 0);
      }
      await updateWorkerProfile({ isAvailable: value ? 1 : 0 });
    } catch {
      setIsOnline(!value);
      Alert.alert(t.error, 'Could not update online status. Please check your connection.');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, 'confirmed');
      Alert.alert(
        language === 'hi' ? 'कार्य स्वीकृत' : 'Job Accepted',
        language === 'hi' ? 'आपने कार्य स्वीकार कर लिया है।' : 'You have accepted the booking.'
      );
      loadDashboardData();
    } catch {
      Alert.alert(t.error, 'Failed to accept booking.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const pendingCount = recentBookings.filter((b) => b.status === 'pending').length;

  return (
    <View style={styles.container}>
      <Header
        title={t.workerDashboard}
        subtitle={workerProfile?.name ? `${workerProfile.name} • NCCT` : 'Co-op Worker'}
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Availability Toggle Banner */}
        <Card
          style={[
            styles.statusCard,
            isOnline ? styles.statusCardOnline : styles.statusCardOffline,
          ]}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusTextGroup}>
              <View style={styles.statusIndicatorRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary },
                  ]}
                />
                <Text style={styles.statusTitle}>
                  {isOnline ? t.online : t.offline}
                </Text>
              </View>
              <Text style={styles.statusSubtitle}>
                {isOnline
                  ? language === 'hi'
                    ? 'आप नई सेवा अनुरोध प्राप्त करने के लिए उपलब्ध हैं'
                    : 'Available for incoming citizen booking requests'
                  : language === 'hi'
                  ? 'ड्यूटी बंद है — नए कार्य अनुरोध प्राप्त नहीं होंगे'
                  : 'Duty is off — You are currently not receiving new requests'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={togglingOnline}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </Card>

        {/* 85/15 Living Wage Quick Summary Card */}
        <Card style={styles.earningsCard} onPress={onNavigateToEarnings}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsSub}>
                {language === 'hi' ? 'कुल अर्जित (85% जीवन वेतन)' : 'Total Net Payout (85% Living Wage)'}
              </Text>
              <Text style={styles.earningsVal}>₹{(earnings?.livingWageShare ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.coopChip}>
              <Text style={styles.coopChipText}>
                {language === 'hi' ? 'सहकार 15% कोष' : '15% Co-op Fund'}
              </Text>
              <Text style={styles.coopChipVal}>₹{(earnings?.cooperativeFundShare ?? 0).toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.earningsFooter}>
            <Text style={styles.jobsCompletedText}>
              {earnings?.completedJobsCount ?? 0} {language === 'hi' ? 'कार्य पूर्ण' : 'Jobs Completed'}
            </Text>
            <View style={styles.arrowRow}>
              <Text style={styles.viewDetailsText}>{t.viewDetails}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </View>
          </View>
        </Card>

        {/* Action Grid: Jobs, Welfare, Saathi */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => onNavigateToJobs('all')}
          >
            <View style={[styles.gridIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="briefcase" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.gridBtnTitle}>{t.myJobs}</Text>
            {pendingCount > 0 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onNavigateToWelfare}
          >
            <View style={[styles.gridIcon, { backgroundColor: COLORS.secondaryLight }]}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridBtnTitle}>{t.welfarePmsby}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onNavigateToSaathi}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="chatbubbles" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.gridBtnTitle}>सहकार साथी</Text>
          </TouchableOpacity>
        </View>

        {/* Incoming & Recent Jobs Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'हालिया कार्य अनुरोध' : 'Recent Job Requests'}
          </Text>
          <TouchableOpacity onPress={() => onNavigateToJobs('pending')}>
            <Text style={styles.seeAllText}>
              {language === 'hi' ? 'सभी देखें' : 'View All'}
            </Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={32} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>
              {language === 'hi'
                ? 'फ़िलहाल कोई नया कार्य अनुरोध नहीं है'
                : 'No active job requests right now'}
            </Text>
          </Card>
        ) : (
          recentBookings.map((b) => (
            <JobCard
              key={b.id}
              booking={b}
              onPress={() => onNavigateToJobDetail(b.id)}
              onAccept={() => handleAcceptJob(b.id)}
            />
          ))
        )}

        {/* SIH NCCT Trust Card */}
        <Card style={styles.ncctCard}>
          <View style={styles.ncctRow}>
            <Ionicons name="ribbon-outline" size={24} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ncctTitle}>
                {language === 'hi' ? 'एनसीसीटी प्रमाणित सहकारी मंच' : 'NCCT Certified Cooperative'}
              </Text>
              <Text style={styles.ncctDesc}>
                {language === 'hi'
                  ? 'कामगारों का सशक्तिकरण • 0% मध्यस्थ कमीशन • जीवन सुरक्षा'
                  : 'Worker Empowerment • Zero Exploitation • Living Security'}
              </Text>
            </View>
          </View>
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
  statusCard: {
    padding: SPACING.md,
    borderWidth: 1.5,
  },
  statusCardOnline: {
    backgroundColor: '#F0FDF4',
    borderColor: COLORS.primary,
  },
  statusCardOffline: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTextGroup: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  earningsCard: {
    backgroundColor: COLORS.surface,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  earningsSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  earningsVal: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  coopChip: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'flex-end',
  },
  coopChipText: {
    fontSize: 10,
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },
  coopChipVal: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.secondaryDark,
    marginTop: 2,
  },
  earningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  jobsCompletedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
    position: 'relative',
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  gridBtnTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  counterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  counterText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  ncctCard: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  ncctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ncctTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ncctDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

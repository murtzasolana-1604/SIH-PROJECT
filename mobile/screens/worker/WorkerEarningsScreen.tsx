import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { apiService } from '../../services/api';
import { Booking, WorkerEarningsSummary } from '../../types/booking';

interface Props {
  onBack?: () => void;
}

export const WorkerEarningsScreen: React.FC<Props> = ({ onBack }) => {
  const { t, language } = useLanguage();
  const { workerProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<Booking[]>([]);

  const [stats, setStats] = useState<WorkerEarningsSummary>({
    totalEarnings: 22400,
    livingWageShare: 19040,
    cooperativeFundShare: 3360,
    completedJobsCount: 24,
    pendingPayout: 3200,
  });

  const loadData = async () => {
    try {
      if (workerProfile?.id) {
        const res = await apiService.getWorkerEarnings(workerProfile.id);
        if (res) setStats(res);
      }
      const bookings = await apiService.getBookings();
      const done = bookings.filter((b) => b.status === 'completed');
      setCompletedJobs(done);
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workerProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleWithdraw = () => {
    if (stats.pendingPayout <= 0) {
      Alert.alert(
        language === 'hi' ? 'कोई लंबित राशि नहीं' : 'No Pending Balance',
        language === 'hi'
          ? 'आपके पास वर्तमान में कोई निकासी योग्य राशि उपलब्ध नहीं है।'
          : 'You currently have no pending balance to withdraw.'
      );
      return;
    }

    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setStats((prev) => ({
        ...prev,
        pendingPayout: 0,
      }));
      Alert.alert(
        language === 'hi' ? 'भुगतान स्थानांतरित' : 'Payout Initiated',
        language === 'hi'
          ? `₹${stats.pendingPayout} आपके पंजीकृत सहकारी बैंक खाते में सफलतापूर्वक स्थानांतरित कर दिया गया है।`
          : `₹${stats.pendingPayout} has been successfully transferred to your linked cooperative bank account.`
      );
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <Header title={t.earnings} onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Total Living Wage Banner */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {language === 'hi' ? 'कुल अर्जित जीवन वेतन (85%)' : 'Net Worker Payout (85% Living Wage)'}
          </Text>
          <Text style={styles.summaryValue}>₹{(stats?.livingWageShare ?? 0).toLocaleString()}</Text>

          <View style={styles.divider} />

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricSub}>{language === 'hi' ? 'पूर्ण कार्य' : 'Jobs Done'}</Text>
              <Text style={styles.metricNum}>{stats?.completedJobsCount ?? 0}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricSub}>{language === 'hi' ? 'सहकार 15% कोष' : '15% Co-op Fund'}</Text>
              <Text style={styles.metricNum}>₹{(stats?.cooperativeFundShare ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricSub}>{language === 'hi' ? 'लंबित निकासी' : 'Available'}</Text>
              <Text style={[styles.metricNum, { color: COLORS.secondaryDark }]}>
                ₹{(stats?.pendingPayout ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Withdraw CTA */}
        {stats.pendingPayout > 0 && (
          <Button
            title={
              language === 'hi'
                ? `लंबित ₹${stats.pendingPayout} बैंक खाते में निकालें`
                : `Withdraw Available ₹${stats.pendingPayout}`
            }
            onPress={handleWithdraw}
            loading={withdrawing}
            leftIcon="card-outline"
          />
        )}

        {/* Cooperative 85/15 Fair-Wage Breakdown Explainer */}
        <Card style={styles.explainerCard}>
          <View style={styles.explainerHeader}>
            <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
            <Text style={styles.explainerTitle}>
              {language === 'hi' ? 'सहकारी 85/15 पारिश्रमिक मॉडल' : 'The 85/15 Cooperative Payout Model'}
            </Text>
          </View>

          <Text style={styles.explainerBody}>
            {language === 'hi'
              ? 'राष्ट्रीय सहकारिता नीति एवं एनसीटी दिशानिर्देशों के तहत, निजी एग्रीगेटर्स के विपरीत सहकार कनेक्ट कामगार से कोई कमीशन नहीं काटता:'
              : 'Under Ministry of Cooperation & NCCT guidelines, Sahkaar Connect eliminates predatory 25-35% middleman commissions:'}
          </Text>

          <View style={styles.shareItem}>
            <View style={[styles.shareDot, { backgroundColor: COLORS.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareItemTitle}>85% {language === 'hi' ? 'सीधा जीवन वेतन' : 'Direct Living Wage'}</Text>
              <Text style={styles.shareItemDesc}>
                {language === 'hi'
                  ? 'बिना किसी कटौती के सीधे कामगार के बैंक खाते में।'
                  : 'Credited directly to your bank account upon service sign-off.'}
              </Text>
            </View>
          </View>

          <View style={styles.shareItem}>
            <View style={[styles.shareDot, { backgroundColor: COLORS.secondary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareItemTitle}>10% {language === 'hi' ? 'कल्याण एवं पीएमएसबीवाई बीमा' : 'Welfare & Insurance'}</Text>
              <Text style={styles.shareItemDesc}>
                {language === 'hi'
                  ? '₹2 लाख दुर्घटना बीमा एवं कामगार आपातकालीन राहत कोष हेतु।'
                  : 'Funds your ₹2,00,000 PMSBY insurance and worker relief grant.'}
              </Text>
            </View>
          </View>

          <View style={styles.shareItem}>
            <View style={[styles.shareDot, { backgroundColor: COLORS.textTertiary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareItemTitle}>5% {language === 'hi' ? 'प्रशासनिक संचालन' : 'Cooperative Operations'}</Text>
              <Text style={styles.shareItemDesc}>
                {language === 'hi'
                  ? 'सर्वर, डिस्पैच नेटवर्क और टोल-फ्री हेल्पलाइन रखरखाव।'
                  : 'Covers cloud servers, toll-free dispatch, and auditing.'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Completed Jobs History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'पूर्ण कार्यों का विवरण' : 'Completed Jobs Payout History'}
          </Text>
        </View>

        {completedJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={32} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>
              {language === 'hi' ? 'अभी कोई पूर्ण कार्य नहीं है' : 'No completed jobs yet'}
            </Text>
          </Card>
        ) : (
          completedJobs.map((item) => {
            const price = item.price || 499;
            const net = Math.round(price * 0.85);
            return (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View>
                    <Text style={styles.historyService}>{item.service}</Text>
                    <Text style={styles.historyCust}>
                      {item.customerName} • {item.bookingDate}
                    </Text>
                  </View>
                  <View style={styles.historyPriceCol}>
                    <Text style={styles.historyNet}>+₹{net}</Text>
                    <Text style={styles.historyTotal}>₹{price}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
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
  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  metricNum: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  explainerCard: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  explainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  explainerTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  explainerBody: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: 2,
  },
  shareDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  shareItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shareItemDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  sectionHeader: {
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
  historyCard: {
    backgroundColor: COLORS.surface,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyService: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyCust: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyPriceCol: {
    alignItems: 'flex-end',
  },
  historyNet: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyTotal: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
});

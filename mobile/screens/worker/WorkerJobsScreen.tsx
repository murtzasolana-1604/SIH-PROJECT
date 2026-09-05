import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { JobCard } from '../../components/worker/JobCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { apiService } from '../../services/api';
import { Booking } from '../../types/booking';

type TabKey = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed';

interface Props {
  initialTab?: TabKey;
  onNavigateToJobDetail: (bookingId: string) => void;
  onBack?: () => void;
}

export const WorkerJobsScreen: React.FC<Props> = ({
  initialTab = 'all',
  onNavigateToJobDetail,
  onBack,
}) => {
  const { t, language } = useLanguage();
  const { workerProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiService.getBookings();
      // Filter bookings matching worker profile
      const relevant = data.filter((b) => {
        if (workerProfile?.skills && workerProfile.skills.length > 0) {
          return (
            workerProfile.skills.some((s) =>
              b.service.toLowerCase().includes(s.toLowerCase())
            ) || b.workerName === workerProfile.name
          );
        }
        return true;
      });
      setJobs(relevant);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workerProfile]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, 'confirmed');
      Alert.alert(
        language === 'hi' ? 'स्वीकृत' : 'Accepted',
        language === 'hi' ? 'आपने कार्य स्वीकार कर लिया है।' : 'Job accepted successfully.'
      );
      fetchJobs();
    } catch {
      Alert.alert(t('error'), 'Failed to accept job.');
    }
  };

  const handleStartJob = async (bookingId: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, 'in_progress');
      Alert.alert(
        language === 'hi' ? 'कार्य शुरू हुआ' : 'Job Started',
        language === 'hi' ? 'कार्य अब प्रगति पर है।' : 'Job marked as in-progress.'
      );
      fetchJobs();
    } catch {
      Alert.alert(t('error'), 'Failed to update job status.');
    }
  };

  const handleCompleteJob = async (bookingId: string) => {
    try {
      await apiService.updateBookingStatus(bookingId, 'completed');
      Alert.alert(
        language === 'hi' ? 'कार्य पूर्ण' : 'Job Completed',
        language === 'hi'
          ? 'कार्य सफलतापूर्वक पूर्ण हुआ! 85% कमाई आपके खाते में दर्ज कर दी गई है।'
          : 'Job completed! 85% living wage payout credited to your balance.'
      );
      fetchJobs();
    } catch {
      Alert.alert(t('error'), 'Failed to complete job.');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === 'all') return true;
    return job.status === activeTab;
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: language === 'hi' ? 'सभी' : 'All' },
    { key: 'pending', label: language === 'hi' ? 'नए अनुरोध' : 'New' },
    { key: 'confirmed', label: language === 'hi' ? 'स्वीकृत' : 'Scheduled' },
    { key: 'in_progress', label: language === 'hi' ? 'प्रगति पर' : 'Active' },
    { key: 'completed', label: language === 'hi' ? 'पूर्ण' : 'Done' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title={t('myJobs')} onBack={onBack} />
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t('myJobs')} onBack={onBack} />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = jobs.filter((j) => (tab.key === 'all' ? true : j.status === tab.key)).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <JobCard
            booking={item}
            onPress={() => onNavigateToJobDetail(item.id)}
            onAccept={() => handleAcceptJob(item.id)}
            onStart={() => handleStartJob(item.id)}
            onComplete={() => handleCompleteJob(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={language === 'hi' ? 'कोई कार्य उपलब्ध नहीं' : 'No jobs found'}
            subtitle={
              language === 'hi'
                ? 'इस श्रेणी में वर्तमान में कोई कार्य अनुरोध नहीं है।'
                : 'There are no jobs matching this category right now.'
            }
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  tabBadgeTextActive: {
    color: COLORS.surface,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
});

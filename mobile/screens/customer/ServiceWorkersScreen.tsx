/**
 * Service Workers Directory Screen
 * Lists certified cooperative tradespeople filtered by service
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { Header } from "../../components/common/Header";
import { WorkerCard } from "../../components/customer/WorkerCard";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";
import { WorkerProfile } from "../../types/auth";
import { api } from "../../services/api";

interface ServiceWorkersScreenProps {
  selectedService?: string;
  serviceName?: string;
  onBack: () => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onBookWorker?: (worker: WorkerProfile) => void;
  onBookService?: () => void;
}

export const ServiceWorkersScreen: React.FC<ServiceWorkersScreenProps> = ({
  selectedService,
  serviceName,
  onBack,
  onSelectWorker,
  onBookWorker,
  onBookService,
}) => {
  const activeService = serviceName || selectedService || "";
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchWorkers = async () => {
    try {
      const params = activeService ? { skill: activeService } : {};
      const res = await api.get("/api/workers", params);
      const list = Array.isArray(res) ? res : res.workers || [];
      setWorkers(list);
    } catch (err) {
      console.warn("Failed to fetch workers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [activeService]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  return (
    <View style={styles.container}>
      <Header
        title={activeService || t.workersFound}
        subtitle={`${workers.length} verified cooperative members`}
        onBack={onBack}
        showLanguageToggle={true}
      />

      <View style={styles.filterBanner}>
        <Text style={styles.bannerText}>
          🛡️ All workers are NCCT Skill Certified & background verified members.
        </Text>
      </View>

      {loading ? (
        <LoadingState message="Loading verified tradespeople..." />
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onPress={() => onSelectWorker(item)}
              onBook={() => {
                if (onBookWorker) {
                  onBookWorker(item);
                } else if (onBookService) {
                  onBookService();
                } else {
                  onSelectWorker(item);
                }
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="👷"
              title={t.noWorkers}
              description="Check back shortly or explore another cooperative service category."
              actionTitle="Go Back"
              onAction={onBack}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  filterBanner: {
    backgroundColor: THEME.colors.primaryMuted,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.primaryLight,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.primaryDark,
    textAlign: "center",
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.hero * 2,
  },
});

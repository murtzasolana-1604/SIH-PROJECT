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
import { Card } from "../../components/common/Card";
import { WorkerProfile } from "../../types/auth";
import { api } from "../../services/api";
import { LocationService } from "../../services/location";
import { CONFIG } from "../../constants/config";
import { useAuth } from "../../context/AuthContext";
import { TouchableOpacity } from "react-native";

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
  const { customer } = useAuth();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [locationRequired, setLocationRequired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedRadius, setSelectedRadius] = useState<number>(CONFIG.DEFAULT_CUSTOMER_RADIUS_KM || 20);

  const fetchWorkers = async () => {
    try {
      let coords = null;
      try {
        coords = await LocationService.getCurrentLocation();
      } catch (locErr) {
        console.warn("Location error:", locErr);
      }

      const lat = coords?.latitude || customer?.latitude;
      const lng = coords?.longitude || customer?.longitude;

      if (!lat || !lng) {
        setLocationRequired(true);
        setWorkers([]);
      } else {
        setLocationRequired(false);
        const params: Record<string, any> = {
          lat,
          lng,
          radiusKm: selectedRadius,
        };
        if (activeService) params.skill = activeService;

        const res = await api.get("/api/workers/nearby", params);
        const list = Array.isArray(res) ? res : res.workers || [];
        setWorkers(list);
      }
    } catch (err) {
      console.warn("Failed to fetch workers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [activeService, selectedRadius]);

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

      {/* Radius Filter Pills */}
      <View style={styles.radiusPillsRow}>
        {[5, 10, 20, 30, 50].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.radiusPill,
              selectedRadius === r && styles.radiusPillActive,
            ]}
            onPress={() => setSelectedRadius(r)}
          >
            <Text
              style={[
                styles.radiusPillText,
                selectedRadius === r && styles.radiusPillTextActive,
              ]}
            >
              {r === 20 ? "20 KM (Default)" : `${r} KM`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {locationRequired ? (
        <Card variant="outlined" style={styles.locationRequiredCard}>
          <Text style={styles.locationRequiredIcon}>📍</Text>
          <Text style={styles.locationRequiredTitle}>Real Location Required</Text>
          <Text style={styles.locationRequiredDesc}>
            Please enable GPS or update your profile address to view verified {activeService || "cooperative"} tradespeople within your service radius. We do not use simulated coordinates.
          </Text>
          <TouchableOpacity
            style={styles.locationEnableBtn}
            activeOpacity={0.85}
            onPress={fetchWorkers}
          >
            <Text style={styles.locationEnableBtnText}>📍 Detect My Location</Text>
          </TouchableOpacity>
        </Card>
      ) : loading ? (
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
  radiusPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    backgroundColor: THEME.colors.background,
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  radiusPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  radiusPillTextActive: {
    color: THEME.colors.textInverse,
    fontWeight: "700",
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
  locationRequiredCard: {
    padding: THEME.spacing.lg,
    alignItems: "center",
    margin: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
  },
  locationRequiredIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  locationRequiredTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.colors.text,
    marginBottom: 6,
  },
  locationRequiredDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: THEME.spacing.md,
  },
  locationEnableBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius.md,
  },
  locationEnableBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

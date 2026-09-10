/**
 * Customer Home Screen
 * Displays categories, emergency SOS banner, verified workers, and AI assistant quick entry
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/common/Header";
import { ServiceCard } from "../../components/customer/ServiceCard";
import { WorkerCard } from "../../components/customer/WorkerCard";
import { Card } from "../../components/common/Card";
import { LoadingState } from "../../components/common/LoadingState";
import { ServiceItem } from "../../types/booking";
import { WorkerProfile } from "../../types/auth";
import { api } from "../../services/api";
import { LocationService } from "../../services/location";
import { CONFIG } from "../../constants/config";

interface CustomerHomeScreenProps {
  onSelectService: (serviceName: string) => void;
  onSelectWorker: (worker: WorkerProfile) => void;
  onOpenSos?: () => void;
  onEmergencyPress?: () => void;
  onOpenAssistant?: () => void;
  onSaathiPress?: () => void;
  onOpenBookings?: () => void;
}

export const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = ({
  onSelectService,
  onSelectWorker,
  onOpenSos,
  onEmergencyPress,
  onOpenAssistant,
  onSaathiPress,
  onOpenBookings,
}) => {
  const handleSos = onEmergencyPress || onOpenSos || (() => {});
  const handleAssistant = onSaathiPress || onOpenAssistant || (() => {});
  const { t } = useLanguage();
  const { customer } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [locationRequired, setLocationRequired] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRadius, setSelectedRadius] = useState<number>(CONFIG.DEFAULT_CUSTOMER_RADIUS_KM || 20);

  const fetchData = async () => {
    try {
      // Fetch dynamic services catalog
      const servicesRes = await api.get("/api/services");
      if (servicesRes && servicesRes.services) {
        setServices(servicesRes.services);
      }

      // Fetch verified workers with real Haversine location matching
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
        const workersRes = await api.get("/api/workers/nearby", {
          lat,
          lng,
          radiusKm: selectedRadius,
        });
        if (workersRes && workersRes.workers) {
          setWorkers(workersRes.workers.slice(0, 6));
        } else if (workersRes && Array.isArray(workersRes)) {
          setWorkers(workersRes.slice(0, 6));
        }
      }
    } catch (err) {
      console.warn("Failed to load customer home data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRadius]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <Header
        title={`${t.greeting}, ${customer?.name ? customer.name.split(" ")[0] : "Citizen"}!`}
        subtitle={customer?.city ? `📍 ${customer.city}, ${customer.state || ""}` : "📍 Cooperative Network"}
        showLanguageToggle={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Emergency SOS Banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSos}
          style={[styles.sosBanner, THEME.shadows.md]}
        >
          <View style={styles.sosContent}>
            <View style={styles.sosIconCircle}>
              <Text style={styles.sosIcon}>🚨</Text>
            </View>
            <View style={styles.sosTextCol}>
              <Text style={styles.sosTitle}>{t.emergencyBannerTitle}</Text>
              <Text style={styles.sosDesc}>{t.emergencyBannerDesc}</Text>
            </View>
          </View>
          <View style={styles.sosPill}>
            <Text style={styles.sosPillText}>15-Min SLA →</Text>
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder={t.searchPlaceholder}
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Cooperative Trust Highlight */}
        <View style={styles.coopBanner}>
          <Text style={styles.coopTitle}>🤝 Democratic Cooperative Gig Services</Text>
          <Text style={styles.coopSubtitle}>{t.noMiddleman}</Text>
        </View>

        {/* Service Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.serviceCategories}</Text>
          <TouchableOpacity onPress={() => onSelectService("")}>
            <Text style={styles.viewAllText}>{t.viewAll} ({services.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState message="Loading cooperative catalog..." />
        ) : (
          <View style={styles.servicesGrid}>
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => onSelectService(service.name)}
              />
            ))}
          </View>
        )}

        {/* Nearby Verified Workers */}
        <View style={[styles.sectionHeader, { marginTop: THEME.spacing.lg }]}>
          <View>
            <Text style={styles.sectionTitle}>{t.nearbyWorkers}</Text>
            <Text style={{ fontSize: 11, color: THEME.colors.textMuted, marginTop: 2 }}>
              {workers.length} verified tradespeople within {selectedRadius} KM
            </Text>
          </View>
          <TouchableOpacity onPress={() => onSelectService("")}>
            <Text style={styles.viewAllText}>{t.viewAll}</Text>
          </TouchableOpacity>
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
            <Text style={styles.locationRequiredTitle}>Location Required</Text>
            <Text style={styles.locationRequiredDesc}>
              Please enable GPS or update your profile address to discover verified cooperative tradespeople within your radius. Fake coordinates are never used.
            </Text>
            <TouchableOpacity
              style={styles.locationEnableBtn}
              activeOpacity={0.85}
              onPress={fetchData}
            >
              <Text style={styles.locationEnableBtnText}>📍 Detect My Location</Text>
            </TouchableOpacity>
          </Card>
        ) : workers.length === 0 ? (
          <Card variant="outlined" style={{ padding: 18, alignItems: "center", marginVertical: 8 }}>
            <Text style={{ fontSize: 13, color: THEME.colors.textMuted }}>No cooperative workers found within {selectedRadius} KM.</Text>
          </Card>
        ) : (
          workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onPress={() => onSelectWorker(worker)}
              onBook={() => onSelectWorker(worker)}
            />
          ))
        )}

        {/* Sahkaar Saathi Floating Promo */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleAssistant}
          style={[styles.assistantCard, THEME.shadows.md]}
        >
          <View style={styles.assistantAvatar}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
          </View>
          <View style={styles.assistantTextCol}>
            <Text style={styles.assistantTitle}>Need help diagnosing a household issue?</Text>
            <Text style={styles.assistantDesc}>Talk with Sahkaar Saathi in Hindi or English</Text>
          </View>
          <Text style={styles.assistantArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.hero * 2,
  },
  sosBanner: {
    backgroundColor: "#DC2626",
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.md,
  },
  sosContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.sm,
  },
  sosIcon: {
    fontSize: 22,
  },
  sosTextCol: {
    flex: 1,
  },
  sosTitle: {
    fontSize: THEME.typography.sizes.body,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sosDesc: {
    fontSize: 11,
    color: "#FEE2E2",
    marginTop: 1,
  },
  sosPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
  },
  sosPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: THEME.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: THEME.typography.sizes.body,
    color: THEME.colors.text,
  },
  clearSearch: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    padding: 4,
  },
  coopBanner: {
    backgroundColor: THEME.colors.primaryMuted,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.primary,
  },
  coopTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.primaryDark,
  },
  coopSubtitle: {
    fontSize: 11,
    color: THEME.colors.primaryDark,
    marginTop: 2,
  },
  radiusPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: THEME.spacing.xs,
    paddingHorizontal: 2,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: THEME.typography.sizes.title,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  viewAllText: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.primary,
    fontWeight: "700",
  },
  servicesGrid: {
    marginBottom: THEME.spacing.sm,
  },
  assistantCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: THEME.colors.secondaryLight,
  },
  assistantAvatar: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.secondaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  assistantTextCol: {
    flex: 1,
  },
  assistantTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  assistantDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  assistantArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.secondary,
  },
  locationRequiredCard: {
    padding: THEME.spacing.lg,
    alignItems: "center",
    marginVertical: THEME.spacing.md,
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

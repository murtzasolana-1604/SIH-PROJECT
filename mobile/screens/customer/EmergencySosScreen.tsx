/**
 * Emergency SOS Screen
 * 1-Click rapid emergency dispatch with priority SLA tracking
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/common/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { LocationService } from "../../services/location";
import { api } from "../../services/api";

interface EmergencySosScreenProps {
  onBack: () => void;
  onSosDispatched?: (bookingId: number) => void;
  onBookingCreated?: (bookingId: any) => void;
}

export const EmergencySosScreen: React.FC<EmergencySosScreenProps> = ({
  onBack,
  onSosDispatched,
  onBookingCreated,
}) => {
  const { t } = useLanguage();
  const { customer, session } = useAuth();

  const [selectedType, setSelectedType] = useState<string>("SPARKING_MCB");
  const [address, setAddress] = useState<string>(customer?.address || "Plot 42, Civil Lines, Jaipur");
  const [latitude, setLatitude] = useState<number | null>(customer?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(customer?.longitude || null);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);

  const emergencyCategories = [
    { key: "SPARKING_MCB", icon: "⚡", label: "Sparking MCB / Power Outage", service: "Electrician" },
    { key: "BURST_PIPE", icon: "🚰", label: "Burst Pipe / Major Flooding", service: "Plumbing" },
    { key: "DOOR_LOCK", icon: "🔒", label: "Broken Door Lockout", service: "Carpenter" },
    { key: "GAS_LEAK", icon: "🔥", label: "Gas Appliance Hazard", service: "Technician" },
  ];

  useEffect(() => {
    async function checkQueue() {
      try {
        const res = await api.get("/api/emergency/queue");
        if (res && res.queue) {
          setActiveQueueCount(res.queue.length);
        }
      } catch {
        // Ignore background polling error
      }
    }
    checkQueue();
  }, []);

  const handleUseLocation = async () => {
    try {
      const coords = await LocationService.getCurrentLocation();
      if (coords) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (coords.address) setAddress(coords.address);
      }
    } catch {
      // Ignore
    }
  };

  const handleTriggerSos = async () => {
    const selected = emergencyCategories.find((c) => c.key === selectedType);
    const serviceName = selected ? selected.service : "Electrician";
    const customerPhone = session?.phone || customer?.phone || "9876543210";
    const customerName = customer?.name || "Ramesh Kumar";

    setDispatching(true);
    try {
      const res = await api.post("/api/emergency/sos", {
        service: serviceName,
        customerName,
        customerPhone,
        address,
        emergencyCategory: selectedType,
        severity: "CRITICAL",
        latitude,
        longitude,
      });

      if (res && res.success && res.booking) {
        Alert.alert(
          "🚨 Emergency SOS Dispatched!",
          `Booking #${res.booking.id} has been broadcast to all verified ${serviceName} members within your radius with a guaranteed 15-minute response window.`
        );
        if (onSosDispatched) onSosDispatched(res.booking.id);
        if (onBookingCreated) onBookingCreated(String(res.booking.id));
      } else {
        Alert.alert("Dispatch Error", res.message || "Could not register emergency call.");
      }
    } catch (err: any) {
      Alert.alert("Server Error", err.message || "Failed to contact emergency dispatch.");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t.sosTitle}
        subtitle="Priority Household Distress Network"
        onBack={onBack}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Warning Hero */}
        <View style={styles.heroBox}>
          <View style={styles.sosPill}>
            <Text style={styles.sosPillText}>🚨 CRITICAL RESPONSE PROTOCOL</Text>
          </View>
          <Text style={styles.heroTitle}>Guaranteed 15-Minute Cooperative SLA</Text>
          <Text style={styles.heroSubtitle}>
            Activates immediate broadcast to on-duty certified tradespeople nearest your location.
          </Text>
          <View style={styles.queueStatus}>
            <Text style={styles.queueText}>
              ● Active Emergency Queue: {activeQueueCount} Active Dispatch{activeQueueCount === 1 ? "" : "es"}
            </Text>
          </View>
        </View>

        {/* Category Picker */}
        <Text style={styles.sectionHeader}>{t.emergencyServiceType}</Text>
        <View style={styles.categoryGrid}>
          {emergencyCategories.map((cat) => {
            const isSelected = selectedType === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                onPress={() => setSelectedType(cat.key)}
                style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel, isSelected && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location Input */}
        <Card variant="outlined" style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressTitle}>📍 Emergency Incident Location</Text>
            <TouchableOpacity onPress={handleUseLocation}>
              <Text style={styles.gpsText}>GPS Refresh</Text>
            </TouchableOpacity>
          </View>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Enter exact address or landmark"
            multiline
            numberOfLines={2}
          />
        </Card>

        {/* Dispatch Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleTriggerSos}
          disabled={dispatching}
          style={[styles.sosButton, THEME.shadows.lg]}
        >
          <Text style={styles.sosButtonIcon}>🚨</Text>
          <Text style={styles.sosButtonText}>
            {dispatching ? "DISPATCHING SOS..." : t.triggerSos}
          </Text>
          <Text style={styles.sosButtonSub}>Guaranteed 15-Min Response SLA</Text>
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
  heroBox: {
    backgroundColor: "#7F1D1D",
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  sosPill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    marginBottom: THEME.spacing.xs,
  },
  sosPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FEE2E2",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#FECACA",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },
  queueStatus: {
    marginTop: THEME.spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
  },
  queueText: {
    fontSize: 11,
    color: "#FDE047",
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.colors.text,
    marginVertical: THEME.spacing.xs,
  },
  categoryGrid: {
    marginBottom: THEME.spacing.md,
  },
  categoryCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCardActive: {
    borderColor: THEME.colors.danger,
    backgroundColor: "#FEF2F2",
  },
  catIcon: {
    fontSize: 22,
    marginRight: THEME.spacing.md,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.text,
    flex: 1,
  },
  catLabelActive: {
    color: THEME.colors.danger,
  },
  addressCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.xs,
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  gpsText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  sosButton: {
    backgroundColor: THEME.colors.danger,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: THEME.spacing.md,
  },
  sosButtonIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  sosButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  sosButtonSub: {
    fontSize: 12,
    color: "#FEE2E2",
    fontWeight: "600",
    marginTop: 2,
  },
});

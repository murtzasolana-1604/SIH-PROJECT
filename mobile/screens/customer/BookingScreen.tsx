/**
 * Customer Booking Screen
 * Facilitates booking creation and submits directly to PostgreSQL backend
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/common/Header";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { WorkerProfile } from "../../types/auth";
import { LocationService } from "../../services/location";
import { api } from "../../services/api";

interface BookingScreenProps {
  initialService?: string;
  serviceName?: string;
  initialWorker?: WorkerProfile | null;
  worker?: WorkerProfile | null;
  onBack: () => void;
  onBookingSuccess?: (bookingId: number) => void;
  onSuccess?: () => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  initialService,
  serviceName,
  initialWorker,
  worker,
  onBack,
  onBookingSuccess,
  onSuccess,
}) => {
  const activeService = serviceName || initialService || "Electrician";
  const activeWorker = worker || initialWorker || null;
  const { t } = useLanguage();
  const { customer, session } = useAuth();

  const [service, setService] = useState<string>(activeService);
  const [address, setAddress] = useState<string>(customer?.address || "Plot 42, Civil Lines, Jaipur");
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [bookingTime, setBookingTime] = useState<string>("10:00 AM");
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number | null>(customer?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(customer?.longitude || null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const timeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];

  const basePrice = 249;
  const emergencyFee = isEmergency ? 50 : 0;
  const totalAmount = basePrice + emergencyFee;
  const workerShare = Math.round(totalAmount * 0.85 * 100) / 100;
  const coopShare = Math.round((totalAmount - workerShare) * 100) / 100;

  const handleUseGps = async () => {
    try {
      const coords = await LocationService.getCurrentLocation();
      if (coords) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (coords.address) setAddress(coords.address);
        Alert.alert("GPS Attached", "Your current location has been attached to this booking.");
      }
    } catch {
      Alert.alert("Location", "Could not fetch GPS. Please verify address text.");
    }
  };

  const handleConfirmBooking = async () => {
    setError("");
    const customerPhone = session?.phone || customer?.phone || "9876543210";
    const customerName = customer?.name || "Ramesh Kumar";

    if (!address.trim()) {
      setError("Please provide a service delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        service,
        customerName,
        customerPhone,
        address: address.trim(),
        bookingDate,
        bookingTime,
        isEmergency: isEmergency ? 1 : 0,
        customerLat: latitude,
        customerLng: longitude,
        emergencyType: isEmergency ? "URGENT_CALL" : undefined,
      };

      const res = await api.post("/api/bookings", payload);

      if (res.success || res.booking) {
        const bId = res.booking?.id || 1;
        if (onBookingSuccess) onBookingSuccess(bId);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || "Failed to create booking.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reach server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header
        title={t.bookService}
        subtitle={service}
        onBack={onBack}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {initialWorker && (
          <Card variant="outlined" style={styles.workerSummaryCard}>
            <Text style={styles.workerSummaryLabel}>Selected Cooperative Member:</Text>
            <Text style={styles.workerSummaryName}>
              👤 {initialWorker.name} ({initialWorker.skill})
            </Text>
            <Text style={styles.workerSummaryAffiliation}>
              🏛️ {initialWorker.society_name || "Cooperative Society"} • NCCT Verified
            </Text>
          </Card>
        )}

        {/* Date Selector */}
        <Card variant="elevated" style={styles.formCard}>
          <Text style={styles.sectionTitle}>📅 {t.selectDate}</Text>
          <View style={styles.dateRow}>
            {["Today", "Tomorrow", "Next Day"].map((label, idx) => {
              const d = new Date();
              d.setDate(d.getDate() + idx);
              const dateStr = d.toISOString().split("T")[0];
              const isSelected = bookingDate === dateStr;

              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setBookingDate(dateStr)}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                >
                  <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>
                    {label}
                  </Text>
                  <Text style={[styles.dateChipSub, isSelected && styles.dateChipSubActive]}>
                    {dateStr.slice(5)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Slot Picker */}
          <Text style={[styles.sectionTitle, { marginTop: THEME.spacing.md }]}>
            ⏰ {t.selectTime}
          </Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((slot) => {
              const isSelected = bookingTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setBookingTime(slot)}
                  style={[styles.timeChip, isSelected && styles.timeChipActive]}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Address */}
          <View style={[styles.addressHeaderRow, { marginTop: THEME.spacing.md }]}>
            <Text style={styles.sectionTitle}>📍 {t.serviceAddress}</Text>
            <TouchableOpacity onPress={handleUseGps}>
              <Text style={styles.gpsText}>Use GPS</Text>
            </TouchableOpacity>
          </View>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="Street address, house number, area"
            multiline
            numberOfLines={2}
            style={{ height: 64 }}
          />

          {/* Emergency SOS Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsEmergency(!isEmergency)}
            style={[styles.emergencyToggle, isEmergency && styles.emergencyToggleActive]}
          >
            <View style={styles.checkboxSquare}>
              <Text style={{ fontSize: 14 }}>{isEmergency ? "✓" : ""}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: THEME.spacing.sm }}>
              <Text style={styles.emergencyToggleTitle}>🚨 Urgent / Emergency Priority</Text>
              <Text style={styles.emergencyToggleDesc}>
                15-Minute Guaranteed SLA Response (+₹50 rapid dispatch fee)
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Cooperative Transparent Pricing Card */}
        <Card variant="outlined" style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>🤝 Transparent Cooperative Breakdown</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Standard Service Charge</Text>
            <Text style={styles.pricingValue}>₹{basePrice}</Text>
          </View>
          {isEmergency && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Rapid Emergency Dispatch Fee</Text>
              <Text style={styles.pricingValue}>+₹{emergencyFee}</Text>
            </View>
          )}
          <View style={[styles.pricingRow, styles.pricingDivider]}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.breakdownNotice}>
            <Text style={styles.breakdownText}>
              • 85% Take-Home to Member: ₹{workerShare}
            </Text>
            <Text style={styles.breakdownText}>
              • 15% NCCT Welfare & PMSBY Fund: ₹{coopShare}
            </Text>
            <Text style={styles.zeroCut}>0% Private Middleman Cut</Text>
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={`${t.confirmBooking} (₹${totalAmount})`}
          variant="primary"
          onPress={handleConfirmBooking}
          loading={submitting}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  workerSummaryCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.primaryLight,
  },
  workerSummaryLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  workerSummaryName: {
    fontSize: THEME.typography.sizes.body,
    fontWeight: "700",
    color: THEME.colors.primaryDark,
    marginTop: 2,
  },
  workerSummaryAffiliation: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    padding: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: THEME.typography.sizes.subtext,
    fontWeight: "700",
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateChip: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    alignItems: "center",
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginHorizontal: 3,
    backgroundColor: THEME.colors.surface,
  },
  dateChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryMuted,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  dateChipTextActive: {
    color: THEME.colors.primaryDark,
  },
  dateChipSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  dateChipSubActive: {
    color: THEME.colors.primaryDark,
    fontWeight: "600",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: THEME.colors.surface,
  },
  timeChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.text,
  },
  timeChipTextActive: {
    color: THEME.colors.textInverse,
  },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpsText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  emergencyToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
  },
  emergencyToggleActive: {
    borderColor: THEME.colors.danger,
    backgroundColor: "#FFF5F5",
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: THEME.colors.danger,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  emergencyToggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.danger,
  },
  emergencyToggleDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  pricingCard: {
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
  },
  pricingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  pricingLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  pricingValue: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.text,
  },
  pricingDivider: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 6,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.colors.primary,
  },
  breakdownNotice: {
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    marginTop: THEME.spacing.sm,
  },
  breakdownText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginVertical: 1,
  },
  zeroCut: {
    fontSize: 11,
    color: THEME.colors.primaryDark,
    fontWeight: "700",
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
    textAlign: "center",
    marginVertical: THEME.spacing.xs,
  },
  confirmBtn: {
    marginTop: THEME.spacing.md,
  },
});

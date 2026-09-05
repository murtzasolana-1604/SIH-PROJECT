/**
 * Booking Detail Screen
 * Full job lifecycle tracking, tax invoice preview, UPI settlement, and customer reviews
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { Header } from "../../components/common/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { Booking, Invoice } from "../../types/booking";
import { api } from "../../services/api";

interface BookingDetailScreenProps {
  booking: Booking;
  onBack: () => void;
  onBookingUpdated?: () => void;
}

export const BookingDetailScreen: React.FC<BookingDetailScreenProps> = ({
  booking,
  onBack,
  onBookingUpdated,
}) => {
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(true);
  const [paying, setPaying] = useState<boolean>(false);

  // Rating State
  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  const fetchInvoice = async () => {
    try {
      const res = await api.get("/api/invoices", { bookingId: booking.id });
      if (res && res.invoice) {
        setInvoice(res.invoice);
      }
    } catch (err) {
      console.warn("Invoice not ready:", err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [booking.id]);

  const handlePayUpi = async () => {
    setPaying(true);
    try {
      const res = await api.post("/api/payments/mock", {
        bookingId: booking.id,
        method: "UPI",
      });

      if (res && res.success) {
        Alert.alert("Payment Settled", res.message || "Payment of service fee settled successfully via Demo UPI.");
        fetchInvoice();
        if (onBookingUpdated) onBookingUpdated();
      } else {
        Alert.alert("Payment Failed", res.message || "Failed to settle payment.");
      }
    } catch (err: any) {
      Alert.alert("Payment Error", err.message || "Server error while processing payment.");
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!booking.assigned_worker_id && !booking.id) return;
    setSubmittingRating(true);
    try {
      const res = await api.post("/api/ratings", {
        bookingId: booking.id,
        workerId: booking.assigned_worker_id,
        stars,
        comment: comment.trim() || "Great cooperative service!",
      });

      if (res && res.success) {
        setRatingSubmitted(true);
        Alert.alert("Thank You!", "Your verified rating has been recorded for the cooperative worker.");
      } else {
        Alert.alert("Rating Failed", res.message || "Could not submit rating.");
      }
    } catch (err: any) {
      Alert.alert("Rating Error", err.message || "Could not submit rating.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const isEmergency = booking.is_emergency === 1;

  return (
    <View style={styles.container}>
      <Header
        title={`Booking #${booking.id}`}
        subtitle={booking.service}
        onBack={onBack}
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Header Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.serviceName}>{booking.service}</Text>
              <Text style={styles.dateSlot}>
                📅 {booking.booking_date} • ⏰ {booking.booking_time}
              </Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>
          {isEmergency && (
            <View style={styles.emergencyNotice}>
              <Text style={styles.emergencyNoticeText}>
                🚨 Priority 1-Click SOS Dispatch • 15-Min Guaranteed SLA
              </Text>
            </View>
          )}
        </Card>

        {/* Location Card */}
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionHeader}>📍 Service Location</Text>
          <Text style={styles.addressText}>{booking.address}</Text>
          <Text style={styles.customerPhone}>📞 Citizen: {booking.customer_name} (+91 {booking.customer_phone})</Text>
        </Card>

        {/* Assigned Worker Card */}
        <Card variant="outlined" style={styles.card}>
          <Text style={styles.sectionHeader}>👷 Assigned Cooperative Member</Text>
          {booking.worker_name ? (
            <View style={styles.workerInfoRow}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerAvatarText}>
                  {booking.worker_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{booking.worker_name}</Text>
                <Text style={styles.workerSkill}>
                  {booking.worker_skill || booking.service} • NCCT Skill Certified
                </Text>
                {booking.worker_phone && (
                  <Text style={styles.workerPhone}>📞 Phone: +91 {booking.worker_phone}</Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.unassigned}>
              ⏳ Your booking is in the dispatch queue. The nearest cooperative member will be assigned shortly.
            </Text>
          )}
        </Card>

        {/* Invoice & Payment Section */}
        {invoice ? (
          <Card variant="elevated" style={[styles.card, styles.invoiceCard]}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>🏛️ Cooperative Tax Invoice</Text>
              <StatusBadge status={invoice.payment_status === "paid" ? "Paid" : "Pending Payment"} size="sm" />
            </View>

            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Standard Service Charge</Text>
              <Text style={styles.invoiceVal}>₹{invoice.service_charge}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Worker Direct Living Wage (85%)</Text>
              <Text style={styles.invoiceVal}>₹{invoice.worker_earning}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>NCCT Welfare & PMSBY Fund (15%)</Text>
              <Text style={styles.invoiceVal}>₹{invoice.cooperative_share}</Text>
            </View>
            <View style={[styles.invoiceRow, styles.invoiceTotalRow]}>
              <Text style={styles.invoiceTotalLabel}>Total Amount</Text>
              <Text style={styles.invoiceTotalVal}>₹{invoice.total_amount}</Text>
            </View>

            {invoice.payment_status !== "paid" && (
              <Button
                title={paying ? "Settling via UPI..." : "💳 Pay via Mock UPI (Demo Simulator)"}
                variant="primary"
                onPress={handlePayUpi}
                loading={paying}
                style={styles.payBtn}
              />
            )}
          </Card>
        ) : null}

        {/* Rating Form (If completed) */}
        {booking.status === "Completed" && (
          <Card variant="outlined" style={styles.card}>
            <Text style={styles.sectionHeader}>★ Rate This Cooperative Service</Text>
            {ratingSubmitted ? (
              <Text style={styles.ratingThanks}>
                ✅ Thank you! Your feedback has been verified and added to the member's cooperative record.
              </Text>
            ) : (
              <View>
                <Text style={styles.ratingSubtitle}>Tap to rate your experience:</Text>
                <View style={{ marginVertical: THEME.spacing.sm }}>
                  <RatingStars
                    rating={stars}
                    interactive={true}
                    size={24}
                    onSelectRating={setStars}
                  />
                </View>
                <Input
                  label="Review Comments"
                  placeholder="e.g., Timely arrival, courteous service, quality work..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={2}
                  style={{ height: 60 }}
                />
                <Button
                  title="Submit Cooperative Review"
                  variant="primary"
                  onPress={handleSubmitRating}
                  loading={submittingRating}
                  style={{ marginTop: THEME.spacing.sm }}
                />
              </View>
            )}
          </Card>
        )}
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
  card: {
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  dateSlot: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  emergencyNotice: {
    backgroundColor: THEME.colors.dangerMuted,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    marginTop: THEME.spacing.md,
  },
  emergencyNoticeText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.danger,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  addressText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  customerPhone: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  workerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: THEME.spacing.xs,
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.colors.textInverse,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.text,
  },
  workerSkill: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  workerPhone: {
    fontSize: 11,
    color: THEME.colors.primaryDark,
    marginTop: 2,
  },
  unassigned: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  invoiceCard: {
    borderColor: THEME.colors.primaryLight,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  invoiceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: THEME.colors.primaryDark,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  invoiceLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  invoiceVal: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.text,
  },
  invoiceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 6,
    marginTop: 6,
  },
  invoiceTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  invoiceTotalVal: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.colors.primary,
  },
  payBtn: {
    marginTop: THEME.spacing.md,
  },
  ratingSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  ratingThanks: {
    fontSize: 13,
    color: THEME.colors.primaryDark,
    fontWeight: "600",
    paddingVertical: THEME.spacing.sm,
  },
});

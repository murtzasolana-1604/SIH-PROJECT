/**
 * Customer Bookings Screen
 * Filterable tabs: Upcoming, In Progress, Completed, Cancelled
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/common/Header";
import { BookingCard } from "../../components/customer/BookingCard";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";
import { Booking } from "../../types/booking";
import { api } from "../../services/api";

interface CustomerBookingsScreenProps {
  onSelectBooking: (booking: Booking) => void;
  onPayBooking?: (booking: Booking) => void;
  onRateBooking?: (booking: Booking) => void;
  onNewBooking?: () => void;
}

export const CustomerBookingsScreen: React.FC<CustomerBookingsScreenProps> = ({
  onSelectBooking,
  onPayBooking,
  onRateBooking,
  onNewBooking,
}) => {
  const { t } = useLanguage();
  const { session, customer } = useAuth();

  const [activeTab, setActiveTab] = useState<"All" | "Upcoming" | "In Progress" | "Completed" | "Cancelled">("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchBookings = async () => {
    const phone = session?.phone || customer?.phone || "9876543210";
    try {
      const res = await api.get("/api/bookings", { phone });
      if (res && res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.warn("Failed to fetch customer bookings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "All") return true;
    if (activeTab === "Upcoming") return b.status === "Pending" || b.status === "Assigned";
    if (activeTab === "In Progress") return b.status === "In Progress";
    if (activeTab === "Completed") return b.status === "Completed";
    if (activeTab === "Cancelled") return b.status === "Cancelled";
    return true;
  });

  const tabs: Array<"All" | "Upcoming" | "In Progress" | "Completed" | "Cancelled"> = [
    "All",
    "Upcoming",
    "In Progress",
    "Completed",
    "Cancelled",
  ];

  return (
    <View style={styles.container}>
      <Header
        title={t.myBookings}
        subtitle={`${bookings.length} cooperative service requests`}
        showLanguageToggle={true}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab === "All"
                  ? "All"
                  : tab === "Upcoming"
                  ? t.tabUpcoming
                  : tab === "In Progress"
                  ? t.tabActive
                  : tab === "Completed"
                  ? t.tabCompleted
                  : t.tabCancelled}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingState message="Fetching your cooperative bookings..." />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => onSelectBooking(item)}
              onPay={onPayBooking ? () => onPayBooking(item) : undefined}
              onRate={onRateBooking ? () => onRateBooking(item) : undefined}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="📖"
              title={t.noBookings}
              description="You have no service bookings in this category."
              actionTitle="Book a Service"
              onAction={onNewBooking}
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.sm,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontWeight: "700",
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.hero * 2,
  },
});

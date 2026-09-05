/**
 * Customer Onboarding & Profile Setup Screen
 * Captures name, service address, and optional GPS coordinates
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { THEME } from "../../constants/theme";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/common/Header";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { LocationService } from "../../services/location";
import { api } from "../../services/api";

interface CustomerOnboardingScreenProps {
  onComplete: () => void;
}

export const CustomerOnboardingScreen: React.FC<CustomerOnboardingScreenProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const { customer, session, updateCustomerState } = useAuth();

  const [name, setName] = useState<string>(customer?.name || "Ramesh Kumar");
  const [address, setAddress] = useState<string>(customer?.address || "Plot 42, Civil Lines");
  const [villageTown, setVillageTown] = useState<string>(customer?.village_town || "Civil Lines");
  const [city, setCity] = useState<string>(customer?.city || "Jaipur");
  const [state, setState] = useState<string>(customer?.state || "Rajasthan");
  const [pincode, setPincode] = useState<string>(customer?.pincode || "302006");
  const [latitude, setLatitude] = useState<number | null>(customer?.latitude || 26.9124);
  const [longitude, setLongitude] = useState<number | null>(customer?.longitude || 75.7873);
  const [locating, setLocating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleUseLocation = async () => {
    setLocating(true);
    try {
      const coords = await LocationService.getCurrentLocation();
      if (coords) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (coords.address) setAddress(coords.address);
        if (coords.city) setCity(coords.city);
        if (coords.state) setState(coords.state);
        if (coords.pincode) setPincode(coords.pincode);
        Alert.alert("Location Attached", t.locationGranted);
      } else {
        Alert.alert("Permission Required", t.locationDenied);
      }
    } catch (e) {
      Alert.alert("Location", "Could not fetch GPS location. You can enter manually.");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim() || !city.trim() || !state.trim()) {
      setError("Please fill in your name, city, and state.");
      return;
    }

    setSaving(true);
    const phone = session?.phone || customer?.phone || "9876543210";
    try {
      const res = await api.post("/api/customer/profile", {
        phone,
        name: name.trim(),
        address: address.trim(),
        villageTown: villageTown.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        latitude,
        longitude,
      });

      if (res.success && res.customer) {
        updateCustomerState(res.customer);
        onComplete();
      } else {
        setError(res.message || "Failed to save profile.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile to server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header
        title={t.completeProfile}
        subtitle="Citizen Registration"
        showLanguageToggle={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t.completeProfile}</Text>
        <Text style={styles.headerSubtitle}>{t.onboardingSubtitle}</Text>

        <Card variant="elevated" style={styles.card}>
          <Input
            label={t.fullName}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.locationButtonBox}>
            <Button
              title={locating ? t.locating : t.useCurrentLocation}
              variant="outline"
              onPress={handleUseLocation}
              loading={locating}
              style={styles.gpsBtn}
            />
            {latitude && longitude && (
              <Text style={styles.coordsText}>
                📍 GPS Attached: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <Input
            label={t.address}
            placeholder="House / Flat No., Street, Colony"
            value={address}
            onChangeText={setAddress}
          />

          <Input
            label={t.villageTown}
            placeholder="Village, Town, or Locality"
            value={villageTown}
            onChangeText={setVillageTown}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: THEME.spacing.sm }}>
              <Input
                label={t.city}
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t.pincode}
                placeholder="PIN"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <Input
            label={t.state}
            placeholder="State"
            value={state}
            onChangeText={setState}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title={t.save}
            variant="primary"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </Card>
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
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.hero,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.colors.text,
  },
  headerSubtitle: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    marginBottom: THEME.spacing.md,
  },
  card: {
    padding: THEME.spacing.lg,
  },
  locationButtonBox: {
    marginVertical: THEME.spacing.sm,
  },
  gpsBtn: {
    height: 42,
  },
  coordsText: {
    fontSize: 11,
    color: THEME.colors.primaryDark,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.danger,
    marginTop: THEME.spacing.xs,
    textAlign: "center",
  },
  saveBtn: {
    marginTop: THEME.spacing.lg,
  },
});

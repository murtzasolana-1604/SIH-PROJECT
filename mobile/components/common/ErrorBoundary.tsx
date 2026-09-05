import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🏛️</Text>
            <Text style={styles.headerTitle}>Sahkaar Connect</Text>
            <Text style={styles.headerSubtitle}>Ministry of Cooperation • SIH26089</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.cardTitle}>Application Recovered</Text>
              <Text style={styles.cardDesc}>
                A temporary interface issue occurred, but your session and data are secure.
              </Text>

              {this.state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.8}
                onPress={this.handleReset}
              >
                <Text style={styles.retryButtonText}>🔄 Reload Sahkaar Connect</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textInverse,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#DCFCE7",
    marginTop: 2,
  },
  content: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: "100%",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    width: "100%",
    alignItems: "center",
  },
  retryButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "700",
  },
});

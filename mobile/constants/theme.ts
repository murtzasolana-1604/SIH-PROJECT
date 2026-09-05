/**
 * Sahkaar Connect Mobile Theme
 * National Cooperative palette with accessible contrast
 */

export const THEME = {
  colors: {
    // Primary: Cooperative Green
    primary: "#15803D",
    primaryLight: "#22C55E",
    primaryDark: "#166534",
    primaryMuted: "#DCFCE7",

    // Accent: National Saffron / Warning
    accent: "#EA580C",
    accentLight: "#FB923C",
    accentMuted: "#FFEDD5",

    // Secondary: Democratic Blue
    secondary: "#1E40AF",
    secondaryLight: "#3B82F6",
    secondaryMuted: "#DBEAFE",

    // Emergency SOS: Crimson
    danger: "#DC2626",
    dangerLight: "#EF4444",
    dangerMuted: "#FEE2E2",

    // Neutral & Surfaces
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",

    // Text
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    textInverse: "#FFFFFF",

    // States
    success: "#16A34A",
    warning: "#D97706",
    info: "#0284C7"
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    hero: 32
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999
  },

  typography: {
    fontFamily: {
      regular: "System",
      medium: "System",
      bold: "System"
    },
    sizes: {
      caption: 11,
      subtext: 13,
      body: 15,
      title: 17,
      header: 20,
      hero: 26
    }
  },

  shadows: {
    sm: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4
    },
    lg: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8
    }
  }
};

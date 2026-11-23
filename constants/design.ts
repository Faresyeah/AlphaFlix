import { Platform } from "react-native";

export const DESIGN = {
  colors: {
    background: "#050505",
    backgroundElevated: "#0B0B0B",
    surface: "#121212",
    surfaceRaised: "#1B1B1B",
    surfaceSoft: "#252525",
    primary: "#E50914",
    primaryStrong: "#B20710",
    secondary: "#FF3344",
    accent: "#FFFFFF",
    text: "#FFFFFF",
    textSecondary: "#C4C4C4",
    textMuted: "#858585",
    border: "#2B2B2B",
    borderStrong: "#444444",
    success: "#FFFFFF",
    warning: "#FF3344",
    error: "#FF5A67",
    overlay: "#050505E8",
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 },
  radius: { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  icon: { sm: 16, md: 20, lg: 24, xl: 30 },
  typography: { eyebrow: 10, caption: 12, body: 14, bodyLarge: 16, title: 24, display: 32 },
  fontFamily: Platform.select({ ios: "System", android: "sans-serif", default: "normal" }),
} as const;

export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.28,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 5,
} as const;

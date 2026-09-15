/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#12345F",
        canvas: "#F5F8FC",
        primary: "#1769E8",
        "primary-alt": "#1257C8",
        secondary: "#10B981",
        accent: "#F59E0B",
        surface: "#FFFFFF",
        "surface-2": "#EAF2FC",
        muted: "#6B7280",
        line: "#DCE7F5",
        // Alias attendus par les composants importés de bridge-connector
        light: "#F5F3EE",
        text: "#12181B",
        accentSoft: "#E7ECF3",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        heading: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

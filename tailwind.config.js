/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Palette "Ardoise & Signal" — bleu nuit profond + accent corail signalétique.
        // Choisi pour un outil de suivi pro (lisible, sobre) plutôt que les défauts
        // crème/terracotta ou noir/vert acide génériques.
        ink: "#12181B",
        canvas: "#F5F3EE",
        primary: "#1F3A5F", // bleu nuit — actions principales, nav
        "primary-alt": "#2C5282",
        secondary: "#3B7A68", // vert sauge — validations, présence
        accent: "#E0653A", // corail — alertes, priorités, signature visuelle
        surface: "#FFFFFF",
        "surface-2": "#F1EFE9",
        muted: "#6B7280",
        line: "#D8D3C8",
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

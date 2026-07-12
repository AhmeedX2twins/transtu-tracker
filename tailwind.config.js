/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "tt-green": "#00843D",
        "tt-green-dark": "#006A31",
        "tt-green-soft": "#E6F3EC",
        "tt-yellow": "#F2B500",
        "tt-yellow-soft": "#FDF3D7",
        "tt-blue": "#0078C8",
        "tt-blue-soft": "#E5F2FA",
        "tt-bg": "#F7F9F8",
        "tt-ink": "#1F2933",
        "tt-muted": "#6B7280",
        "tt-line": "#E5E7EB",
        "tt-red": "#D63A3A",
        "tt-red-soft": "#FBE9E9",
      },
    },
  },
  plugins: [],
};

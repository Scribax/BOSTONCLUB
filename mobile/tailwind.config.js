/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        boston: {
          black: "#050505",
          gold: "#D4AF37",
          red: "#FF3B30",
          "red-glow": "#FF4D4D",
        }
      }
    },
  },
  plugins: [],
}

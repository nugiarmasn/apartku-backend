/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Pastikan ini ada!
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F1F3D",
        gold: "#F5A623",
      },
      boxShadow: {
        neo: "4px 4px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
  plugins: [],
}
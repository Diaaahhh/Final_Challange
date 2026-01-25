/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'), // This adds the components
  ],
  daisyui: {
    themes: ["light", "dark", "cupcake"], // Adds nice color themes
  },
}
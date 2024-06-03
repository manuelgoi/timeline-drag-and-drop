const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    // Activar esta linea cuando estemos desarrollando sobre un componente que tenga tailwind
    // en un repo externo.
    // "./node_modules/@letsgoi/filter-machine-dev/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      screens: {
        xs: "360px",
        "2.5xl": "1600px",
        "3xl": "1800px",
        "3.5xl": "2000px",
        "4xl": "2200px",
        "4.5xl": "2400px",
        "5xl": "2600px",
        "5.5xl": "2800px",
        "6xl": "3000px",
        "6.5xl": "3200px",
        "7xl": "3400px",
        "7.5xl": "3600px",
        "8xl": "3800px",
        "8.5xl": "4000px",
      },
      zIndex: {
        60: "60",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss/plugin")(({ addVariant }) => {
      addVariant("search-cancel", "&::-webkit-search-cancel-button");
    }),
  ],
};

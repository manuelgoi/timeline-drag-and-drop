module.exports = {
  $schema: "https://json.schemastore.org/prettierrc",
  useTabs: false,
  singleQuote: false,
  tabWidth: 2,
  printWidth: 80,
  trailingComma: "es5",
  tailwindConfig: "./tailwind.config.cjs",
  plugins: [require("prettier-plugin-tailwindcss")],
};

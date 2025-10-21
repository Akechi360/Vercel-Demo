import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**/*.js", // Ignorar scripts JavaScript antiguos
      "prisma/seed.ts", // Ignorar seed
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // Cambiar a warning en vez de error
      "@typescript-eslint/no-require-imports": "off", // Permitir require() en scripts
      "@typescript-eslint/no-unused-vars": "warn", // Cambiar a warning
    },
  },
];

export default eslintConfig;

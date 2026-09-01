import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".vite"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      // React 19 specific tweaks
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // Three.js / R3F specific tweaks
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "position",
            "rotation",
            "scale",
            "args",
            "geometry",
            "material",
            "attach",
            "blending",
            "depthWrite",
            "emissive",
            "emissiveIntensity",
            "frustumCulled",
            "intensity",
            "roughness",
            "metalness",
            "transparent",
            "vertexColors",
            "sizeAttenuation",
          ],
        },
      ],

      // Enforce clean variables
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    // eslint-plugin-react-hooks v7 adds React Compiler readiness rules
    // (`purity`, `immutability`, etc.) to its recommended set. These assume a
    // pure React DOM render model and conflict with the imperative,
    // ref-mutation-based `useFrame` pattern required for R3F/Three.js
    // performance (see project custom instructions). Relax them for 3D
    // components where mutating refs/camera/geometry each frame is expected.
    files: ["src/components/3d/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
  // Ensure Prettier rules override any conflicting ESLint styling rules
  prettierConfig
);

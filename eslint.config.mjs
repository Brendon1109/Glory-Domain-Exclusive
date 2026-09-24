import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated output.
    ".open-next/**",
    ".wrangler/**",
    "dist-dryrun/**",
    "public/bible-data/**",
  ]),
  // Six findings from these two React Compiler rules predate CI (reading
  // localStorage after mount, Date.now in a render). They stay visible as
  // warnings until they are fixed on purpose, every other rule still fails CI.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "public/sw.js", "coverage/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Icons are locked to react-icons/io5 (Ionicons). Ban lucide-react and
      // every react-icons subset except io5 so there is a single audited source.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message: "Icons are locked to react-icons/io5. Do not use lucide-react.",
            },
          ],
          patterns: [
            {
              group: ["react-icons/*", "!react-icons/io5"],
              message: "Only react-icons/io5 (Ionicons) is allowed for iconography.",
            },
          ],
        },
      ],
    },
  },
  // Enforce that Dexie and the local DB layer are only imported from client
  // modules (files carrying the "use client" directive). src/db/* and the
  // dexie / dexie-react-hooks packages touch IndexedDB and must never be pulled
  // into a server component or a framework-free lib module (design Sections 9/16).
  // ESLint cannot read the "use client" directive directly in flat config, so
  // this guard bans those imports everywhere EXCEPT the client-only surfaces
  // (src/features, src/components, src/store, and the db layer itself), which
  // are the modules permitted to carry "use client".
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/db/**",
      "src/features/**",
      "src/components/**",
      "src/store/**",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message: "Icons are locked to react-icons/io5. Do not use lucide-react.",
            },
            {
              name: "dexie",
              message: 'dexie may only be imported from "use client" modules (design 9/16).',
            },
            {
              name: "dexie-react-hooks",
              message: 'dexie-react-hooks may only be imported from "use client" modules (design 9/16).',
            },
          ],
          patterns: [
            {
              group: ["react-icons/*", "!react-icons/io5"],
              message: "Only react-icons/io5 (Ionicons) is allowed for iconography.",
            },
            {
              group: ["@/db/*", "@/db"],
              message: 'The DB layer (src/db/*) may only be imported from "use client" modules (design 9/16).',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

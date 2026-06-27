import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    // Never lint build output or the generated parser (see CLAUDE.md).
    { ignores: ["lib/**", "src/g_parser.js"] },

    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
        },

        rules: {
            "no-unused-vars": "off",

            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            }],
        },
    },
);

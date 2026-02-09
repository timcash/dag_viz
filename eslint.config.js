import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    {
        ignores: ["dist/**", "node_modules/**", "*.bak"],
    },
    {
        files: ["src/**/*.ts", "src3/**/*.ts", "src4/**/*.ts", "server.ts", "template_src.ts"],
        languageOptions: {
            parser: tsparser,
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                THREE: "readonly",
                Bun: "readonly",
                window: "readonly",
                document: "readonly",
                requestAnimationFrame: "readonly",
                console: "readonly",
                prompt: "readonly"
            }
        },
        plugins: {
            "@typescript-eslint": tseslint
        },
        rules: {
            "no-unused-vars": "off", // Use TS rule instead
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "off"
        }
    }
];
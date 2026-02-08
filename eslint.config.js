export default [
    {
        ignores: ["dist/**"],
    },
    {
        files: ["src/**/*.js"],
        languageOptions: {
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
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off"
        }
    }
];

import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: {
                    DEFAULT: "var(--accent)",
                    muted: "var(--accent-muted)",
                }
            },
            fontFamily: {
                sans: ["var(--font-inter)"],
                display: ["var(--font-outfit)"],
            }
        },
    },
    plugins: [],
};
export default config;

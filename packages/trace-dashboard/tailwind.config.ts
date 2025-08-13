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
        'background-dark': 'var(--background-dark)',
        'background-medium': 'var(--background-medium)',
        'background-light': 'var(--background-light)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
        'brand-blue': 'var(--blue)',
        'brand-red': 'var(--red)',
        'brand-green': 'var(--green)',
        'brand-yellow': 'var(--yellow)',
      },
    },
  },
  plugins: [],
};
export default config;


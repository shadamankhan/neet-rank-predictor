/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563EB", // Blue 600
                secondary: "#4F46E5", // Indigo 600
                "bg-main": "#F3F4F6", // Gray 100
                "bg-card": "#FFFFFF",
                "text-primary": "#1F2937", // Gray 800
                "text-secondary": "#4B5563", // Gray 600
                border: "#E5E7EB", // Gray 200
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'bounce-short': 'bounce 1s infinite',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}

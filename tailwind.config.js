import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./resources/views/**/*.blade.php', './resources/js/**/*.{js,jsx}'],

    theme: {
        extend: {
            colors: {
                // Institutional palette: midnight navy + restrained teal, a touch of gold from the seal.
                navy: {
                    50: '#f1f4fa',
                    100: '#e1e7f3',
                    200: '#c3cfe6',
                    300: '#97abd1',
                    400: '#6580b5',
                    500: '#43609a',
                    600: '#324c7e',
                    700: '#263b64',
                    800: '#192848',
                    900: '#0f1c37',
                    950: '#091226',
                },
                teal: {
                    50: '#effafa',
                    100: '#d4f1f2',
                    200: '#a9e2e4',
                    300: '#74cdd1',
                    400: '#3eb1b8',
                    500: '#1f959e',
                    600: '#167782',
                    700: '#145f69',
                    800: '#154d56',
                    900: '#143f47',
                },
                gold: { 300: '#f2d57a', 400: '#ecc24e', 500: '#d9a826', 600: '#b3861a' },
                ink: '#0b1730',
                paper: '#f5f6f8',
                line: '#e3e6ec',
            },
            fontFamily: {
                sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            boxShadow: {
                card: '0 1px 0 rgba(11,23,48,.04), 0 1px 2px rgba(11,23,48,.06)',
                lift: '0 24px 60px -20px rgba(9,18,38,.45), 0 8px 20px -8px rgba(9,18,38,.3)',
            },
            keyframes: {
                'fade-up': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                float: {
                    '0%,100%': { transform: 'translateY(0) rotate(-2deg)' },
                    '50%': { transform: 'translateY(-8px) rotate(-1deg)' },
                },
            },
            animation: {
                'fade-up': 'fade-up .5s ease both',
                'slide-in': 'slide-in .22s ease both',
                float: 'float 7s ease-in-out infinite',
            },
        },
    },

    plugins: [forms({ strategy: 'class' })],
};

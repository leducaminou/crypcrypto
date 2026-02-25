// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
    
       boxShadow: {
        'mentorShadow': '0px 4px 20px rgba(110, 127, 185, 0.1)',
      },
      inset: {
        '54%': '54%',
        '40%': '40%',
      },
      colors: {
        primary: "#bd24df",
        secondary: "#2d6ade",
        bodyBg: "#03050d",
        darkmode: "#0C1B44",
        tablebg: "#132259",
        border: "#091945",
        lightblue: "#8a9bca",
        
        gray: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
        },
        indigo: {
          600: '#4F46E5',
          700: '#4338CA',
        },
      },

      blur: {
        390: '390px',
        
      },
      backgroundImage: {
        "banner-image": "linear-gradient(90deg,#bd24df80,#2d6ade80 97.15%)",
        "simple-bg": "linear-gradient(90deg,rgba(189,36,223,.1),rgba(45,106,222,.1) 97.15%)",
        "arrow-bg": "url('/images/simple/arrow-bg.png')",
        "newsletter": "url('/images/newsletter/hands.svg')",
      },
    },
  },
  plugins: [],
}
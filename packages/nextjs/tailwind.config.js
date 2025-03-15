/** @type {import('tailwindcss').Config} */
module.exports = {
  // Future configurations that are expected to be defaults in Tailwind v4
  future: {
    // Enable newer features now, which will likely be default in v4
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
    // Disable legacy utilities that will be removed in v4
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  // Use modern optimizations
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/DefaultFallbackUI/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Modern color palette using Tailwind color standards
      colors: {
        'envkit-primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Default primary color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        'envkit-neutral': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      // Settings optimized for modern browsers
      fontFamily: {
        sans: [
          'Inter var', 
          'system-ui',
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        mono: [
          'ui-monospace', 
          'SFMono-Regular', 
          'Menlo', 
          'Monaco', 
          'Consolas', 
          '"Liberation Mono"', 
          '"Courier New"', 
          'monospace'
        ],
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';
 
// ─────────────────────────────────────────────────────────────────────────────
// Design system: "Etiqueta de Depósito" (identidade de galpão industrial).
// Inspirado em etiquetas de prateleira, sinalização de piso e código de
// localização (ex: "A1-03") que já são a linguagem real do sistema.
//
// IMPORTANTE: os nomes dos tokens (base-50…950, action, positive, warning,
// critical) foram mantidos de propósito — são usados em ~250 pontos do app.
// Apenas os VALORES foram redefinidos, então toda a interface herda a nova
// identidade automaticamente, sem precisar editar className por className.
//
// base-50   → fundo de página (cinza-aço claro)
// base-100  → fundo sutil / hover
// base-200  → bordas
// base-800  → texto secundário (usado com opacidade /50 /60 /70)
// base-900  → texto terciário forte
// base-950  → texto principal (grafite quase preto)
// surface   → fundo de cards/painéis
// action    → âmbar de sinalização (cor de ação/marca)
// ─────────────────────────────────────────────────────────────────────────────
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          50: '#EEF0EF',
          100: '#E3E6E4',
          200: '#D3D7D4',
          800: '#5B6460',
          900: '#333A37',
          950: '#191D1B',
        },
        surface: {
          DEFAULT: '#FBFCFB',
          raised: '#FFFFFF',
          hover: '#F1F3F1',
          border: '#DCE0DD',
        },
        sidebar: {
          DEFAULT: '#191D1B',
          hover: '#242925',
          active: '#2C322D',
          border: '#2C322D',
          text: '#ECEEEC',
          muted: '#8A938D',
        },
        action: {
          DEFAULT: '#F2A20C',
          hover: '#D68C04',
          soft: 'rgba(242,162,12,0.14)',
          contrast: '#191D1B',
        },
        accent: {
          DEFAULT: '#35566F',
          soft: 'rgba(53,86,111,0.12)',
        },
        positive: {
          DEFAULT: '#227A4B',
          bg: 'rgba(34,122,75,0.10)',
        },
        warning: {
          DEFAULT: '#B8790A',
          bg: 'rgba(184,121,10,0.12)',
        },
        critical: {
          DEFAULT: '#C4291B',
          bg: 'rgba(196,41,27,0.10)',
        },
        chart: {
          1: '#F2A20C',
          2: '#35566F',
          3: '#227A4B',
          4: '#8B5E34',
          5: '#B8425A',
          6: '#4B7A6F',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      fontSize: {
        key: ['1.75rem', { lineHeight: '1', fontWeight: '600' }],
        display: ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }],
      },
      spacing: {
        touch: '4.5rem',
        sidebar: '17rem',
        'sidebar-collapsed': '4.75rem',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,0.24), 0 1px 0 rgba(255,255,255,0.02) inset',
        elevated: '0 8px 24px -8px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset',
        glow: '0 0 0 1px rgba(242,162,12,0.35), 0 4px 18px -4px rgba(242,162,12,0.35)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at top left, rgba(242,162,12,0.09), transparent 45%)',
        'hazard-stripe': 'repeating-linear-gradient(-45deg, #F2A20C 0 10px, #191D1B 10px 20px)',
      },
    },
  },
  plugins: [],
};
 
export default config;

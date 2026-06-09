import type { Config } from 'tailwindcss'

/**
 * Tailwind maps to the Style Guide tokens in app/globals.css via CSS variables.
 * One token edit in globals.css restyles every utility here — no hard-coded
 * color or type values live in component code.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx,md,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-deep': 'var(--color-surface-deep)',
        'surface-deep-2': 'var(--color-surface-deep-2)',
        ink: 'var(--color-ink)',
        heading: 'var(--color-heading)',
        muted: 'var(--color-muted)',
        'on-deep': 'var(--color-on-deep)',
        'on-deep-muted': 'var(--color-on-deep-muted)',
        link: 'var(--color-link)',
        'link-hover': 'var(--color-link-hover)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          strong: 'var(--color-primary-strong)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          disabled: 'var(--color-primary-disabled)',
        },
        'on-primary': 'var(--color-on-primary)',
        'on-primary-disabled': 'var(--color-on-primary-disabled)',
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          active: 'var(--color-secondary-active)',
        },
        'on-secondary': 'var(--color-on-secondary)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          strong: 'var(--color-accent-strong)',
        },
        'on-accent': 'var(--color-on-accent)',
        'input-bg': 'var(--color-input-bg)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        placeholder: 'var(--color-placeholder)',
        focus: 'var(--color-focus)',
        success: 'var(--color-success)',
        'success-surface': 'var(--color-success-surface)',
        error: 'var(--color-error)',
        'error-surface': 'var(--color-error-surface)',
        warning: 'var(--color-warning)',
        'on-status': 'var(--color-on-status)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        md: 'var(--text-md)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
        9: 'var(--space-9)',
        10: 'var(--space-10)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      maxWidth: {
        container: 'var(--container-max)',
        prose: 'var(--container-prose)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      zIndex: {
        sticky: '100',
        header: '200',
        overlay: '300',
        modal: '400',
        toast: '500',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'beam-sweep': {
          '0%, 100%': { transform: 'rotate(-22deg)' },
          '50%': { transform: 'rotate(22deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up var(--duration-slow) var(--ease-out) both',
        'fade-in': 'fade-in var(--duration-base) var(--ease-out) both',
        'beam-sweep': 'beam-sweep 8s var(--ease-in-out) infinite',
      },
    },
  },
  plugins: [],
}

export default config

import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // Public booking flow theme tokens -- see src/app.css "theme-tokens" anchor.
      // Deliberately uses non-colliding names so the dashboard, which is out of
      // scope for this pass, is unaffected:
      //  - "sans" is NOT overridden: Tailwind's Preflight applies theme('fontFamily.sans')
      //    to the <html> element globally, so redefining it would silently reflow
      //    dashboard typography too. The Helvetica Neue heading stack lives under
      //    "display" instead.
      //  - "mono" is NOT overridden: the dashboard has one existing font-mono usage
      //    (brand color swatch label). The Menlo meta-text stack lives under "meta".
      //  - "serif" is safe to add: Preflight never applies it automatically and
      //    nothing in the dashboard uses font-serif today.
      colors: {
        bg: 'var(--bg)',
        'bg-secondary': 'var(--bg-secondary)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        display: ['var(--font-sans)'],
        meta: ['var(--font-mono)'],
      },
      fontSize: {
        large: 'var(--text-large)',
        body: 'var(--text-body)',
        'body-mobile': 'var(--text-body-mobile)',
        small: 'var(--text-small)',
        extrasmall: 'var(--text-extrasmall)',
      },
      borderRadius: {
        large: 'var(--radius-large)',
        small: 'var(--radius-small)',
      },
      spacing: {
        gutter: 'var(--gutter)',
      },
    },
  },
  plugins: [forms, typography],
}

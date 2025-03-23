/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: '#3b82f6',
              textDecoration: 'underline',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            p: {
              marginTop: '1em',
              marginBottom: '1em',
            },
            h3: {
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            h4: {
              fontWeight: '600',
              marginTop: '1.25em',
              marginBottom: '0.5em',
            },
            ul: {
              paddingLeft: '1.5em',
              listStyleType: 'disc',
            },
            ol: {
              paddingLeft: '1.5em',
              listStyleType: 'decimal',
            },
            'ul > li': {
              paddingLeft: '0.5em',
            },
            'ol > li': {
              paddingLeft: '0.5em',
            },
            strong: {
              fontWeight: '600',
            },
            hr: {
              marginTop: '2em',
              marginBottom: '2em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

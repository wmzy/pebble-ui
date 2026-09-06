import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { lightTheme, spacing, typography } from 'haze-ui/tokens';

// Global CSS belongs in the root layout in the App Router. Use the full
// bundle here; swap for 'haze-ui/css/tokens.css' plus per-component
// subpaths ('haze-ui/css/button.css', ...) to ship less CSS.
import 'haze-ui/styles.css';

export const metadata: Metadata = {
  title: 'Haze UI × Next.js',
  description: 'Minimal App Router example for haze-ui',
};

export default function RootLayout({children}: Readonly<{children: ReactNode}>) {
  return (
    <html lang='en'>
      {/* same theme-class combination the haze-ui docs app applies */}
      <body className={`${lightTheme} ${spacing} ${typography}`}>{children}</body>
    </html>
  );
}

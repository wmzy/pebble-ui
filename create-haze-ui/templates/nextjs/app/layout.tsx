import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { lightTheme, motion, spacing, typography } from 'haze-ui/tokens';

// Global CSS belongs in the root layout in the App Router. Use the full
// bundle here; swap for 'haze-ui/css/tokens.css' plus per-component
// subpaths ('haze-ui/css/button.css', ...) to ship less CSS.
import 'haze-ui/styles.css';

export const metadata: Metadata = {
  title: 'haze-ui × Next.js',
  description: 'haze-ui App Router starter',
};

export default function RootLayout({children}: Readonly<{children: ReactNode}>) {
  return (
    <html lang='en'>
      {/* same theme-class combination the haze-ui docs app applies */}
      <body className={`${lightTheme} ${motion} ${spacing} ${typography}`}>
        {children}
      </body>
    </html>
  );
}

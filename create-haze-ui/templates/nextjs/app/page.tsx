import { Badge } from 'haze-ui/components/Badge';
import { Card } from 'haze-ui/components/Card';
import { Text, Title } from 'haze-ui/components/Typography';

import Playground from './playground';

// The subpath imports above pull hook-free haze-ui modules that ship
// WITHOUT the 'use client' banner, so this page renders them as React
// Server Components — zero client JS for the static card below. The
// interactive pieces live in the <Playground /> client island.
const page = {
  maxWidth: '40rem',
  margin: '0 auto',
  padding: 'var(--haze-space-8) var(--haze-space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--haze-space-5)',
  boxSizing: 'border-box',
  minHeight: '100vh',
} as const;

export default function Home() {
  return (
    <main style={page}>
      <Title level={1}>
        haze-ui × Next.js <Badge variant='info'>App Router</Badge>
      </Title>
      <Text type='secondary'>
        This page is a React Server Component — Badge, Card and Typography
        render on the server with zero hydration cost. The interactive
        controls below ship as a client island.
      </Text>

      <Card variant='outlined'>
        <Title level={4}>Static, server-rendered</Title>
        <Text>
          Cards, badges and typography never touch the client bundle. Swap
          the theme by changing the classes on <code>&lt;body&gt;</code> in{' '}
          <code>app/layout.tsx</code>.
        </Text>
      </Card>

      <Playground />
    </main>
  );
}

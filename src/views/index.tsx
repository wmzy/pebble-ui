import type { Route} from '@native-router/react';

import {View, HistoryRouter as Router} from '@native-router/react';
import {useMemo} from 'react';

import Loading from '@/components/Loading';
import RouterError from '@/components/RouterError';
import {ThemeProvider} from '@/contexts/theme';

export default function App() {
  return useMemo(() => {
    const routes = [
      {
        component: () => import('./Layout'),
        children: [
          {
            path: '/',
            component: () => import('./Home')
          },
          {
            path: '/getting-started',
            component: () => import('./GettingStarted')
          },
          {
            path: '/components',
            component: () => import('./ComponentDoc')
          },
          {
            path: '/components/:name',
            component: () => import('./ComponentDetail')
          },
          {
            path: '/ai-showcase',
            component: () => import('./AIShowcase')
          },
          {
            path: '/theme-editor',
            component: () => import('./ThemeEditor')
          },
          {
            path: '/about',
            component: () => import('./About')
          }
        ]
      }
    ] as Route[];

    return (
      <ThemeProvider>
        <Router
          routes={routes}
          baseUrl={import.meta.env.BASE_URL.replace(/\/$/, '')}
          errorHandler={(e) => <RouterError error={e} />}
        >
          <View />
          <Loading />
        </Router>
      </ThemeProvider>
    );
  }, []);
}

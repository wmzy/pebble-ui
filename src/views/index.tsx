import type { Route} from '@native-router/react';

import {View, HistoryRouter as Router} from '@native-router/react';
import {useMemo} from 'react';

import Loading from '@/components/Loading';
import RouterError from '@/components/RouterError';

export default function App() {
  return useMemo(() => {
    const routes = [
      {
        path: '/',
        component: () => import('./Home')
      },
      {
        component: () => import('./Layout'),
        children: [
          {
            path: '/getting-started',
            component: () => import('./Article')
          },
          {
            path: '/components',
            component: () => import('./ComponentDoc')
          },
          {
            path: '/components/:name',
            component: () => import('./Help')
          },
          {
            path: '/about',
            component: () => import('./About')
          }
        ]
      }
    ] as Route[];

    return (
      <Router
        routes={routes}
        // baseUrl={import.meta.env.BASE_URL.slice(0, -1)}
         
        errorHandler={(e) => <RouterError error={e} />}
      >
        <View />
        <Loading />
      </Router>
    );
  }, []);
}

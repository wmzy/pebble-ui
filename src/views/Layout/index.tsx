import * as NavigationMenu from '@/components/NavigationMenu';
import {css} from '@linaria/core';
import {Link, PrefetchLink, View} from '@native-router/react';

export default function Layout() {
  return (
    <section
      className={css`
        display: flex;
        height: 100vh;
      `}
    >
      <aside
        x-class={css`
          height: 100%;
          border-right: 1px dashed;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;

          > :first-child {
            flex: none;
            height: 4rem;
          }

          > nav {
            flex: 1;
            overflow-y: auto;
          }

          > nav > ul {
            list-style: none;
            gap: 16px;
          }
        `}
      >
        <PrefetchLink
          x-class={css`
            color: #5cb85c;
          `}
          to='/'
        >
          Pebble UI
        </PrefetchLink>
        <nav>
          <NavigationMenu.Main>
            <NavigationMenu.Item>
              <Link to='/'>Home</Link>
            </NavigationMenu.Item>
            <NavigationMenu.Group title='Components'>
              <NavigationMenu.Item>
                <Link to='/help'>Help</Link>
              </NavigationMenu.Item>
            </NavigationMenu.Group>
            <li>
              <Link to='/help'>Help</Link>
            </li>
            <li>
              <Link to='/about'>About</Link>
            </li>
          </NavigationMenu.Main>
        </nav>
      </aside>
      <main>
        <View />
      </main>
    </section>
  );
}

export const globals = css`
  :global() {
    body {
      margin: 0;
    }
  }
`;

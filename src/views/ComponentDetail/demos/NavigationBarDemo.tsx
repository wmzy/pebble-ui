import { Button, NavigationBar, NavLink } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── NavigationBar ──────────────────────────────────────────────
export default function NavigationBarDemo() {
  return (
    <>
      <h1>NavigationBar</h1>
      <p className={intro}>Top navigation bar with brand, links, and end slot.</p>

      <div className={section}>
        <h2>Demo</h2>
        <NavigationBar
          brand={<span>MyApp</span>}
          end={<Button size='sm' variant='outline'>Login</Button>}
        >
          <NavLink active>Home</NavLink>
          <NavLink>Docs</NavLink>
          <NavLink>About</NavLink>
        </NavigationBar>
      </div>

      <div className={section}>
        <h2>NavigationBar Props</h2>
        <PropsTable of='NavigationBarProps' />
      </div>

      <div className={section}>
        <h2>NavLink Props</h2>
        <PropsTable of='NavLinkProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as <strong>&lt;nav&gt;</strong></li>
            <li>Active link has <strong>aria-current=&quot;page&quot;</strong></li>
            <li>Links are standard <strong>&lt;a&gt;</strong> elements</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

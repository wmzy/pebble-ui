import { Accordion, AccordionItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Accordion ─────────────────────────────────────────────────
export default function AccordionDemo() {
  return (
    <>
      <h1>Accordion</h1>
      <p className={intro}>
        Collapsible content sections using native
        &lt;details&gt;/&lt;summary&gt;.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <Accordion>
          <AccordionItem title='Section One'>
            Content for section one. This uses the native details/summary
            elements.
          </AccordionItem>
          <AccordionItem title='Section Two'>
            Content for section two. Click the header to expand or collapse.
          </AccordionItem>
          <AccordionItem title='Section Three'>
            Content for section three. The chevron rotates on open.
          </AccordionItem>
        </Accordion>
      </div>

      <div className={section}>
        <h2>Accordion Props</h2>
        <PropsTable of='AccordionProps' />
      </div>

      <div className={section}>
        <h2>AccordionItem Props</h2>
        <PropsTable of='AccordionItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;details&gt;</strong>/
              <strong>&lt;summary&gt;</strong> — built-in keyboard and screen
              reader support
            </li>
            <li>
              <strong>Enter</strong>/<strong>Space</strong> toggles open/close
            </li>
            <li>
              Exclusive mode uses the HTML <strong>name</strong> attribute for
              mutual exclusion
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='accordion' />
    </>
  );
}

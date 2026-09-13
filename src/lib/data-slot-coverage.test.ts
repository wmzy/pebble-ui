import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * data-slot coverage contract (see CONVENTIONS.md — `data-slot` semantic slots).
 *
 * Every component directory under src/lib/components/ whose parts render DOM
 * must reference `data-slot` somewhere in its source. The skip list is for
 * components that render no DOM of their own (context providers); a new
 * component joins the contract by marking its parts, never by extending the
 * skip list — hence the hard assertion below.
 *
 * Shared utils that render DOM (the floating panel shell, the sortable item
 * wrapper) are asserted separately at the bottom.
 */

const libDir = join(process.cwd(), 'src', 'lib');

/** Components that render no DOM of their own (providers). */
const NO_DOM_COMPONENTS = new Set(['LocaleProvider', 'ConfigProvider']);

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (
      /\.(tsx|ts)$/.test(entry.name) &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.test.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

function referencesDataSlot(dir: string): boolean {
  return listSourceFiles(dir).some((file) => {
    const source = readFileSync(file, 'utf8');
    // JSX attribute form (`data-slot="x"`) or the cloneElement props-object
    // key form (`'data-slot': x`) — the Fullscreen composition pattern.
    return source.includes('data-slot=') || source.includes("'data-slot':");
  });
}

describe('data-slot coverage', () => {
  const componentsDir = join(libDir, 'components');

  it('scans a non-empty component tree', () => {
    expect(existsSync(componentsDir)).toBe(true);
    const dirs = readdirSync(componentsDir, { withFileTypes: true }).filter(
      (entry) => entry.isDirectory(),
    );
    expect(dirs.length).toBeGreaterThan(100);
  });

  it('every DOM-rendering component directory references data-slot', () => {
    const offenders: string[] = [];
    for (const entry of readdirSync(componentsDir, {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      if (NO_DOM_COMPONENTS.has(entry.name)) continue;
      if (!referencesDataSlot(join(componentsDir, entry.name))) {
        offenders.push(entry.name);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('shared DOM-rendering utils carry data-slot', () => {
    // The floating panel shell is the universal overlay `content` slot;
    // SortableItem is the `sortable-item` wrapper around dragged elements.
    expect(readFileSync(join(libDir, 'utils', 'floating.tsx'), 'utf8')).toContain(
      'data-slot=',
    );
    expect(readFileSync(join(libDir, 'utils', 'sortable.tsx'), 'utf8')).toContain(
      'data-slot=',
    );
  });
});

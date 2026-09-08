// Contract: every component that extends native element props must forward
// the rest of them onto its rendered element.
//
// Rationale (CONVENTIONS.md "HTML attribute passthrough", CLAUDE.md
// anti-pattern #5): a props type with a `ComponentPropsWithoutRef<'x'>`
// intersection arm advertises the native attribute surface in the public
// API. If the JSX never spreads `{...rest}`, attributes like aria-*,
// data-*, loading/decoding or event handlers type-check for consumers but
// are silently dropped at runtime.
//
// This is a source-text scan (no rendering), so it stays fast and applies
// uniformly to Core files, sub-components and compound members.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.join(libDir, 'components');

function collectComponentSources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectComponentSources(full);
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')
      ? [full]
      : [];
  });
}

// A props type with a native-attributes intersection arm:
//   `... & Omit<ComponentPropsWithoutRef<'div'>, 'children'>` (multiline
//   `Omit<\n  ComponentPropsWithoutRef<...>` included) or a bare
//   `... & ComponentPropsWithoutRef<'div'>` arm.
// Indexed-access usages like `ComponentPropsWithoutRef<'input'>['onChange']`
// are deliberately NOT matched: they reference a single handler type
// without advertising the full native attribute surface.
const nativePropsArm =
  /\bOmit\s*<\s*ComponentPropsWithoutRef\s*<|&\s*ComponentPropsWithoutRef\s*</;

// The file declares a component export. All three forms exist in the tree:
// `export default function X`, `export function/const X`, and
// `export default forwardRef/memo(...)`.
const componentExport =
  /export\s+default\s+(?:function\s+[A-Z]|forwardRef|memo)|export\s+(?:function|const)\s+[A-Z]/;

// The rest spread must land in JSX; in valid TypeScript a `{...rest}`
// spread implies the destructuring exists (an undeclared `rest` binding
// would not compile). A cast — `{...(rest as ComponentPropsWithoutRef<'button'>)}`
// — is the same contract when `rest` is a union of element attr sets.
const restSpread = /\{\s*\.\.\.\s*rest(?:\s+as\s+[^}]+)?\s*\}/;

// Documented exceptions: path relative to src/lib -> reason.
// Enforced below — an entry must carry a substantive reason and must still
// be warranted, otherwise the suite fails until the stale entry is removed.
const EXCEPTIONS: Record<string, string> = {
  // none — every in-scope component currently forwards {...rest}
};

const files = collectComponentSources(componentsDir).sort();
const rel = (file: string) => path.relative(libDir, file);
const inScope = files.filter((file) => {
  const source = readFileSync(file, 'utf8');
  return nativePropsArm.test(source) && componentExport.test(source);
});

describe('rest forwarding contract (src/lib/components)', () => {
  it('scans a populated component tree', () => {
    // Floors guard against a regex regression silently emptying the scan,
    // which would turn the contract below into a vacuous pass.
    expect(files.length).toBeGreaterThan(100);
    expect(inScope.length).toBeGreaterThan(40);
  });

  it('every component with a native props arm spreads {...rest}', () => {
    const violations = inScope
      .filter((file) => !(rel(file) in EXCEPTIONS))
      .filter((file) => !restSpread.test(readFileSync(file, 'utf8')))
      .map(rel);
    expect(violations).toEqual([]);
  });

  it('exception list entries are justified and not stale', () => {
    const problems: string[] = [];
    for (const [file, reason] of Object.entries(EXCEPTIONS)) {
      if (reason.trim().length <= 20) {
        problems.push(`${file}: exception needs a substantive reason`);
      }
      const full = path.join(libDir, file);
      if (!existsSync(full)) {
        problems.push(`${file}: exception points at a missing file`);
        continue;
      }
      const source = readFileSync(full, 'utf8');
      if (!(nativePropsArm.test(source) && componentExport.test(source))) {
        problems.push(`${file}: exempted file is not in scope, remove the entry`);
      }
      if (restSpread.test(source)) {
        problems.push(
          `${file}: exempted file already spreads {...rest}, remove the stale entry`,
        );
      }
    }
    expect(problems).toEqual([]);
  });
});

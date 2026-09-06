import { css } from '@linaria/core';

import generatedProps from '@/generated/props.json';
import propsDocs from '@/generated/props-docs.json';

type PropDef = {
  name: string;
  type: string;
  default?: string;
  description: string;
};

/** One row of src/generated/props.json (generated from library source). */
type GeneratedRow = {
  name: string;
  type: string;
  required: boolean;
};

/** One row of src/generated/props-docs.json (hand-maintained overrides). */
type DocRow = {
  name: string;
  type?: string;
  default?: string;
  description?: string;
};

type PropsTableProps = {
  /** Inline rows — legacy usage, fully supported (FormDemo still uses it). */
  props?: PropDef[];
  /**
   * Type name to render from the generated props index (e.g. 'ButtonProps').
   * Rows come from src/generated/props.json (name/type/order, straight from
   * the library source); descriptions/defaults are layered on top from
   * src/generated/props-docs.json, whose extra rows (className, `...rest`,
   * …) are appended at the end.
   */
  of?: string;
};

// TypeName → generated rows. propsTypes win over otherTypes; first
// component wins on (unexpected) duplicate type names across directories.
const typeIndex = (() => {
  const propsTypes = new Map<string, GeneratedRow[]>();
  const otherTypes = new Map<string, GeneratedRow[]>();
  const collect = (
    target: Map<string, GeneratedRow[]>,
    source: Record<string, GeneratedRow[]>
  ) => {
    for (const [typeName, rows] of Object.entries(source)) {
      if (!target.has(typeName)) target.set(typeName, rows);
    }
  };
  for (const entry of Object.values(generatedProps.components)) {
    collect(propsTypes, entry.propsTypes);
  }
  for (const entry of Object.values(generatedProps.components)) {
    collect(otherTypes, entry.otherTypes);
  }
  return { propsTypes, otherTypes };
})();

// The JSON import infers a fixed-key literal type; `of` lookups are dynamic.
const docsByType = propsDocs as Record<string, DocRow[]>;

function resolveRows(of: string): PropDef[] | undefined {
  const generated =
    typeIndex.propsTypes.get(of) ?? typeIndex.otherTypes.get(of);
  if (!generated) return undefined;

  const docs = docsByType[of] ?? [];
  const docsByName = new Map(docs.map((row) => [row.name, row]));

  const rows: PropDef[] = generated.map((row) => {
    const doc = docsByName.get(row.name);
    docsByName.delete(row.name);
    return {
      name: row.name,
      type: row.type,
      default: doc?.default,
      description: doc?.description ?? '',
    };
  });

  // Handwritten rows the generator cannot see (DOM-inherited className,
  // `...rest`, children, …) keep their own type and are appended in
  // handwritten order.
  for (const doc of docs) {
    if (!docsByName.has(doc.name)) continue;
    rows.push({
      name: doc.name,
      type: doc.type ?? '—',
      default: doc.default,
      description: doc.description ?? '',
    });
  }

  return rows;
}

const table = css`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  margin-bottom: var(--haze-space-6);
`;

const th = css`
  text-align: left;
  padding: var(--haze-space-2) var(--haze-space-3);
  border-bottom: 2px solid var(--haze-color-border);
  color: var(--haze-color-text);
  font-weight: var(--haze-weight-semibold);
`;

const td = css`
  padding: var(--haze-space-2) var(--haze-space-3);
  border-bottom: 1px solid var(--haze-color-border);
  color: var(--haze-color-text-secondary);
  vertical-align: top;
`;

const code = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  background: var(--haze-color-bg-muted);
  padding: 1px var(--haze-space-1);
  border-radius: var(--haze-radius-sm);
  color: var(--haze-color-text);
`;

export default function PropsTable({ props, of }: PropsTableProps) {
  const rows = of ? resolveRows(of) : props;
  if (!rows) return null;
  return (
    <table className={table}>
      <thead>
        <tr>
          <th className={th}>Prop</th>
          <th className={th}>Type</th>
          <th className={th}>Default</th>
          <th className={th}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.name}>
            <td className={td}>
              <span className={code}>{p.name}</span>
            </td>
            <td className={td}>
              <span className={code}>{p.type}</span>
            </td>
            <td className={td}>
              {p.default ? <span className={code}>{p.default}</span> : '—'}
            </td>
            <td className={td}>{p.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type { PropDef, PropsTableProps };

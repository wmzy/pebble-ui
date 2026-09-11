/**
 * haze-ui MCP tools. All data comes from the docs snapshot passed in
 * (`dist/mcp-docs.json` shape) — no filesystem access here, so every tool
 * is a pure function of (args, data) and trivially testable.
 *
 * MCP result shape: { content: [{ type: 'text', text }], isError? }.
 * Payloads are pretty-printed JSON — the consumers are AI agents.
 */

/** JSON-RPC invalid-params marker for protocol-level argument errors. */
const invalid = (message) => {
  const error = new Error(message);
  error.code = -32602;
  return error;
};

/** Tool failure reported inside the result (isError: true), not as JSON-RPC error. */
const toolError = (message) => new Error(message);

const textResult = (payload) => ({
  content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
});

/**
 * Component lookup key: 'data-table', 'DataTable', 'DATA_TABLE' and
 * 'data table' all collapse to 'datatable'. Component names and css
 * families normalize to the same key, so kebab and Pascal both hit.
 */
const normalizeKey = (name) => String(name).toLowerCase().replace(/[\s_-]+/g, '');

/** name/family index built once per call; first registration wins. */
const buildIndex = (components) => {
  const index = new Map();
  for (const [name, entry] of Object.entries(components ?? {})) {
    const key = normalizeKey(name);
    if (!index.has(key)) index.set(key, name);
    const familyKey = normalizeKey(entry.cssFamily ?? '');
    if (familyKey && !index.has(familyKey)) index.set(familyKey, name);
  }
  return index;
};

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/* ---------------------------------- tools --------------------------------- */

function listComponents(args, data) {
  if (args !== undefined && Object.keys(args).length > 0) {
    throw invalid('haze_list_components takes no arguments');
  }
  const items = Object.entries(data.components ?? {})
    .map(([name, entry]) => ({
      name,
      cssFamily: entry.cssFamily,
      peerDeps: entry.peerDeps ?? [],
    }))
    .sort(byName);
  return textResult(items);
}

function getComponent(args, data) {
  const requested = args?.name;
  if (typeof requested !== 'string' || requested.trim() === '') {
    throw invalid("haze_get_component requires a 'name' string argument");
  }
  const index = buildIndex(data.components);
  const name = index.get(normalizeKey(requested));
  if (!name) {
    const closest = searchComponents(requested.trim(), data)
      .slice(0, 3)
      .map((hit) => hit.name);
    throw toolError(
      `Component not found: '${requested}'.` +
        (closest.length > 0
          ? ` Closest: ${closest.join(', ')}.`
          : ' Use haze_list_components to see all names.')
    );
  }
  const entry = data.components[name];
  return textResult({
    name,
    cssFamily: entry.cssFamily,
    importStatement: entry.importStatement,
    cssImports: [
      'haze-ui/css/tokens.css',
      `haze-ui/css/${entry.cssFamily}.css`,
    ],
    peerDeps: entry.peerDeps ?? [],
    description: entry.description ?? '',
    props: entry.props ?? {},
  });
}

function getTokens(args, data) {
  const category = args?.category;
  if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
    throw invalid("haze_get_tokens 'category' must be a non-empty string when provided");
  }
  const tokens = data.tokens ?? [];
  if (category === undefined) return textResult(tokens);
  const wanted = category.toLowerCase();
  const matched = tokens.filter(
    (token) => String(token.category).toLowerCase() === wanted
  );
  if (matched.length === 0) {
    const valid = [...new Set(tokens.map((token) => token.category))];
    throw toolError(
      `No tokens in category '${category}'. Valid categories: ${valid.join(', ')}.`
    );
  }
  return textResult(matched);
}

/**
 * Substring + prefix scoring over component name, css family, prop names
 * and description. Prefix beats substring; name/family beat props; props
 * beat description. Top 10, ties broken alphabetically.
 */
function scoreComponent(name, entry, query) {
  let score = 0;
  const bump = (value) => {
    if (value > score) score = value;
  };
  const lowerName = name.toLowerCase();
  if (lowerName === query) bump(100);
  else if (lowerName.startsWith(query)) bump(70);
  else if (lowerName.includes(query)) bump(45);

  const family = String(entry.cssFamily ?? '');
  if (family === query) bump(95);
  else if (family.startsWith(query)) bump(65);
  else if (family.includes(query)) bump(40);

  for (const rows of Object.values(entry.props ?? {})) {
    for (const row of rows ?? []) {
      const prop = String(row.name).toLowerCase();
      if (prop === query) bump(60);
      else if (prop.startsWith(query)) bump(30);
      else if (prop.includes(query)) bump(12);
    }
  }
  if (String(entry.description ?? '').toLowerCase().includes(query)) bump(15);
  return score;
}

/** Shared scoring core — also backs getComponent's closest-match hint. */
function searchComponents(rawQuery, data) {
  const query = String(rawQuery).trim().toLowerCase();
  const hits = [];
  for (const [name, entry] of Object.entries(data.components ?? {})) {
    const score = scoreComponent(name, entry, query);
    if (score > 0) hits.push({ name, cssFamily: entry.cssFamily, score });
  }
  hits.sort((a, b) => b.score - a.score || byName(a, b));
  return hits;
}

function searchDocs(args, data) {
  const query = args?.query;
  if (typeof query !== 'string' || query.trim() === '') {
    throw invalid("haze_search_docs requires a 'query' string argument");
  }
  return textResult(searchComponents(query, data).slice(0, 10));
}

/* -------------------------------- registry -------------------------------- */

export const TOOL_DEFINITIONS = [
  {
    name: 'haze_list_components',
    description:
      'List every haze-ui component with its css family and optional peer dependencies.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'haze_get_component',
    description:
      "Full reference for one component: props tables (name/type/required/default/description), the import statement and the CSS imports. Name matching is case-insensitive and accepts kebab-case ('data-table') or PascalCase ('DataTable').",
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Component name — 'Button', 'data-table', 'DataTable' all work",
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'haze_get_tokens',
    description:
      'Design tokens (--haze-* CSS custom properties) with light and dark values. Without a category, returns the full registry.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'One of: color, typography, spacing, radius, shadow',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'haze_search_docs',
    description:
      'Search components by name, css family, prop name or description. Returns the top 10 matches ranked by relevance.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term, case-insensitive' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
];

/**
 * Dispatch one tools/ccall invocation. Throws { code: -32602 } for
 * protocol-level misuse (unknown tool / bad arguments); tool-level
 * failures (component not found, bad category) throw plain Errors that
 * the server reports as isError results.
 */
export function callTool(name, args, data) {
  switch (name) {
    case 'haze_list_components':
      return listComponents(args, data);
    case 'haze_get_component':
      return getComponent(args, data);
    case 'haze_get_tokens':
      return getTokens(args, data);
    case 'haze_search_docs':
      return searchDocs(args, data);
    default:
      throw invalid(`Unknown tool: ${name}`);
  }
}

// @vitest-environment node
import { handleRequest, PROTOCOL_VERSION } from './server.mjs';
import { TOOL_DEFINITIONS, callTool } from './tools.mjs';

const data = {
  components: {
    DataTable: {
      cssFamily: 'data-table',
      importStatement:
        "import { DataTable } from 'haze-ui';\nimport 'haze-ui/css/tokens.css';\nimport 'haze-ui/css/data-table.css';",
      peerDeps: ['@tanstack/react-table'],
      description: 'Feature table on @tanstack/react-table with sorting.',
      props: {
        DataTableProps: [
          {
            name: 'data',
            type: 'T[]',
            required: true,
            default: undefined,
            description: 'Rows to render',
          },
        ],
      },
    },
    Button: {
      cssFamily: 'button',
      importStatement: "import { Button } from 'haze-ui';",
      peerDeps: [],
      description: 'Action trigger with variants.',
      props: {
        ButtonProps: [
          {
            name: 'variant',
            type: "'solid' | 'outline'",
            required: false,
            default: "'solid'",
            description: 'Visual variant',
          },
        ],
      },
    },
  },
  tokens: [
    {
      name: '--haze-color-primary',
      category: 'color',
      label: 'Primary',
      type: 'color',
      light: 'oklch(0.563 0.241 260.8)',
      dark: 'oklch(0.673 0.174 258.5)',
    },
    {
      name: '--haze-space-2',
      category: 'spacing',
      label: 'Space 2',
      type: 'size',
      light: '8px',
      dark: '8px',
    },
  ],
};

const req = (method, params) => ({ jsonrpc: '2.0', id: 1, method, params });
const payload = (response) => JSON.parse(response.result.content[0].text);

describe('mcp server protocol', () => {
  it('answers initialize with the protocol version and tools capability', () => {
    const response = handleRequest(
      req('initialize', {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'test', version: '0' },
      }),
      data
    );
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'haze-ui-mcp', version: '1.0.0' },
      },
    });
  });

  it('ignores notifications (no id → no response)', () => {
    expect(
      handleRequest({ jsonrpc: '2.0', method: 'notifications/initialized' }, data)
    ).toBeNull();
    expect(
      handleRequest({ jsonrpc: '2.0', method: 'notifications/cancelled' }, data)
    ).toBeNull();
  });

  it('answers ping with an empty result', () => {
    const response = handleRequest(req('ping'), data);
    expect(response.result).toEqual({});
  });

  it('lists the four haze tools with input schemas', () => {
    const response = handleRequest(req('tools/list'), data);
    const names = response.result.tools.map((tool) => tool.name);
    expect(names).toEqual([
      'haze_list_components',
      'haze_get_component',
      'haze_get_tokens',
      'haze_search_docs',
    ]);
    for (const tool of response.result.tools) {
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('returns -32601 for unknown methods', () => {
    const response = handleRequest(req('resources/list'), data);
    expect(response.error.code).toBe(-32601);
  });

  it('stays silent for unknown notifications', () => {
    expect(
      handleRequest({ jsonrpc: '2.0', method: 'notifications/whatever' }, data)
    ).toBeNull();
  });

  it('rejects malformed messages with -32600', () => {
    const response = handleRequest('nope', data);
    expect(response.error.code).toBe(-32600);
  });

  it('rejects unknown tool names with -32602', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_nothing', arguments: {} }),
      data
    );
    expect(response.error.code).toBe(-32602);
  });

  it('rejects missing tool arguments with -32602', () => {
    const response = handleRequest(req('tools/call', { name: 'haze_get_component' }), data);
    expect(response.error.code).toBe(-32602);
  });

  it('reports tool-level failures inside the result with isError', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_get_component', arguments: { name: 'zzz-nope' } }),
      data
    );
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('Component not found');
  });
});

describe('haze_list_components', () => {
  it('lists components sorted by name with css family and peer deps', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_list_components', arguments: {} }),
      data
    );
    expect(payload(response)).toEqual([
      { name: 'Button', cssFamily: 'button', peerDeps: [] },
      { name: 'DataTable', cssFamily: 'data-table', peerDeps: ['@tanstack/react-table'] },
    ]);
  });
});

describe('haze_get_component', () => {
  const call = (name) =>
    payload(
      handleRequest(
        req('tools/call', { name: 'haze_get_component', arguments: { name } }),
        data
      )
    );

  it('returns props, import statement and css paths', () => {
    const component = call('DataTable');
    expect(component.cssFamily).toBe('data-table');
    expect(component.importStatement).toContain("from 'haze-ui'");
    expect(component.cssImports).toEqual([
      'haze-ui/css/tokens.css',
      'haze-ui/css/data-table.css',
    ]);
    expect(component.peerDeps).toEqual(['@tanstack/react-table']);
    expect(component.props.DataTableProps[0]).toEqual({
      name: 'data',
      type: 'T[]',
      required: true,
      default: undefined,
      description: 'Rows to render',
    });
  });

  it('matches names case-insensitively across kebab and Pascal forms', () => {
    for (const name of ['data-table', 'DataTable', 'DATA_TABLE', 'dataTable']) {
      expect(call(name).name).toBe('DataTable');
    }
  });

  it('suggests closest matches when the component is unknown', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_get_component', arguments: { name: 'table' } }),
      data
    );
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('DataTable');
  });
});

describe('haze_get_tokens', () => {
  it('returns the full registry without arguments', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_get_tokens', arguments: {} }),
      data
    );
    expect(payload(response)).toHaveLength(2);
  });

  it('filters by category (case-insensitive) keeping light and dark values', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_get_tokens', arguments: { category: 'COLOR' } }),
      data
    );
    const tokens = payload(response);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      name: '--haze-color-primary',
      category: 'color',
      light: 'oklch(0.563 0.241 260.8)',
      dark: 'oklch(0.673 0.174 258.5)',
    });
  });

  it('lists valid categories when the requested one has no tokens', () => {
    const response = handleRequest(
      req('tools/call', { name: 'haze_get_tokens', arguments: { category: 'motion' } }),
      data
    );
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('color, spacing');
  });
});

describe('haze_search_docs', () => {
  const search = (query) =>
    payload(
      handleRequest(
        req('tools/call', { name: 'haze_search_docs', arguments: { query } }),
        data
      )
    );

  it('ranks exact name matches above substring hits', () => {
    expect(search('DataTable')[0]).toMatchObject({ name: 'DataTable', score: 100 });
  });

  it('finds kebab-family and prop-name matches', () => {
    expect(search('data-table')[0]).toMatchObject({ name: 'DataTable', score: 95 });
    // 'variant' only exists as Button's prop name — proves prop-name indexing
    expect(search('variant')[0]).toMatchObject({ name: 'Button', score: 60 });
  });

  it('returns at most 10 hits and nothing for a miss', () => {
    expect(search('zzz')).toEqual([]);
  });
});

describe('callTool', () => {
  it('dispatches every definition with its minimal valid arguments', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(4);
    const minimalArgs = {
      haze_list_components: {},
      haze_get_component: { name: 'button' },
      haze_get_tokens: {},
      haze_search_docs: { query: 'button' },
    };
    for (const tool of TOOL_DEFINITIONS) {
      expect(() => callTool(tool.name, minimalArgs[tool.name], data)).not.toThrow();
    }
  });
});

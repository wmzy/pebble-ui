import type {TokenDef} from '@/lib';

/**
 * A single token node in the W3C Design Tokens format
 * (https://tr.designtokens.org/format/). `$extensions['haze-ui.css-var']`
 * preserves the source CSS custom property name so tooling can map back.
 */
type DesignTokenNode = {
  $value: string;
  $type: string;
  $extensions: {
    'haze-ui.css-var': string;
  };
};

/** A whole design tokens file: category groups of token nodes keyed by token name. */
type DesignTokensFile = Record<string, Record<string, DesignTokenNode>>;

type ToDesignTokensOptions = {
  /** Which registry mode to resolve values from. Defaults to `'light'`. */
  theme?: 'light' | 'dark';
};

/** TokenDef.category → top-level group name in the exported file. */
const CATEGORY_GROUPS: Record<TokenDef['category'], string> = {
  color: 'color',
  typography: 'font',
  spacing: 'spacing',
  radius: 'dimension',
  shadow: 'shadow',
};

/** TokenDef.type → W3C `$type`. */
const TOKEN_TYPES: Record<TokenDef['type'], string> = {
  color: 'color',
  size: 'dimension',
  font: 'fontFamily',
  number: 'number',
  shadow: 'shadow',
};

/** Key inside a group: the CSS var name without its leading `--haze-` prefix. */
function tokenKey(name: string): string {
  return name.replace(/^--haze-/, '');
}

/**
 * Convert a token registry to a W3C Design Tokens format file. Pure function,
 * zero runtime dependencies: takes `TOKEN_REGISTRY` (or any `TokenDef[]`
 * subset — `typeof TOKEN_REGISTRY` is exactly `TokenDef[]`) and returns plain
 * JSON-serializable data, so it never touches the DOM and tree-shakes freely.
 *
 * `$value` is the registry's resolved value for the chosen theme, verbatim
 * (colors stay hex/oklch strings, dimensions keep their units). Theme
 * selection defaults to `'light'`.
 */
function toDesignTokens(
  registry: TokenDef[],
  {theme = 'light'}: ToDesignTokensOptions = {},
): DesignTokensFile {
  const file: DesignTokensFile = {};
  for (const token of registry) {
    const group = (file[CATEGORY_GROUPS[token.category]] ??= {});
    group[tokenKey(token.name)] = {
      $value: theme === 'dark' ? token.dark : token.light,
      $type: TOKEN_TYPES[token.type],
      $extensions: {'haze-ui.css-var': token.name},
    };
  }
  return file;
}

export {toDesignTokens};
export type {DesignTokensFile, DesignTokenNode, ToDesignTokensOptions};

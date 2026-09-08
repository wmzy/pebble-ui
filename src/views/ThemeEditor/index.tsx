import type {ChangeEvent} from 'react';
import type {TokenDef} from '@/lib';
import type {Oklch} from '@/lib/tokens';
import type {CustomTheme, ResolvedMode, ThemeTokens} from '@/contexts/theme';
import type {ExportScope} from './export-theme';

import {useCallback, useMemo, useRef, useState} from 'react';
import {css} from '@linaria/core';

import {Pencil, Copy, Download, Trash2, Save, RotateCcw, Upload, Sun, Moon, ClipboardCopy, FileDown, Check} from 'lucide-react';

import {
  TOKEN_REGISTRY,
  lightTheme,
  darkTheme,
  spacing,
  typography,
  Button,
  Flex,
  Card,
  Badge,
  Icon,
  Tooltip,
  Select as HazeSelect,
  Option,
  Checkbox,
  Switch,
  Slider,
  useClipboard,
  useToast,
  ToastContainer,
} from '@/lib';
import {formatOklch, parseHex, parseOklch} from '@/lib/tokens';
import {useTheme, buildDefaultTokens} from '@/contexts/theme';
import {toDesignTokens} from '@/util/design-tokens';
import {page, section} from '@/views/ComponentDetail/styles';

import {exportThemeCss} from './export-theme';

const editorGrid = css`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--haze-space-6);
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const tokenGroup = css`
  margin-bottom: var(--haze-space-6);
`;

const groupTitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
  margin: 0 0 var(--haze-space-3);
  text-transform: capitalize;
`;

const tokenRow = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  padding: var(--haze-space-1) 0;
  border-bottom: 1px solid var(--haze-color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const tokenLabel = css`
  flex: 0 0 160px;
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const tokenInput = css`
  flex: 1;
  min-width: 0;
`;

const colorRow = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  padding: var(--haze-space-2) 0;
  border-bottom: 1px solid var(--haze-color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const colorHeader = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  min-width: 0;
`;

const colorValueWrap = css`
  flex: 1;
  min-width: 0;
`;

const colorSwatch = css`
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: var(--haze-radius-sm);
  border: 1px solid var(--haze-color-border);
`;

const channelGrid = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--haze-space-3);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const channelRow = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  min-width: 0;
`;

const channelLabel = css`
  flex: 0 0 auto;
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const channelSlider = css`
  flex: 1;
  min-width: 0;
  margin: 0;
  accent-color: var(--haze-color-primary);
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    accent-color: var(--haze-color-border);
  }
`;

const channelReadout = css`
  flex: 0 0 auto;
  min-width: 3.5em;
  text-align: right;
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
`;

const nativeInput = css`
  display: block;
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  padding: var(--haze-space-1) var(--haze-space-2);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const previewPanel = css`
  position: sticky;
  top: var(--haze-space-4);
  padding: var(--haze-space-4);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
`;

const previewTitle = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
  margin: 0 0 var(--haze-space-3);
`;

const previewSection = css`
  margin-bottom: var(--haze-space-4);

  & > p {
    font-family: var(--haze-font-sans);
    font-size: var(--haze-text-xs);
    color: var(--haze-color-text-muted);
    margin: 0 0 var(--haze-space-2);
  }
`;

const actions = css`
  display: flex;
  gap: var(--haze-space-3);
  margin-bottom: var(--haze-space-6);
  flex-wrap: wrap;
  align-items: center;
`;

const modeToggle = css`
  display: flex;
  gap: var(--haze-space-1);
  margin-bottom: var(--haze-space-4);
`;

const toolbarDivider = css`
  width: 1px;
  align-self: stretch;
  background: var(--haze-color-border);
`;

const scopeToggle = css`
  display: flex;
  gap: var(--haze-space-1);
`;

const themeListStyle = css`
  margin-bottom: var(--haze-space-6);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  overflow: hidden;
`;

const themeItem = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  padding: var(--haze-space-2) var(--haze-space-3);
  border-bottom: 1px solid var(--haze-color-border);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);

  &:last-child {
    border-bottom: none;
  }
`;

const themeItemName = css`
  flex: 1;
  color: var(--haze-color-text);
`;

const themeItemCount = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
`;

const hiddenFileInput = css`
  display: none;
`;

const CATEGORIES: TokenDef['category'][] = ['color', 'typography', 'spacing', 'radius', 'shadow'];

type ChannelKey = 'l' | 'c' | 'h';

const CHANNELS: {key: ChannelKey; short: string; min: number; max: number; step: number}[] = [
  {key: 'l', short: 'L', min: 0, max: 1, step: 0.005},
  {key: 'c', short: 'C', min: 0, max: 0.4, step: 0.005},
  {key: 'h', short: 'H', min: 0, max: 360, step: 1},
];

const CHANNEL_NAMES: Record<ChannelKey, string> = {l: 'lightness', c: 'chroma', h: 'hue'};

/** Parse a hex or oklch() color string; null when the value is not one of those. */
function parseColorValue(value: string): Oklch | null {
  const v = value.trim();
  const parse = v.startsWith('#')
    ? parseHex
    : /^oklch\(/i.test(v)
      ? parseOklch
      : null;
  if (!parse) return null;
  try {
    return parse(v);
  } catch {
    return null;
  }
}

/** Replace one OKLCH channel, preserving the others (including alpha). */
function withChannel(color: Oklch, key: ChannelKey, v: number): Oklch {
  if (key === 'l') return {...color, l: v};
  if (key === 'c') return {...color, c: v};
  return {...color, h: v};
}

function formatChannelReadout(key: ChannelKey, v: number): string {
  return key === 'h' ? `${Math.round(v)}°` : v.toFixed(3);
}

type ColorTokenRowProps = {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
};

function ColorTokenRow({name, label, value, onChange}: ColorTokenRowProps) {
  const parsed = parseColorValue(value);
  const setChannel = (key: ChannelKey, v: number) => {
    if (!parsed) return;
    onChange(name, formatOklch(withChannel(parsed, key, v)));
  };

  return (
    <div className={colorRow}>
      <div className={colorHeader}>
        <span className={tokenLabel} title={name}>{label}</span>
        <span className={colorSwatch} style={{background: value}} />
        <div className={colorValueWrap}>
          <input
            className={nativeInput}
            value={value}
            aria-label={`${label} value`}
            onChange={(e) => onChange(name, e.target.value)}
          />
        </div>
      </div>
      <div className={channelGrid}>
        {CHANNELS.map((ch) => {
          const num = parsed ? parsed[ch.key] : 0;
          return (
            <div key={ch.key} className={channelRow}>
              <span className={channelLabel} aria-hidden="true">{ch.short}</span>
              <input
                type="range"
                className={channelSlider}
                min={ch.min}
                max={ch.max}
                step={ch.step}
                value={num}
                disabled={!parsed}
                aria-label={`${label} ${CHANNEL_NAMES[ch.key]}`}
                onChange={(e) => setChannel(ch.key, Number(e.target.value))}
              />
              <span className={channelReadout} aria-hidden="true">
                {parsed ? formatChannelReadout(ch.key, num) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function countTokens(tokens: ThemeTokens): number {
  return Object.keys(tokens.light).length + Object.keys(tokens.dark).length;
}

function ThemeEditorInner() {
  const {saveTheme, deleteTheme, customThemes, setActiveTheme} = useTheme();

  const [activeMode, setActiveMode] = useState<ResolvedMode>('light');
  const [lightEdits, setLightEdits] = useState<Record<string, string>>({});
  const [darkEdits, setDarkEdits] = useState<Record<string, string>>({});
  const [themeName, setThemeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<ExportScope>('changed');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {copied, copy} = useClipboard();
  const toast = useToast();

  const lightDefaults = useMemo(() => buildDefaultTokens('light'), []);
  const darkDefaults = useMemo(() => buildDefaultTokens('dark'), []);

  const edits = activeMode === 'light' ? lightEdits : darkEdits;
  const defaults = activeMode === 'light' ? lightDefaults : darkDefaults;
  const setEdits = activeMode === 'light' ? setLightEdits : setDarkEdits;

  const currentValue = (name: string) => edits[name] ?? defaults[name] ?? '';

  const setToken = useCallback((name: string, value: string) => {
    setEdits((prev) => ({...prev, [name]: value}));
  }, [setEdits]);

  const resetAll = useCallback(() => {
    setLightEdits({});
    setDarkEdits({});
    setThemeName('');
    setEditingId(null);
  }, []);

  const buildChangedTokens = useCallback((
    editsMap: Record<string, string>,
    defaultsMap: Record<string, string>,
  ) => {
    const changed: Record<string, string> = {};
    for (const [k, v] of Object.entries(editsMap)) {
      if (v !== defaultsMap[k]) changed[k] = v;
    }
    return changed;
  }, []);

  const handleSave = useCallback(() => {
    const name = themeName.trim() || `Custom ${customThemes.length + 1}`;
    const tokens: ThemeTokens = {
      light: buildChangedTokens(lightEdits, lightDefaults),
      dark: buildChangedTokens(darkEdits, darkDefaults),
    };
    const id = editingId ?? `theme-${Date.now()}`;
    saveTheme({id, name, tokens});
    setActiveTheme(id);
    setEditingId(id);
  }, [themeName, lightEdits, darkEdits, lightDefaults, darkDefaults, customThemes.length, saveTheme, setActiveTheme, editingId, buildChangedTokens]);

  const handleEdit = useCallback((theme: CustomTheme) => {
    const loadedLight: Record<string, string> = {...lightDefaults, ...theme.tokens.light};
    const loadedDark: Record<string, string> = {...darkDefaults, ...theme.tokens.dark};
    setLightEdits(loadedLight);
    setDarkEdits(loadedDark);
    setThemeName(theme.name);
    setEditingId(theme.id);
  }, [lightDefaults, darkDefaults]);

  const handleDelete = useCallback((id: string) => {
    deleteTheme(id);
    if (editingId === id) resetAll();
  }, [deleteTheme, editingId, resetAll]);

  const handleDuplicate = useCallback((theme: CustomTheme) => {
    const dup: CustomTheme = {
      id: `theme-${Date.now()}`,
      name: `${theme.name} (Copy)`,
      tokens: {
        light: {...theme.tokens.light},
        dark: {...theme.tokens.dark},
      },
    };
    saveTheme(dup);
    handleEdit(dup);
    setActiveTheme(dup.id);
  }, [saveTheme, handleEdit, setActiveTheme]);

  const handleExport = useCallback((theme: CustomTheme) => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}.haze-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  /** Export the mode currently being edited (defaults + edits) as a W3C design tokens file. */
  const handleExportW3cTokens = useCallback(() => {
    const registry: TokenDef[] = TOKEN_REGISTRY.map((token) =>
      activeMode === 'light'
        ? {...token, light: edits[token.name] ?? defaults[token.name] ?? token.light}
        : {...token, dark: edits[token.name] ?? defaults[token.name] ?? token.dark},
    );
    const file = toDesignTokens(registry, {theme: activeMode});
    const blob = new Blob([JSON.stringify(file, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(themeName.trim() || 'haze-ui').replace(/\s+/g, '-').toLowerCase()}-tokens-${activeMode}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeMode, edits, defaults, themeName]);

  /** Current export payload: standalone CSS overrides for both modes. */
  const exportCss = useMemo(
    () => exportThemeCss({light: lightEdits, dark: darkEdits}, {scope: exportScope}),
    [lightEdits, darkEdits, exportScope],
  );

  const handleCopyCss = useCallback(() => {
    if (!exportCss) return;
    void copy(exportCss).then((ok) => {
      toast(
        ok ? 'Theme CSS copied to clipboard' : 'Copy failed — clipboard unavailable',
        {variant: ok ? 'success' : 'danger'},
      );
    });
  }, [exportCss, copy, toast]);

  /** Download the same CSS payload the Copy button writes, as haze-theme.css. */
  const handleDownloadCss = useCallback(() => {
    if (!exportCss) return;
    const blob = new Blob([exportCss], {type: 'text/css'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'haze-theme.css';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportCss]);

  const handleImport = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw: unknown = JSON.parse(reader.result as string);
        const data = raw as Record<string, unknown>;
        if (typeof data.name !== 'string' || !data.tokens || typeof data.tokens !== 'object') return;
        const tokensRaw = data.tokens as Record<string, unknown>;
        const tokens: ThemeTokens =
          tokensRaw.light && tokensRaw.dark && typeof tokensRaw.light === 'object' && typeof tokensRaw.dark === 'object'
            ? {light: tokensRaw.light as Record<string, string>, dark: tokensRaw.dark as Record<string, string>}
            : {light: tokensRaw as unknown as Record<string, string>, dark: tokensRaw as unknown as Record<string, string>};
        const imported: CustomTheme = {
          id: `theme-${Date.now()}`,
          name: data.name,
          tokens,
        };
        saveTheme(imported);
        setActiveTheme(imported.id);
        handleEdit(imported);
      } catch { /* invalid file */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [saveTheme, setActiveTheme, handleEdit]);

  const grouped = useMemo(() => {
    const map = new Map<string, TokenDef[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const token of TOKEN_REGISTRY) {
      map.get(token.category)?.push(token);
    }
    return map;
  }, []);

  const previewStyle = useMemo(() => {
    const style: Record<string, string> = {};
    for (const [k, v] of Object.entries(edits)) {
      if (v !== defaults[k]) style[k] = v;
    }
    return style;
  }, [edits, defaults]);
  const previewThemeClass = activeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <div className={page}>
      <h1>Theme Editor</h1>
      <p style={{color: 'var(--haze-color-text-secondary)', marginBottom: 'var(--haze-space-6)'}}>
        Customize design tokens for both light and dark modes. Each theme stores separate overrides per mode.
        Color values are OKLCH — edit lightness / chroma / hue per token, or paste any CSS color;
        overriding a base color re-derives its hover / active / subtle states live in the preview.
        When you are happy with the result, take it with you: export the overrides (or the full set)
        as standalone CSS — copy to clipboard or download a .css file.
      </p>

      {customThemes.length > 0 && (
        <>
          <h2 style={{fontSize: 'var(--haze-text-base)', fontWeight: 600, margin: '0 0 var(--haze-space-3)'}}>
            Saved Themes
          </h2>
          <div className={themeListStyle}>
            {customThemes.map((t) => (
              <div key={t.id} className={themeItem}>
                <span className={themeItemName}>
                  {t.name}
                  {editingId === t.id && <Badge size="sm" variant="info" style={{marginLeft: 8}}>editing</Badge>}
                </span>
                <span className={themeItemCount}>
                  {countTokens(t.tokens)} overrides
                </span>
                <Tooltip content="Edit">
                  <Button size="sm" square variant="ghost" onClick={() => handleEdit(t)}>
                    <Icon icon={Pencil} size="sm" />
                  </Button>
                </Tooltip>
                <Tooltip content="Duplicate">
                  <Button size="sm" square variant="ghost" onClick={() => handleDuplicate(t)}>
                    <Icon icon={Copy} size="sm" />
                  </Button>
                </Tooltip>
                <Tooltip content="Export">
                  <Button size="sm" square variant="ghost" onClick={() => handleExport(t)}>
                    <Icon icon={Download} size="sm" />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete">
                  <Button size="sm" square variant="ghost" onClick={() => handleDelete(t.id)}>
                    <Icon icon={Trash2} size="sm" />
                  </Button>
                </Tooltip>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={actions}>
        <input
          className={nativeInput}
          style={{maxWidth: 200}}
          placeholder="Theme name"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
        />
        <Tooltip content={editingId ? 'Update Theme' : 'Save Theme'}>
          <Button size="sm" square onClick={handleSave}>
            <Icon icon={Save} size="sm" />
          </Button>
        </Tooltip>
        <Tooltip content="Reset All">
          <Button size="sm" square variant="outline" onClick={resetAll}>
            <Icon icon={RotateCcw} size="sm" />
          </Button>
        </Tooltip>
        <Tooltip content="Import">
          <Button size="sm" square variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Icon icon={Upload} size="sm" />
          </Button>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className={hiddenFileInput}
          onChange={handleImport}
        />
        <Tooltip content="Export W3C tokens (.json)">
          <Button size="sm" square variant="outline" onClick={handleExportW3cTokens}>
            <Icon icon={Download} size="sm" />
          </Button>
        </Tooltip>
        <span className={toolbarDivider} aria-hidden="true" />
        <div className={scopeToggle} role="group" aria-label="CSS export scope">
          <Button
            size="sm"
            variant={exportScope === 'changed' ? 'solid' : 'ghost'}
            onClick={() => setExportScope('changed')}
          >
            Changed only
          </Button>
          <Button
            size="sm"
            variant={exportScope === 'all' ? 'solid' : 'ghost'}
            onClick={() => setExportScope('all')}
          >
            All tokens
          </Button>
        </div>
        <Tooltip content={exportCss ? 'Copy theme CSS' : 'Nothing to export yet — edit a token or switch to “All tokens”'}>
          <Button size="sm" square variant="outline" onClick={handleCopyCss} disabled={!exportCss}>
            <Icon icon={copied ? Check : ClipboardCopy} size="sm" />
          </Button>
        </Tooltip>
        <Tooltip content={exportCss ? 'Download haze-theme.css' : 'Nothing to export yet — edit a token or switch to “All tokens”'}>
          <Button size="sm" square variant="outline" onClick={handleDownloadCss} disabled={!exportCss}>
            <Icon icon={FileDown} size="sm" />
          </Button>
        </Tooltip>
      </div>

      <div className={modeToggle}>
        <Tooltip content="Light mode">
          <Button size="sm" square variant={activeMode === 'light' ? 'solid' : 'ghost'} onClick={() => setActiveMode('light')}>
            <Icon icon={Sun} size="sm" />
          </Button>
        </Tooltip>
        <Tooltip content="Dark mode">
          <Button size="sm" square variant={activeMode === 'dark' ? 'solid' : 'ghost'} onClick={() => setActiveMode('dark')}>
            <Icon icon={Moon} size="sm" />
          </Button>
        </Tooltip>
      </div>

      <div className={editorGrid}>
        <div>

          {CATEGORIES.map((cat) => {
            const tokens = grouped.get(cat);
            if (!tokens?.length) return null;
            return (
              <div key={cat} className={tokenGroup}>
                <h2 className={groupTitle}>{cat}</h2>
                <div className={section}>
                  {tokens.map((token) => {
                    const val = currentValue(token.name);
                    if (token.type === 'color') {
                      return (
                        <ColorTokenRow
                          key={token.name}
                          name={token.name}
                          label={token.label}
                          value={val}
                          onChange={setToken}
                        />
                      );
                    }
                    return (
                      <div key={token.name} className={tokenRow}>
                        <span className={tokenLabel} title={token.name}>{token.label}</span>
                        <div className={tokenInput}>
                          <input
                            className={nativeInput}
                            value={val}
                            onChange={(e) => setToken(token.name, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className={previewPanel} x-class={[previewThemeClass, spacing, typography]} style={previewStyle}>
            <h3 className={previewTitle}>Live Preview</h3>

            <div className={previewSection}>
              <p>Buttons</p>
              <Flex gap="var(--haze-space-2)" style={{flexWrap: 'wrap'}}>
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="outline">Outline</Button>
                <Button size="sm" variant="ghost">Ghost</Button>
              </Flex>
            </div>

            <div className={previewSection}>
              <p>Badges</p>
              <Flex gap="var(--haze-space-2)" style={{flexWrap: 'wrap'}}>
                <Badge variant="info">Info</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
              </Flex>
            </div>

            <div className={previewSection}>
              <p>Input</p>
              <input className={nativeInput} placeholder="Type something..." />
            </div>

            <div className={previewSection}>
              <p>Select</p>
              <HazeSelect size="sm">
                <Option value="1">Option 1</Option>
                <Option value="2">Option 2</Option>
              </HazeSelect>
            </div>

            <div className={previewSection}>
              <p>Controls</p>
              <Flex gap="var(--haze-space-3)" style={{alignItems: 'center'}}>
                <Checkbox label="Check" />
                <Switch />
              </Flex>
            </div>

            <div className={previewSection}>
              <p>Slider</p>
              <Slider />
            </div>

            <div className={previewSection}>
              <p>Card</p>
              <Card>
                <p style={{margin: 0, fontSize: 'var(--haze-text-sm)'}}>
                  A sample card with your custom tokens applied.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** useToast consumers must be descendants of ToastContainer (ToastDemo pattern). */
export default function ThemeEditor() {
  return (
    <ToastContainer>
      <ThemeEditorInner />
    </ToastContainer>
  );
}

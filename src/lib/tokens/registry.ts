import {formatOklch} from './oklch';
import {SEMANTIC_COLOR_TOKENS} from './palette';

type TokenDef = {
  name: string;
  category: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow';
  label: string;
  type: 'color' | 'size' | 'font' | 'number' | 'shadow';
  light: string;
  dark: string;
};

/** Color entries are generated from the OKLCH palette (resolved values per mode). */
const COLOR_TOKENS: TokenDef[] = SEMANTIC_COLOR_TOKENS.map((token) => ({
  name: token.name,
  category: 'color',
  label: token.label,
  type: 'color',
  light: formatOklch(token.resolved.light),
  dark: formatOklch(token.resolved.dark),
}));

const TOKEN_REGISTRY: TokenDef[] = [
  // --- Color tokens ---
  ...COLOR_TOKENS,

  // --- Typography tokens ---
  {name: '--haze-font-sans', category: 'typography', label: 'Font Sans', type: 'font', light: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", dark: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"},
  {name: '--haze-font-mono', category: 'typography', label: 'Font Mono', type: 'font', light: "'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace", dark: "'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace"},
  {name: '--haze-text-xs', category: 'typography', label: 'Text XS', type: 'size', light: '12px', dark: '12px'},
  {name: '--haze-text-sm', category: 'typography', label: 'Text SM', type: 'size', light: '14px', dark: '14px'},
  {name: '--haze-text-base', category: 'typography', label: 'Text Base', type: 'size', light: '16px', dark: '16px'},
  {name: '--haze-text-lg', category: 'typography', label: 'Text LG', type: 'size', light: '18px', dark: '18px'},
  {name: '--haze-text-xl', category: 'typography', label: 'Text XL', type: 'size', light: '20px', dark: '20px'},
  {name: '--haze-text-2xl', category: 'typography', label: 'Text 2XL', type: 'size', light: '24px', dark: '24px'},
  {name: '--haze-text-3xl', category: 'typography', label: 'Text 3XL', type: 'size', light: '30px', dark: '30px'},
  {name: '--haze-leading-tight', category: 'typography', label: 'Leading Tight', type: 'number', light: '1.25', dark: '1.25'},
  {name: '--haze-leading-normal', category: 'typography', label: 'Leading Normal', type: 'number', light: '1.5', dark: '1.5'},
  {name: '--haze-leading-relaxed', category: 'typography', label: 'Leading Relaxed', type: 'number', light: '1.75', dark: '1.75'},
  {name: '--haze-weight-normal', category: 'typography', label: 'Weight Normal', type: 'number', light: '400', dark: '400'},
  {name: '--haze-weight-medium', category: 'typography', label: 'Weight Medium', type: 'number', light: '500', dark: '500'},
  {name: '--haze-weight-semibold', category: 'typography', label: 'Weight Semibold', type: 'number', light: '600', dark: '600'},
  {name: '--haze-weight-bold', category: 'typography', label: 'Weight Bold', type: 'number', light: '700', dark: '700'},

  // --- Spacing tokens ---
  {name: '--haze-space-0', category: 'spacing', label: 'Space 0', type: 'size', light: '0', dark: '0'},
  {name: '--haze-space-1', category: 'spacing', label: 'Space 1', type: 'size', light: '4px', dark: '4px'},
  {name: '--haze-space-2', category: 'spacing', label: 'Space 2', type: 'size', light: '8px', dark: '8px'},
  {name: '--haze-space-3', category: 'spacing', label: 'Space 3', type: 'size', light: '12px', dark: '12px'},
  {name: '--haze-space-4', category: 'spacing', label: 'Space 4', type: 'size', light: '16px', dark: '16px'},
  {name: '--haze-space-5', category: 'spacing', label: 'Space 5', type: 'size', light: '20px', dark: '20px'},
  {name: '--haze-space-6', category: 'spacing', label: 'Space 6', type: 'size', light: '24px', dark: '24px'},
  {name: '--haze-space-8', category: 'spacing', label: 'Space 8', type: 'size', light: '32px', dark: '32px'},
  {name: '--haze-space-10', category: 'spacing', label: 'Space 10', type: 'size', light: '40px', dark: '40px'},
  {name: '--haze-space-12', category: 'spacing', label: 'Space 12', type: 'size', light: '48px', dark: '48px'},
  {name: '--haze-space-16', category: 'spacing', label: 'Space 16', type: 'size', light: '64px', dark: '64px'},

  // --- Radius tokens ---
  {name: '--haze-radius-none', category: 'radius', label: 'Radius None', type: 'size', light: '0', dark: '0'},
  {name: '--haze-radius-sm', category: 'radius', label: 'Radius SM', type: 'size', light: '4px', dark: '4px'},
  {name: '--haze-radius-md', category: 'radius', label: 'Radius MD', type: 'size', light: '6px', dark: '6px'},
  {name: '--haze-radius-lg', category: 'radius', label: 'Radius LG', type: 'size', light: '8px', dark: '8px'},
  {name: '--haze-radius-xl', category: 'radius', label: 'Radius XL', type: 'size', light: '12px', dark: '12px'},
  {name: '--haze-radius-2xl', category: 'radius', label: 'Radius 2XL', type: 'size', light: '16px', dark: '16px'},
  {name: '--haze-radius-full', category: 'radius', label: 'Radius Full', type: 'size', light: '9999px', dark: '9999px'},

  // --- Shadow tokens ---
  {name: '--haze-shadow-sm', category: 'shadow', label: 'Shadow SM', type: 'shadow', light: '0 1px 2px rgba(0, 0, 0, 0.05)', dark: '0 1px 2px rgba(0, 0, 0, 0.05)'},
  {name: '--haze-shadow-md', category: 'shadow', label: 'Shadow MD', type: 'shadow', light: '0 4px 6px rgba(0, 0, 0, 0.07)', dark: '0 4px 6px rgba(0, 0, 0, 0.07)'},
  {name: '--haze-shadow-lg', category: 'shadow', label: 'Shadow LG', type: 'shadow', light: '0 10px 15px rgba(0, 0, 0, 0.1)', dark: '0 10px 15px rgba(0, 0, 0, 0.1)'},
  {name: '--haze-shadow-xl', category: 'shadow', label: 'Shadow XL', type: 'shadow', light: '0 20px 25px rgba(0, 0, 0, 0.1)', dark: '0 20px 25px rgba(0, 0, 0, 0.1)'},
];

const COMPONENT_TOKENS: Record<string, string[]> = {
  accordion: ['--haze-color-border', '--haze-color-bg-subtle', '--haze-color-focus-ring', '--haze-color-text', '--haze-color-text-muted', '--haze-color-text-secondary', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-space-3', '--haze-space-4', '--haze-text-sm', '--haze-weight-medium'],
  alert: ['--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-focus-ring', '--haze-color-info', '--haze-color-info-subtle', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-radius-sm', '--haze-space-3', '--haze-space-4', '--haze-text-lg', '--haze-text-sm'],
  approvalcard: ['--haze-color-bg', '--haze-color-border', '--haze-color-primary', '--haze-color-text', '--haze-color-text-muted', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-font-sans', '--haze-radius-md', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-text-sm', '--haze-weight-medium'],
  asyncsection: ['--haze-color-bg-subtle', '--haze-color-border', '--haze-color-border-hover', '--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-focus-ring', '--haze-color-text', '--haze-color-text-muted', '--haze-font-sans', '--haze-leading-normal', '--haze-leading-tight', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-space-8', '--haze-text-sm', '--haze-weight-medium'],
  avatar: ['--haze-color-bg-muted', '--haze-color-text-secondary', '--haze-font-sans', '--haze-radius-full', '--haze-text-lg', '--haze-text-sm', '--haze-text-xs', '--haze-weight-medium'],
  badge: ['--haze-color-bg-muted', '--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-info', '--haze-color-info-subtle', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-text-secondary', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-font-sans', '--haze-leading-tight', '--haze-radius-full', '--haze-space-0', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-text-sm', '--haze-text-xs', '--haze-weight-medium'],
  banner: ['--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-info', '--haze-color-info-subtle', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-font-sans', '--haze-radius-md', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-text-lg', '--haze-text-sm'],
  breadcrumb: ['--haze-color-primary', '--haze-color-primary-hover', '--haze-color-text', '--haze-color-text-muted', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-sm', '--haze-space-2', '--haze-text-sm', '--haze-weight-medium'],
  button: ['--haze-button-font-size-lg', '--haze-button-font-size-md', '--haze-button-font-size-sm', '--haze-button-height-lg', '--haze-button-height-md', '--haze-button-height-sm', '--haze-button-radius', '--haze-color-primary', '--haze-color-primary-hover', '--haze-color-primary-active', '--haze-color-text', '--haze-color-text-inverse', '--haze-color-border', '--haze-color-border-hover', '--haze-color-bg-subtle', '--haze-color-bg-muted', '--haze-color-focus-ring', '--haze-font-sans', '--haze-leading-tight', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-space-6', '--haze-text-sm', '--haze-text-base', '--haze-weight-medium'],
  card: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-bg-subtle', '--haze-font-sans', '--haze-radius-lg', '--haze-shadow-md', '--haze-space-5'],
  carousel: ['--haze-color-bg', '--haze-color-bg-muted', '--haze-color-bg-subtle', '--haze-color-primary', '--haze-color-text', '--haze-color-focus-ring', '--haze-radius-full', '--haze-radius-lg', '--haze-shadow-md', '--haze-space-1', '--haze-space-2', '--haze-text-lg'],
  checkbox: ['--haze-color-bg', '--haze-color-border', '--haze-color-border-hover', '--haze-color-focus-ring', '--haze-color-primary', '--haze-color-text-inverse', '--haze-radius-sm', '--haze-font-sans', '--haze-text-sm', '--haze-weight-medium'],
  chip: ['--haze-color-bg-muted', '--haze-color-border', '--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-primary', '--haze-color-primary-subtle', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-text-secondary', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-font-sans', '--haze-radius-full', '--haze-space-1', '--haze-space-3', '--haze-text-xs', '--haze-weight-medium'],
  confirmdialog: ['--haze-color-bg', '--haze-color-border', '--haze-color-danger', '--haze-color-danger-active', '--haze-color-danger-hover', '--haze-color-primary', '--haze-color-text', '--haze-color-text-inverse', '--haze-color-text-muted', '--haze-font-sans', '--haze-leading-relaxed', '--haze-radius-md', '--haze-radius-xl', '--haze-shadow-xl', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-space-6', '--haze-text-lg', '--haze-text-sm', '--haze-weight-medium', '--haze-weight-semibold'],
  combobox: ['--haze-color-bg', '--haze-color-bg-subtle', '--haze-color-border', '--haze-color-focus-ring', '--haze-color-primary', '--haze-color-primary-subtle', '--haze-color-text', '--haze-color-text-muted', '--haze-duration-fast', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-radius-sm', '--haze-shadow-lg', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-text-sm', '--haze-text-xs', '--haze-weight-medium'],
  datepicker: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-primary', '--haze-color-primary-hover', '--haze-color-focus-ring', '--haze-color-bg-subtle', '--haze-color-text-muted', '--haze-color-text-inverse', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-radius-lg', '--haze-radius-sm', '--haze-shadow-lg', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-text-sm', '--haze-text-xs', '--haze-weight-medium'],
  dialog: ['--haze-dialog-padding', '--haze-dialog-radius', '--haze-dialog-title-font-size', '--haze-dialog-title-gap', '--haze-dialog-width', '--haze-color-bg', '--haze-color-text', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-xl', '--haze-shadow-xl', '--haze-space-4', '--haze-space-6', '--haze-text-lg'],
  diffviewer: ['--haze-color-border', '--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-text-muted', '--haze-font-mono', '--haze-leading-relaxed', '--haze-radius-md', '--haze-space-2', '--haze-space-3', '--haze-text-xs'],
  disclosure: ['--haze-color-bg-subtle', '--haze-color-border', '--haze-color-text', '--haze-color-text-muted', '--haze-color-text-secondary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-md', '--haze-space-3', '--haze-space-4', '--haze-text-sm', '--haze-weight-medium', '--haze-leading-normal'],
  fileinput: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-border-hover', '--haze-color-bg-subtle', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-md', '--haze-space-2', '--haze-space-4', '--haze-text-sm', '--haze-weight-medium'],
  flex: [],
  icon: [],
  image: ['--haze-color-bg-muted', '--haze-color-text-muted', '--haze-font-sans', '--haze-text-sm'],
  input: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-text-muted', '--haze-color-border-hover', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-text-sm', '--haze-text-base'],
  list: ['--haze-color-text', '--haze-font-sans', '--haze-leading-normal', '--haze-space-1', '--haze-space-5', '--haze-text-sm'],
  menu: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-bg-subtle', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-lg', '--haze-shadow-lg', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-text-sm'],
  numberinput: ['--haze-color-bg', '--haze-color-border', '--haze-color-bg-subtle', '--haze-color-bg-muted', '--haze-color-text', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-text-sm', '--haze-text-base', '--haze-weight-medium'],
  popover: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-font-sans', '--haze-radius-lg', '--haze-shadow-lg', '--haze-space-1', '--haze-space-3', '--haze-text-sm'],
  radio: ['--haze-color-bg', '--haze-color-border', '--haze-color-border-hover', '--haze-color-text', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-full', '--haze-space-2', '--haze-text-sm'],
  select: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-border-hover', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-space-8', '--haze-text-sm', '--haze-text-base'],
  skeleton: ['--haze-color-bg-muted', '--haze-radius-full', '--haze-radius-md', '--haze-radius-sm'],
  slider: ['--haze-color-bg', '--haze-color-bg-muted', '--haze-color-focus-ring', '--haze-color-primary', '--haze-color-text', '--haze-color-text-inverse', '--haze-color-text-muted', '--haze-color-text-secondary', '--haze-duration-fast', '--haze-ease', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-full', '--haze-radius-md', '--haze-shadow-sm', '--haze-space-1', '--haze-space-12', '--haze-space-16', '--haze-space-2', '--haze-space-6', '--haze-text-xs'],
  steptimeline: ['--haze-color-bg', '--haze-color-border', '--haze-color-danger', '--haze-color-primary', '--haze-color-success', '--haze-color-text', '--haze-color-text-inverse', '--haze-color-text-muted', '--haze-font-sans', '--haze-radius-full', '--haze-space-1', '--haze-space-3', '--haze-space-4', '--haze-text-sm', '--haze-text-xs', '--haze-weight-medium'],
  switch: ['--haze-color-bg-muted', '--haze-color-primary', '--haze-color-focus-ring', '--haze-radius-full', '--haze-shadow-sm'],
  table: ['--haze-color-bg-subtle', '--haze-color-border', '--haze-color-text', '--haze-color-text-secondary', '--haze-font-sans', '--haze-space-2', '--haze-space-3', '--haze-text-sm', '--haze-weight-semibold'],
  tabs: ['--haze-color-border', '--haze-color-text', '--haze-color-text-muted', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-space-2', '--haze-space-4', '--haze-text-sm', '--haze-weight-medium'],
  tag: ['--haze-color-bg-muted', '--haze-color-text-secondary', '--haze-color-primary', '--haze-color-primary-subtle', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-focus-ring', '--haze-font-sans', '--haze-radius-md', '--haze-radius-sm', '--haze-space-0', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-text-xs', '--haze-text-sm', '--haze-weight-medium', '--haze-leading-tight'],
  textarea: ['--haze-color-bg', '--haze-color-border', '--haze-color-text', '--haze-color-text-muted', '--haze-color-border-hover', '--haze-color-primary', '--haze-color-focus-ring', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-text-sm', '--haze-text-base'],
  toast: ['--haze-color-bg', '--haze-color-border', '--haze-color-danger', '--haze-color-danger-subtle', '--haze-color-focus-ring', '--haze-color-primary', '--haze-color-primary-active', '--haze-color-primary-hover', '--haze-color-success', '--haze-color-success-subtle', '--haze-color-text', '--haze-color-text-secondary', '--haze-color-warning', '--haze-color-warning-subtle', '--haze-font-sans', '--haze-leading-normal', '--haze-radius-md', '--haze-shadow-lg', '--haze-space-1', '--haze-space-2', '--haze-space-3', '--haze-space-4', '--haze-text-base', '--haze-text-lg', '--haze-text-sm', '--haze-weight-medium'],
  tooltip: ['--haze-color-text', '--haze-color-text-inverse', '--haze-font-sans', '--haze-radius-md', '--haze-space-1', '--haze-space-2', '--haze-leading-normal', '--haze-text-xs'],
};

export {TOKEN_REGISTRY, COMPONENT_TOKENS};
export type {TokenDef};

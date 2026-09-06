import { useControl } from 'react-use-control';

import { ModelPicker } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── ModelPicker ──────────────────────────────────────────────
export default function ModelPickerDemo() {
  const [, , modelCtrl] = useControl(undefined, 'gpt-4');
  const [model] = useControl(modelCtrl);

  const models = [
    { value: 'gpt-4', label: 'GPT-4', contextLength: '128k' },
    { value: 'gpt-3.5', label: 'GPT-3.5 Turbo', contextLength: '16k' },
    { value: 'claude-3', label: 'Claude 3', contextLength: '200k' },
    { value: 'gemini', label: 'Gemini Pro', contextLength: '32k' },
  ];

  return (
    <>
      <h1>ModelPicker</h1>
      <p className={intro}>
        Dropdown for selecting an AI model with optional context length info.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320 }}>
          <ModelPicker value={modelCtrl} options={models} />
          <p
            style={{
              marginTop: 'var(--haze-space-2)',
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {model}
          </p>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ModelPickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a native <strong>&lt;select&gt;</strong> element
            </li>
            <li>
              Full keyboard support via <strong>Arrow keys</strong> and{' '}
              <strong>Enter</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='modelpicker' />
    </>
  );
}

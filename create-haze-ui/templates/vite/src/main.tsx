import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { useControl } from 'react-use-control';

import 'haze-ui/styles.css';
import { Button, Dialog, Input, ToastContainer, useToast } from 'haze-ui';
import { lightTheme, motion, spacing, typography } from 'haze-ui/tokens';

// haze-ui styling is plain CSS custom properties — the theme classes just
// set the tokens, so any wrapper element can carry them.
const page = {
  boxSizing: 'border-box',
  minHeight: '100vh',
  maxWidth: '40rem',
  margin: '0 auto',
  padding: 'var(--haze-space-8) var(--haze-space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--haze-space-5)',
} as const;

const title = {
  fontFamily: 'var(--haze-font-sans)',
  fontSize: 'var(--haze-text-3xl)',
  fontWeight: 'var(--haze-weight-bold)',
  color: 'var(--haze-color-text)',
  margin: 0,
} as const;

const lede = {
  fontFamily: 'var(--haze-font-sans)',
  fontSize: 'var(--haze-text-base)',
  color: 'var(--haze-color-text-secondary)',
  margin: 0,
} as const;

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--haze-space-2)',
  flexWrap: 'wrap',
} as const;

const field = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--haze-space-1)',
  maxWidth: '20rem',
} as const;

const labelText = {
  fontFamily: 'var(--haze-font-sans)',
  fontSize: 'var(--haze-text-sm)',
  color: 'var(--haze-color-text-secondary)',
} as const;

// useToast needs a <ToastContainer> ancestor, so the consumer lives in a
// child component rendered inside it.
function ToastActions({greeting}: {greeting: string}) {
  const toast = useToast();

  return (
    <Button variant='outline' onClick={() => toast.success(greeting)}>
      Show toast
    </Button>
  );
}

function App() {
  // App state is plain useState. haze component state speaks
  // ControlOrValue<T>: the Input below runs uncontrolled (no value prop,
  // just onChange), while the Dialog is driven by a control object from
  // react-use-control — installed with haze-ui, imported directly here.
  const [name, setName] = useState('');
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);

  return (
    <ToastContainer>
      <div className={`${lightTheme} ${motion} ${spacing} ${typography}`} style={page}>
        <h1 style={title}>haze-ui + Vite</h1>
        <p style={lede}>
          A React 19 + Vite starter. Component state speaks the
          ControlOrValue protocol — uncontrolled by default, controlled the
          moment you hand it a control object.
        </p>

        <label style={field}>
          <span style={labelText}>Your name</span>
          <Input
            name='name'
            placeholder='World'
            onChange={(e) => setName(e.currentTarget.value)}
          />
        </label>

        <div style={row}>
          <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
          <ToastActions greeting={name === '' ? 'Hello, World!' : `Hello, ${name}!`} />
        </div>

        <Dialog
          open={dialogControl}
          onClose={() => setDialogOpen(false)}
          title='Hello from haze-ui'
        >
          <p style={lede}>
            A native-dialog-based modal — Esc and backdrop clicks close it,
            focus is trapped while open.
          </p>
          <div style={row}>
            <Button variant='ghost' onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </div>
        </Dialog>
      </div>
    </ToastContainer>
  );
}

const rootEl = document.getElementById('root');
if (rootEl === null) throw new Error('#root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

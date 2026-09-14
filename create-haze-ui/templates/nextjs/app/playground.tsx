'use client';

import { useControl } from 'react-use-control';

import { Button, Dialog, ToastContainer, useToast } from 'haze-ui';

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--haze-space-2)',
  flexWrap: 'wrap',
} as const;

// useToast needs a <ToastContainer> ancestor, so the consumer lives in a
// child component rendered inside it.
function ToastActions() {
  const toast = useToast();

  return (
    <Button
      variant='outline'
      onClick={() => {
        toast.success('Saved!');
      }}
    >
      Show toast
    </Button>
  );
}

// Every stateful haze component speaks ControlOrValue<T>: the Dialog's
// `open` prop takes a control object from react-use-control (installed
// with haze-ui, imported directly here) to drive it from outside.
export default function Playground() {
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);

  return (
    <ToastContainer>
      <div style={row}>
        <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <ToastActions />
      </div>

      <Dialog
        open={dialogControl}
        onClose={() => setDialogOpen(false)}
        title='Hello from haze-ui'
      >
        <p
          style={{
            fontFamily: 'var(--haze-font-sans)',
            fontSize: 'var(--haze-text-base)',
            color: 'var(--haze-color-text-secondary)',
            margin: 0,
          }}
        >
          A native-dialog-based modal — Esc and backdrop clicks close it,
          focus is trapped while open.
        </p>
        <div style={row}>
          <Button variant='ghost' onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </div>
      </Dialog>
    </ToastContainer>
  );
}

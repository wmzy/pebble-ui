'use client';

import {
  Button,
  ButtonLink,
  Datepicker,
  Switch,
  ToastContainer,
  useToast,
} from 'haze-ui';

const stack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--haze-space-4)',
  maxWidth: '36rem',
  margin: '3rem auto',
  padding: '0 var(--haze-space-4)',
} as const;

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--haze-space-2)',
  flexWrap: 'wrap',
} as const;

const heading = {
  fontFamily: 'var(--haze-font-sans)',
  fontSize: 'var(--haze-text-3xl)',
  color: 'var(--haze-color-text)',
  margin: 0,
} as const;

const body = {
  fontFamily: 'var(--haze-font-sans)',
  fontSize: 'var(--haze-text-base)',
  color: 'var(--haze-color-text-secondary)',
  margin: 0,
} as const;

// useToast needs a <ToastContainer> *ancestor*, so the consumer must be a
// child component rendered inside it — calling the hook in Home itself
// (above the <ToastContainer> JSX) runs outside the provider's context.
function ToastActions() {
  const toast = useToast();

  return (
    <div style={row}>
      <Button onClick={() => toast('Saved', {variant: 'success'})}>Save</Button>
      <Button
        variant='outline'
        onClick={() => toast('Discarded', {variant: 'warning'})}
      >
        Discard
      </Button>
      <ButtonLink href='https://github.com/wmzy/haze-ui' variant='ghost'>
        GitHub
      </ButtonLink>
    </div>
  );
}

export default function Home() {
  return (
    <ToastContainer>
      <main style={stack}>
        <h1 style={heading}>Haze UI + Next.js</h1>
        <p style={body}>
          Server-rendered, hydrated, zero-runtime CSS — all tokens are plain CSS
          custom properties.
        </p>

        <ToastActions />

        <label style={row}>
          <Switch aria-label='Email notifications' />
          Email notifications
        </label>

        <Datepicker locale='en-US' weekStartsOn={0} placeholder='Pick a date' />
      </main>
    </ToastContainer>
  );
}

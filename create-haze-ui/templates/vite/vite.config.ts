import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// haze-ui ships prebuilt ESM + CSS through its package exports map, so no
// transpile/alias wiring is needed — `import 'haze-ui/styles.css'` and
// `import { Button } from 'haze-ui'` just work.
export default defineConfig({
  plugins: [react()],
});

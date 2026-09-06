import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // `haze-ui` is a live symlink (link:../..) into the repository root, so
  // its own peer deps would otherwise resolve to the root's react copy.
  // Dedupe pins every resolution to this app's react/react-dom instance.
  resolve: { dedupe: ['react', 'react-dom'] },
});

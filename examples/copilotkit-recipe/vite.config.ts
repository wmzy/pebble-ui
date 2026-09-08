import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// CopilotKit's runtime is NOT mounted here: per the official React SPA
// guide (docs.copilotkit.ai/react-spa) a single-page app hosts Copilot
// Runtime as its own Node server (`pnpm dev:runtime`, port 8200) and
// points the provider at it with an absolute runtimeUrl. The two-server
// split is the documented pattern — see server.ts and README.md.
export default defineConfig({
  plugins: [react()],
  // `haze-ui` is a live symlink (link:../..) into the repository root, so
  // its own peer deps would otherwise resolve to the root's react copy.
  // Dedupe pins every resolution to this app's react/react-dom instance.
  resolve: { dedupe: ['react', 'react-dom'] },
});

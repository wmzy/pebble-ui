import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './app.css';
import 'haze-ui/styles.css';
// CopilotKit v2 UI components ship their own self-contained stylesheet;
// import it once at the app boundary (docs.copilotkit.ai/react-spa).
import '@copilotkit/react-core/v2/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

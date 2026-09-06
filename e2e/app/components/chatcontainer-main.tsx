/**
 * ChatContainer fixture for the RTL e2e baseline (e2e/rtl.spec.ts): one
 * assistant and one user message — user bubbles mirror through
 * flex-direction: row-reverse + logical corner radii, the densest RTL
 * surface among the layout-heavy components.
 *
 * name/timestamp render at --haze-color-text-secondary (≥4.5:1), keeping
 * the fixture inside WCAG AA in real-browser axe scans.
 */
import { ChatContainer } from '../../../src/lib/components/ChatContainer';
import { ChatMessage } from '../../../src/lib/components/ChatMessage';

import { mountPage } from './mount';

mountPage(
  <ChatContainer>
    <ChatMessage role="assistant" avatar="A" name="Haze" timestamp="12:01">
      How can I help you today?
    </ChatMessage>
    <ChatMessage role="user" avatar="Y" name="You" timestamp="12:02">
      Please summarize the RTL migration so far.
    </ChatMessage>
  </ChatContainer>
);

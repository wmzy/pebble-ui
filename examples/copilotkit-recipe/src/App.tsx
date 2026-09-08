import { useCallback, useState } from 'react';

import { z } from 'zod';
import {
  CopilotKitProvider,
  CopilotSidebar,
  useAgentContext,
  useFrontendTool,
} from '@copilotkit/react-core/v2';
import { useControl } from 'react-use-control';

import {
  Badge,
  Button,
  Card,
  Dialog,
  Option,
  Select,
  Switch,
  lightTheme,
  spacing,
  typography,
} from 'haze-ui';

/** The environments the console can target. */
const ENVIRONMENTS = ['development', 'staging', 'production'] as const;
type Environment = (typeof ENVIRONMENTS)[number];

const environmentBadge: Record<Environment, 'default' | 'info' | 'success'> = {
  development: 'default',
  staging: 'info',
  production: 'success',
};

/** One line of the activity log. `source` shows who drove the change. */
type ActivityEntry = { id: string; source: 'user' | 'agent'; text: string };

/**
 * The page itself. Must live inside <CopilotKitProvider>: useAgentContext
 * and useFrontendTool register against the agent the provider mounts.
 */
function ConsolePage() {
  // haze-ui controllable state: the third tuple element is the Control
  // object handed to the component, the setter is what both the UI and
  // the agent's frontend tools write through — one state, two drivers.
  const [environment, setEnvironment, environmentControl] = useControl<Environment>(
    undefined,
    'staging',
  );
  const [notifications, setNotifications, notificationsControl] = useControl<boolean>(
    undefined,
    true,
  );
  const [dialogOpen, setDialogOpen, dialogControl] = useControl<boolean>(undefined, false);
  const [deployCount, setDeployCount] = useState(0);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    { id: crypto.randomUUID(), source: 'user', text: 'console ready' },
  ]);

  const log = useCallback((source: 'user' | 'agent', text: string) => {
    setActivity((prev) => [...prev.slice(-19), { id: crypto.randomUUID(), source, text }]);
  }, []);

  // v2 replacement of useCopilotReadable: the whole page state is one
  // serializable snapshot the agent reads on every turn (values are
  // stringified on the wire — the agent parses the JSON string).
  useAgentContext({
    description:
      'Live state of the haze-ui deployment console: current selector value, notification switch, deployment dialog visibility, completed deployments and the recent activity log',
    value: {
      environment,
      notificationsEnabled: notifications,
      deploymentDialogOpen: dialogOpen,
      completedDeployments: deployCount,
      recentActivity: activity.slice(-8).map((entry) => `${entry.source}: ${entry.text}`),
    },
  });

  // v2 replacement of useCopilotAction: each tool is a browser-side
  // handler writing through the same useControl setters the UI uses.
  useFrontendTool(
    {
      name: 'setEnvironment',
      description:
        'Switch the console environment selector (haze-ui Select) between development, staging and production.',
      parameters: z.object({
        environment: z
          .enum(ENVIRONMENTS)
          .describe('The environment to switch the selector to'),
      }),
      handler: async ({ environment: next }) => {
        if (next === environment) return `The console is already on ${next}.`;
        setEnvironment(next);
        log('agent', `environment switched to ${next}`);
        return `Environment selector switched to ${next}.`;
      },
    },
    [environment, log],
  );

  useFrontendTool(
    {
      name: 'setNotifications',
      description:
        'Turn the console notification switch (haze-ui Switch) on or off.',
      parameters: z.object({
        enabled: z.boolean().describe('Whether notifications should be enabled'),
      }),
      handler: async ({ enabled }) => {
        if (enabled === notifications) {
          return `Notifications are already ${enabled ? 'on' : 'off'}.`;
        }
        setNotifications(enabled);
        log('agent', `notifications ${enabled ? 'enabled' : 'disabled'}`);
        return `Notifications ${enabled ? 'enabled' : 'disabled'}.`;
      },
    },
    [notifications, log],
  );

  useFrontendTool(
    {
      name: 'openDeploymentDialog',
      description:
        'Open the deployment confirmation dialog (haze-ui Dialog). Use it when the user wants to deploy the current environment.',
      parameters: z.object({}),
      handler: async () => {
        setDialogOpen(true);
        log('agent', 'deployment dialog opened');
        return `Deployment dialog opened for ${environment}.`;
      },
    },
    [environment, log],
  );

  const deploy = () => {
    setDeployCount((count) => count + 1);
    log('user', `deployed to ${environment}`);
    setDialogOpen(false);
  };

  return (
    <main className='page'>
      <header className='page-header'>
        <h1>haze-ui × CopilotKit</h1>
        <p className='muted'>
          The copilot reads the page through <code>useAgentContext</code> and
          drives the very same controls through <code>useFrontendTool</code> —
          both share haze-ui&rsquo;s controllable state. Say &ldquo;switch to
          production and start a deploy&rdquo; in the chat.
        </p>
      </header>

      <Card className='console-card'>
        <div className='console-row'>
          <div className='console-field'>
            <label htmlFor='environment-select'>Environment</label>
            <Select
              id='environment-select'
              value={environmentControl}
              onChange={(event) => {
                const next = event.currentTarget.value as Environment;
                if (next !== environment) log('user', `environment switched to ${next}`);
              }}
            >
              {ENVIRONMENTS.map((env) => (
                <Option key={env} value={env}>
                  {env}
                </Option>
              ))}
            </Select>
          </div>
          <Badge variant={environmentBadge[environment]}>{environment}</Badge>
        </div>

        <div className='console-row'>
          <div className='console-field'>
            <label htmlFor='notifications-switch'>Deploy notifications</label>
            <Switch
              id='notifications-switch'
              checked={notificationsControl}
              onClick={() => log('user', `notifications ${notifications ? 'disabled' : 'enabled'}`)}
            />
          </div>
          <span className='muted small'>
            {deployCount} deployment{deployCount === 1 ? '' : 's'} completed
          </span>
        </div>

        <div className='console-row'>
          <Button
            onClick={() => {
              setDialogOpen(true);
              log('user', 'deployment dialog opened');
            }}
          >
            Deploy {environment}…
          </Button>
          <span className='muted small'>
            The agent can open this dialog too — ask it to deploy.
          </span>
        </div>
      </Card>

      <Card variant='outlined' className='activity-card'>
        <h2>Activity</h2>
        <ul className='activity-list'>
          {activity.map((entry) => (
            <li key={entry.id}>
              <span
                className={
                  entry.source === 'agent' ? 'activity-source-agent' : 'activity-source-user'
                }
              >
                {entry.source}
              </span>
              <span className='activity-text'>{entry.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog
        open={dialogControl}
        onClose={() => log('user', 'deployment dialog closed')}
        title={`Deploy to ${environment}?`}
      >
        <p>
          This will ship the current build to <strong>{environment}</strong>.
          {notifications
            ? ' A completion notification will be sent.'
            : ' Notifications are off, so no notification will be sent.'}
        </p>
        <div className='dialog-actions'>
          <Button variant='outline' size='sm' onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={deploy}>
            Deploy now
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

export default function App() {
  // A SPA has no shared origin with its runtime, so the URL must be
  // absolute (docs.copilotkit.ai/react-spa). Override with
  // VITE_COPILOT_RUNTIME_URL when the runtime is not on localhost:8200.
  const runtimeUrl =
    import.meta.env.VITE_COPILOT_RUNTIME_URL ?? 'http://localhost:8200/api/copilotkit';

  // The v2 provider reports runtime/agent/tool errors through onError
  // (no API key needed) — surface them instead of a silent no-reply chat.
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={`${lightTheme} ${spacing} ${typography} app-root`}>
      <CopilotKitProvider runtimeUrl={runtimeUrl} onError={(event) => setError(event.error.message)}>
        {error && (
          <div className='error-banner' role='alert'>
            {error}
          </div>
        )}
        <ConsolePage />
        <CopilotSidebar defaultOpen labels={{ modalHeaderTitle: 'Console copilot' }} />
      </CopilotKitProvider>
    </div>
  );
}

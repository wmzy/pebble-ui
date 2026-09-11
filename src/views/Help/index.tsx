import {page, intro, section, codeBlock} from '@/views/ComponentDetail/styles';

export default function Help() {
  return (
    <div className={page}>
      <h1>Help</h1>
      <p className={intro}>
        Need help with Haze UI? Check the component documentation or open an issue on GitHub.
      </p>
      <div className={section}>
        <h2>AI / MCP</h2>
        <p className={intro}>
          Give your AI coding agent direct access to the Haze UI docs with the{' '}
          <code>haze-ui-mcp</code> MCP server — component props, import statements, CSS
          paths and design tokens as callable tools (haze_list_components,
          haze_get_component, haze_get_tokens, haze_search_docs).
        </p>
        <pre className={codeBlock}>{`{
  "mcpServers": {
    "haze-ui": {
      "command": "npx",
      "args": ["haze-ui-mcp"]
    }
  }
}`}</pre>
      </div>
    </div>
  );
}

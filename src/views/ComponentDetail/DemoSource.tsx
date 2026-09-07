import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  useClipboard,
} from '@/lib';

// demos 目录源码映射：'./demos/ButtonDemo.tsx' → 文件内容字符串。
const demoSources = import.meta.glob('./demos/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** route 名 → demo 文件名（'data-table' → 'DataTableDemo.tsx'）。 */
function demoFileName(route: string): string {
  const componentName = `${route
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Demo`;
  return `${componentName}.tsx`;
}

type DemoEntry = { fileName: string; source: string };

// route key 全小写，而文件名内部的大写切分无法从 route 恢复
// （'numberinput' → NumberInputDemo、'otpinput' → OTPInputDemo），统一转
// 小写后比对即可全部命中。demos 目录之外的 demo（'form' 在
// @/components/FormDemo）找不到 → DemoSource 渲染 null。
const demoEntriesByName = new Map<string, DemoEntry>(
  Object.entries(demoSources).map(([path, source]) => {
    const fileName = path.slice('./demos/'.length);
    return [fileName.toLowerCase(), { fileName, source }];
  })
);

function resolveDemo(name: string): DemoEntry | undefined {
  return demoEntriesByName.get(demoFileName(name).toLowerCase());
}

const chevron = css`
  display: inline-block;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  transition: transform var(--haze-duration-fast) var(--haze-ease);
`;

const chevronOpen = css`
  transform: rotate(90deg);
`;

const wrapper = css`
  margin-top: var(--haze-space-8);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg-subtle);
`;

const header = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-2) var(--haze-space-3);
`;

const trigger = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--haze-color-text);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  text-align: left;
`;

const fileNameStyle = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const langTag = css`
  flex: none;
  padding: var(--haze-space-0) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-tight);
  color: var(--haze-color-text-secondary);
`;

const codeStyle = css`
  margin: 0;
  border-top: 1px solid var(--haze-color-border);
  padding: var(--haze-space-3) var(--haze-space-4);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-normal);
  color: var(--haze-color-text);
  white-space: pre;
  max-height: 60vh;
  overflow: auto;
`;

/**
 * 当前 route 对应 demo 的源码区块：可折叠（默认展开），标题栏带 tsx 语言
 * 标签与 Copy 按钮，主体 <pre><code> 展示原始源码。
 * demo 不在 demos 目录（如 'form'）时整个区块不渲染。
 */
export default function DemoSource({ name }: { name: string }) {
  const [open, , openControl] = useControl(true);
  const { copied, copy } = useClipboard();
  const demo = resolveDemo(name);

  if (!demo) return null;

  return (
    <div className={wrapper} data-state={open ? 'open' : 'closed'}>
      <Collapsible open={openControl}>
        <div className={header}>
          <CollapsibleTrigger className={trigger}>
            <span x-class={[chevron, open && chevronOpen]} aria-hidden='true'>
              ▸
            </span>
            <span className={fileNameStyle}>demos/{demo.fileName}</span>
          </CollapsibleTrigger>
          <span className={langTag}>tsx</span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => void copy(demo.source)}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <CollapsibleContent>
          <pre className={codeStyle}>
            <code>{demo.source}</code>
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

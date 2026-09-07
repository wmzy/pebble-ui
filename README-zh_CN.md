# Haze UI

> 一个带有可控状态的 React 组件库。

[English](./README.md) | 简体中文

[![npm](https://img.shields.io/npm/v/haze-ui)](https://www.npmjs.com/package/haze-ui)
[![downloads](https://img.shields.io/npm/dm/haze-ui.svg)](https://www.npmjs.com/package/haze-ui)
[![CI](https://github.com/wmzy/haze-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/wmzy/haze-ui/actions/workflows/ci.yml)

## 特性

- 集成 [react use control](https://github.com/wmzy/react-use-control)，提供组件内部状态
- 为 React 19+ 而构建（`ref` 作为 prop、`ControlOrValue<T>` 状态协议）——不带 React 18 兼容层
- 保持克制，提供轻量、可组合、易于扩展的组件
- 支持主题定制
- 支持 Tree-shaking
- 像产品一样测试：120+ 个单测文件、每个组件测试套件内建 axe 无障碍用例、
  约 50 条横跨 Chromium/Firefox/WebKit 的 Playwright e2e 场景，以及
  像素锁定的视觉基线

## 为什么选择 npm 分发（而非复制粘贴）

**交互态是公式，不是值。** 每个 hover/active/subtle/focus-ring 颜色都是一条 CSS 相对色表达式——`oklch(from var(--haze-color-primary) calc(l - 0.045) c h)`——烘焙在 `tokens.css` 里。在某个主题类上覆写 `--haze-color-primary`，整个交互态家族就会在浏览器里于运行时重新派生：无需重新构建，无需代码生成。而在复制粘贴的工程里，每个粘贴来的文件都持有自己那份公式副本，每次主题调整都意味着逐文件手工重施。

**`haze-ui/css-manifest.json` 是机器可读的数据。** 权威的「导出 → CSS 文件」映射（含家族归并）在每次构建时重新生成，构建器插件与 codemod 读取的是同一份真值，而不是各自重新推导 kebab-case 文件名。一堆复制粘贴来的组件没有等价物——这个映射只存在于你的脑子里或你的 fork 里，并且会漂移。

**`ControlOrValue<T>` 协议需要真实的运行时。** 一个 prop——`checked?: Control<T> | T`——同时覆盖受控*与非受控*两种用法，因为 `react-use-control` 承载了全部接线；已发布的包正是让该行为在每个组件、每个版本保持一致的契约。这一切都不与 shadcn / Base UI 生态为敌：haze-ui 的 token 就是普通 CSS 自定义属性，可以与 Tailwind v4 的 `@theme` 块互操作，haze 组件也能与复制粘贴来的原语在各得其所之处组合共存。

## 快速开始

### 安装

```sh
npm i haze-ui
// or
pnpm add haze-ui
```

### 为 React 19+ 而设计

peer 依赖范围有意定为 `react: ^19.0.0`——haze-ui 构建在现代 React 之上，
而不是背着 React 18 的兼容层：

- **`ref` 作为 prop。** React 19 直接把 `ref` 传给函数组件，暴露 ref 的组件
  只需接受一个 prop，而不必包一层 `forwardRef` 包装。
- **现代平台基线。** 浮层面板（Popover、DropdownMenu、Tooltip、ContextMenu、
  Combobox、Datepicker）通过特性检测在三档实现中选择——原生 `popover` + CSS
  anchor positioning、仅 `popover`、或 JS 回退——最新的平台特性是主路径，
  而非叠加在上面的增强。
- **`ControlOrValue<T>`**（即 `Control<T> | T` 状态协议）自始至终按现代
  React 语义设计。

还在 React 18？请先升级。haze-ui 不附带 React 18 兼容层，也没有计划提供。

#### 从 React 18 迁移

应用本身升到 React 19 之后，过一遍 haze-ui 相关的检查清单：

- **`ref` 是一个 prop。** React 19 直接把 `ref` 传给函数组件——去掉你
  包在 haze 组件外的 `forwardRef` 包装，把 `ref` 当普通 prop 传即可。
- **没有 `defaultValue` 双轨。** 有状态组件一律说
  `ControlOrValue<T>`（如 `checked?: Control<T> | boolean`）：同一个 prop
  同时覆盖受控与非受控，不存在 `defaultChecked`/`defaultValue` 这对
  prop 需要迁移。原来传 `defaultValue` 的地方，直接传纯值（非受控），
  或改为受控 + `onChange`。
- **浮层面板假定现代平台基线。** Popover、DropdownMenu、Tooltip、
  ContextMenu、Combobox、Datepicker 通过特性检测在原生 `popover` + CSS
  anchor positioning、仅 `popover`、JS 回退之间选择——不用从 React 18
  工程里背 polyfill 过来，但[「浏览器支持」](#浏览器支持)的地板要求适用。
- **颜色是 OKLCH，交互态运行时派生。** 要求 Chrome/Edge 119+、
  Safari 16.4+ 或 Firefox 128+；不提供 HSL/hex 回退。
- **`'use client'` 已预注入。** `dist/` 里每个模块都以该指令开头，
  Next.js App Router 项目中直接从客户端组件导入 haze-ui 即可——不需要
  再写一个把自己的 `'use client'` 旗帜挂在库上的再导出包装模块。

### 可选 peer 依赖

haze-ui 唯一的必装运行时依赖是 `react-use-control`——`ControlOrValue<T>`
背后的引擎。三个集成是可选依赖（peer dependency），只在使用到对应组件时
才安装：

```sh
npm i react-f0rm              # FormItem（peer 范围 ^1.1.1）
npm i @tanstack/react-table   # DataTable（peer 范围 ^9.2.4）
npm i recharts                # Chart（peer 范围 ^3.10.1）
```

其余一切——`Button`、`Input`、`Dialog`、`Select`……——只需要 `react` 和
`react-use-control` 即可运行。产物是 ESM、`preserveModules` 且 JS 无副作用，
因此构建器（Next.js、Vite、webpack、Turbopack、Rollup）会摇掉未使用的
再导出链，永远不会解析你未安装的 peer：不装 `react-f0rm` 也能
`import { Button } from 'haze-ui'`。只有不经构建器的消费者（裸 Node ESM
直接导入 barrel，会急切链接整张模块图）必须同时安装可选 peer；
`haze-ui/form`、`haze-ui/components/DataTable` 与 `haze-ui/components/Chart`
子路径则完全绕开 barrel。

### 浏览器支持

自 v1.13 起，haze-ui 的颜色以 **OKLCH** 生成，交互态
（hover/active/subtle/focus-ring）在运行时经 CSS 相对色语法派生。这要求
Chrome/Edge 119+、Safari 16.4+ 或 Firefox 128+；不提供 HSL/hex 回退。

### 使用

导入组件及其 CSS，两种加载方式：

```jsx
// 全量样式（最简单，gzip 后约 12kB）
import 'haze-ui/styles.css';
import { lightTheme, spacing, typography, Button } from 'haze-ui';

// ……或按组件加载（只为用到的组件付费）。
// tokens.css 只需导入一次，再导入用到的组件 CSS：
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css';
import { Button } from 'haze-ui';

export default function MyComponent() {
  return (
    <Button>Start</Button>
  )
}
```

组件 CSS 文件名为组件名的 kebab-case（`OTPInput` →
`haze-ui/css/otp-input.css`）。按组件的文件只包含该组件自己的规则，
主题/间距/排印等令牌始终来自 `haze-ui/css/tokens.css`。

不要在工具链里硬编码这条 kebab-case 规则：子组件与受控核心（*Core）
共用所在目录的家族文件（`InputCore` → `input.css`、`ButtonLink` →
`button.css`、`Title`/`Text` → `typography.css`）。权威的「导出 → css
文件」映射随包以数据形式发布：`haze-ui/css-manifest.json`，由
`scripts/split-css.mjs` 在构建期从实际 CSS 产物推导生成（非手工维护）：

```json
{
  "families": { "Button": "button", "ButtonLink": "button", "InputCore": "input", "useToast": "toast" },
  "noCss": ["COMPONENT_TOKENS", "TOKEN_REGISTRY", "useControl", "useTitle"]
}
```

`families` 覆盖所有有样式产物的具名导出（含家族归并）；`noCss` 列出
无样式产物的纯逻辑导出。构建插件 / codemod 应读取该 manifest，而非
自行推导文件名——映射与构建产物同步演进，不漂移。

### Server Components（Next.js App Router）

`dist/` 中的每个 JS 模块都以 `'use client'` 指令开头，由构建期注入——
与 Radix、Base UI 和 React Aria 发布时采用的约定相同。在 App Router
项目里，你可以直接从客户端组件导入 haze-ui；不需要再写一个把库挂在
自己的 `'use client'` 旗帜下再导出的包装模块：

```jsx
// 任意客户端组件——直接从包导入
import { Button } from 'haze-ui';

export function Actions() {
  return <Button>Start</Button>;
}
```

CSS 加载方式与上面两种模式一致——在根布局里引入 `haze-ui/styles.css`，
或使用 `haze-ui/css/*` 子路径。可运行的 Next.js 15 示例工程在
[`examples/nextjs`](./examples/nextjs)。

## ButtonLink：带按钮外观的真链接

长得像按钮的导航仍然应该「是」链接——`as={Button}` 会把 `href` 落到
`<button>` 上（非法属性：⌘/中键开新标签失效，爬虫与无 JS 环境无从跟随）。
`ButtonLink` 渲染原生 `<a>`，穿 Button 的全套外观——同样的
`variant`/`size`/`square` props，同样的 hover/active/焦点与禁用视觉：

```jsx
import { ButtonLink } from 'haze-ui';

<ButtonLink href='/page/2' variant='outline'>下一页</ButtonLink>

// 锚点没有 `disabled` 属性——用 aria-disabled 上报状态（配
// tabIndex={-1} 移出焦点序）；ButtonLink 按 Button 的 :disabled 同款渲染
<ButtonLink href='/prev' aria-disabled tabIndex={-1}>← 上一页</ButtonLink>
```

其余 props 全部扩展自原生 `<a>` 属性并透传到锚点（`target`、`rel`、
`download`、`aria-*`……），ref 一并转发——与 `NavLink` 相同的组合形态，
路由库可用 `as` 把自己的 Link 元素换下来：

```jsx
// 配类型化路由 Link（href 与 SPA onClick 由路由注入）：
<TypedLink to='/articles' search={{offset: 20}} as={ButtonLink}>
  下一页
</TypedLink>
```

两个组件共享同一份皮肤（styles 模块），对 Button 的主题微调会同步
重皮肤 ButtonLink。CSS：`haze-ui/css/button.css` 同时覆盖两者。

## AsyncSection：加载 / 错误 / 内容三态归一

`AsyncSection` 把每个异步视图都要手写一遍的三个分支收敛为一个组件：
`loading` 渲染 Spinner 占位；`error` 非空渲染 Alert 样式错误框与可选的
`Retry` 按钮（`Error` 实例自动取 `message`，`errorText` 可覆盖）；否则
渲染 children。两者同时为真时 `loading` 优先——重试路径（旧错误未清除
时再次进入加载）显示占位而非过期错误。文案全部可配；只有传入 `onRetry`
才渲染重试按钮。

```jsx
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/async-section.css';
import { AsyncSection } from 'haze-ui';

<AsyncSection loading={loading} error={error} onRetry={refetch}>
  {data}
</AsyncSection>
```

## useTitle：视图级 document.title

`useTitle(title)` 挂载期间把 `document.title` 设为页标题，卸载时恢复
「进入前」的值（宿主页面的静态 `<title>`）。实现里固化了两个时序坑：
写入与恢复拆成两个 effect（单 `[title]` effect 的 cleanup 在每次 prop
变化后都会执行，会把标题写回上一轮的值而非入口默认）；进入前值的快照
取在 effect 期而非渲染期——路由换树是同一次 commit，渲染期旧视图的
cleanup 还没跑，`document.title` 仍是上一页的标题。

```jsx
import { useTitle } from 'haze-ui';

function SettingsView() {
  useTitle('Settings');
  // ...
}
```

## 设计 token 导出（Figma）

`toDesignTokens()` 把 token 注册表转换为 [W3C Design Tokens](https://tr.designtokens.org/) JSON 文件——按类别分组（`color` / `font` / `spacing` / `dimension` / `shadow`），每个 token 携带 W3C `$type`，源 CSS 变量记录在 `$extensions['haze-ui.css-var']`，`$value` 则是所选主题（默认 `light`）解析后的值。主题编辑器提供一键入口：工具栏的 **Export W3C tokens (.json)** 按钮会下载当前编辑模式对应的文件，实时未保存的修改也包含在内。导出文件可直接导入 Figma Tokens / Tokens Studio。

```json
{
  "color": {
    "color-primary": {
      "$value": "oklch(0.563 0.241 260.8)",
      "$type": "color",
      "$extensions": { "haze-ui.css-var": "--haze-color-primary" }
    }
  },
  "spacing": {
    "space-2": {
      "$value": "8px",
      "$type": "dimension",
      "$extensions": { "haze-ui.css-var": "--haze-space-2" }
    }
  }
}
```

## AI 友好分发

**llms.txt** —— 面向 AI 编码工具 / 爬虫的全库 markdown 概览（`ControlOrValue<T>`
状态协议、两种 CSS 加载模式、按分组列出全部 104 个组件及一句话用途、token
体系、浮层三 tier、表单集成）。位于仓库根 [llms.txt](./llms.txt)，文档站上也可
访问 <https://wmzy.github.io/haze-ui/llms.txt>（`build:demo` 会把它拷入 `dist/`）。

**registry.json** —— 面向 agent 安装的注册表，作为 `haze-ui/registry.json`
npm 产物分发（每次构建由 `scripts/generate-registry.mjs` 重新生成），也可从
<https://unpkg.com/haze-ui/registry.json> 直接访问。任何理解 registry 的
工具都能消费——shadcn CLI 即可：

```sh
pnpm dlx shadcn@latest add https://unpkg.com/haze-ui/registry.json
```

每个条目都是**包装文件，而非拷贝的源码**：它从已发布的 haze-ui npm 包
re-export 组件并导入其样式表，`haze-ui` 始终是一个持续更新的普通 npm
依赖——shadcn CLI 只是分发渠道。这正是它的定位：AI 编码 agent（以及一切
想快速接入、同时保留 npm 更新链路的人）一步拿到可用的 import，而不落入
「复制粘贴即拥有源码」的预期错位。想改样式或行为时，fork 生成的包装文件
——它是你的定制层，不是源码拷贝。覆盖范围如实说明：仅包含 **agent 组件**
（AI & Chat 分组 + AsyncSection）。

## 无头原语（实验性）

带样式组件所依赖的行为层，以独立子路径发布：`haze-ui/headless`。
自己组装面板的组件作者可以直接使用 Popover、DropdownMenu、Tooltip
内部所用的同一批原语——同源同版本，无需重新实现：

- `useFloating` —— 三 tier 浮层引擎（原生 `popover` + CSS anchor
  positioning → 仅 `popover` → JS 兜底），以及 `placeFloatingPanel`、
  `useFloatingPosition` 与 placement/panel 相关类型
- `Presence` —— 带退出动画的挂载/卸载
- `useFocusScope` / `isTabbable` / `getTabbables` —— 焦点圈禁与可聚焦查询
- `computeFloatingPosition` —— flip/shift 碰撞计算的纯函数

```jsx
import { useFloating, Presence } from 'haze-ui/headless';
```

API 稳定前为实验性——只会做非破坏性新增，定型前签名可能收紧。

## react-f0rm 集成

react-f0rm 持有表单字段状态，它的无头 `useField` hook 是唯一的绑定层——
内置 `Field`/`Checkbox`/`Select` 组件走的就是同一通道。haze-ui 贡献视图：
受控核心（`InputCore`、`SelectCore`、`SwitchCore`、`TextareaCore`、
`TagInputCore`、`TransferCore`、`UploadCore`……）直接接收纯 `{value, onChange}`
对，无需适配器；`FormItem`
在此基础上补 label、错误与 aria 接线。糖衣组件（`Input`、`Select`……）在
表单之外的独立使用仍保留原有 `ControlOrValue<T>`（即 `Control<T> | T`）API。

### useField：字段 → {value, onChange}

```jsx
import { useForm, useField } from 'react-f0rm';
import { InputCore } from 'haze-ui';

function NameField({ form }) {
  const { value, onChange } = useField({ form, name: 'name' });
  return <InputCore value={value} onChange={onChange} />; // 双向绑定
}
```

hook 按字段订阅（兄弟字段互不牵连）；`onChange` 写入走 react-f0rm 的用户
变更通道，触发与真实输入一致的校验：字段生效的 `mode`（含 `FormItem`/
`useField` 的单字段覆盖）与表单的 `reValidateMode`。默认 `mode: 'onSubmit'`
+ `reValidateMode: 'onChange'` 下，提交失败后通过绑定的核心组件输入，会逐键
重新校验并在值合法时立即清除错误——无需失焦、无需重复提交。`onChange` 只接受
纯值（受控核心只发下一个值，不发函数式更新；需要上一个值时在下次渲染读
`value`）。`reset(form, newValues)` 会通过订阅机制重新播种所有绑定，无需
重挂组件。

### FormItem：label、错误与 aria 接线

```jsx
import { Form, useForm } from 'react-f0rm';
import { FormItem, InputCore } from 'haze-ui';

function ProfileForm() {
  const form = useForm({ initialValues: { email: '' } });
  return (
    <Form form={form} onSubmit={...}>
      <FormItem
        form={form}
        name="email"
        label="Email"
        validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
      >
        {({ id, errorId, invalid, value, onChange }) => (
          <InputCore id={id} value={value} onChange={onChange} aria-invalid={invalid} aria-describedby={errorId} />
        )}
      </FormItem>
    </Form>
  );
}
```

`FormItem` 生成字段/错误的 id、渲染 `<label htmlFor>`，并把首个错误渲染进
`role="alert"` 元素——无需手挂 `FieldError`。

#### `as`：声明式绑定（react-f0rm Field 风格）

不想写渲染函数时，把组件直接传给 `as`，`FormItem` 自动接好 id、aria、
`onBlur` 和 `onChange`——props 形态对齐 react-f0rm 的 `Field`，而非 Radix
的 `asChild`。`as` 与 children 渲染函数二选一。

```jsx
// 文本字段：无需再接任何东西
<FormItem form={form} name="email" label="Email" as={InputCore} />

// 复选类控件：值在 `checked` 里
<FormItem
  form={form}
  name="subscribed"
  label="订阅"
  as={CheckboxCore}
  valueToProps={(checked) => ({ checked: !!checked })}
/>

// DOM 元素形态的控件：事件与值各用一行适配
<FormItem
  form={form}
  name="email"
  as={NativeInput}
  eventToValue={(e) => e.target.value}
  renderError={(error, id) => <em id={id}>{error}</em>}
/>
```

- `eventToValue` 默认恒等——haze 核心组件的 `onChange` 发出下一个纯值；
  `as` 是原生 DOM 元素组件时传 `(e) => e.target.value`。
- `asProps` 在值之前展开到控件上，因此 `value`/`valueToProps` 冲突时优先
  （与 Field.tsx 一致）。
- `renderError(error, id)` 替换内置错误 span 的内容；span 本身（id、
  `role="alert"`、样式）仍由 FormItem 渲染。
- 携带类型化的表单时，`validate` 的 value 参数是字段的真实类型
  （`PathValueOf<TValues, P>`），不再是 `any`。

#### `input`：面向 haze 核心组件与原生 DOM 控件的声明式绑定（类型化透传）

受控核心组件的顺手形态——直接传组件引用，其余 JSX 属性原样透传，并按
组件自己的 props 做编译期校验：

```jsx
<FormItem
  form={form}
  name="email"
  label="Email"
  input={InputCore}
  placeholder="you@x.dev"
  mode="onBlur"
  validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
/>

// JSX children 也透传——SelectCore 的选项：
<FormItem form={form} name="role" label="角色" input={SelectCore}>
  <option value="admin">Admin</option>
  <option value="viewer">Viewer</option>
</FormItem>

// 复选类控件仍配 valueToProps 适配：
<FormItem
  form={form}
  name="subscribed"
  label="订阅"
  input={CheckboxCore}
  valueToProps={(checked) => ({ checked })}
/>
```

`input` 与 `as` 接的是同一套 id/aria/`onBlur`/`onChange`/值契约——所有
haze 核心组件（`InputCore`、`TextareaCore`、`SelectCore`、
`TagInputCore`、`TransferCore`、`UploadCore`、`CheckboxCore`、
`SwitchCore`……）都说纯 `{value, onChange}`
对，默认适配器零配置（`TagInputCore` 的 `onChange` 本来就发出下一个
`string[]`；`TransferCore` 发出下一个 `string[]` 附带移动元信息，
`UploadCore` 发出下一个 `File[]`；复选类核心配 `valueToProps`）。与 `as` 的差异：

- 透传属性**按核心组件自己的 props 做类型校验**——
  `input={InputCore} size="xl"` 是编译错误，而 `asProps` 是无类型的包。
- JSX **children** 透传给核心组件（`SelectCore` 的 `<option>`）；渲染函数
  children 与 `input` 互斥（`input` 旁边挂渲染函数会 throw——那是迁移
  残留）。
- 接线属性（`id`、`aria-invalid`、`aria-describedby`、`onBlur`、
  `onChange`、`value`/`checked`）与 FormItem 自己的属性名**保留**：类型上
  从透传面剔除、运行时恒定优先。与控件属性撞名的（如 CheckboxCore 自己
  的 `label`）经 `input` 不可达——请改用渲染函数或 `as`/`asProps`。

`input` 同样接受原生 DOM 绑定——无需核心组件。两种 raw 形态都显式携带
`eventToValue` 适配器，值通道从不靠猜：

```jsx
// 原生表单元素：绑定对象把标签名和适配器配成一对，其余 JSX 属性
// 按该元素自己的 HTML 属性做类型校验（textarea 的 rows、select 的
// option children）
<FormItem
  form={form}
  name="bio"
  label="简介"
  input={{element: 'textarea', eventToValue: (e) => e.target.value}}
  rows={4}
/>

// DOM 元素形态的组件：顶层 eventToValue 就是从纯值（核心）切到事件
// 语义（raw）的显式开关
<FormItem
  form={form}
  name="email"
  label="Email"
  input={NativeInput}
  eventToValue={(e) => e.target.value}
/>
```

- 元素绑定接受 `'input' | 'textarea' | 'select'`，且**必须**携带
  `eventToValue`——缺适配器的 `input={{element: 'input'}}` 是编译错误
  （运行时未类型调用方漏传时也按 DOM 契约取 `e.target.value`，绝不把
  Event 对象写进 store）。
- 组件旁的顶层 `eventToValue` 把该绑定切到 raw 语义，与 `as` 通道一致；
  透传属性仍按组件自己的 props 校验。
- 保留属性规则同样生效：`id`、`onBlur`、`onChange`、`value`/`checked`、
  aria-* 与 FormItem 自己的属性名在 raw 通道上同样不可透传。

#### `mode`：单字段校验时机（react-f0rm ≥ 0.6）

传入 `mode` 可让单个字段按自己的节奏校验，而不跟随表单级校验模式——
其他字段不受影响。它接受 react-f0rm 的 `ValidationMode` 值：`'onSubmit'`
（默认表单行为）、`'onBlur'`、`'onChange'`、`'onTouched'` 或 `'all'`。
省略则保持表单的 `mode`。

```jsx
<FormItem
  form={form}
  name="email"
  label="Email"
  mode="onBlur"
  validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
>
  {({ id, errorId, invalid, onBlur, value, onChange }) => (
    <InputCore
      id={id}
      value={value}
      onChange={onChange}
      aria-invalid={invalid}
      aria-describedby={errorId}
      onBlur={onBlur}
    />
  )}
</FormItem>
```

在 `mode="onBlur"`（并且像上面那样把绑定返回的 `onBlur` 传给核心组件）下，
email 字段在失焦那一刻即被校验——无需提交。`mode` 接受 `'onSubmit'`、
`'onBlur'`、`'onChange'`、`'onTouched'` 或 `'all'`；只有这个字段的节奏
改变，表单其余部分保持自己的 `mode`。

#### `validateDebounce` / `delayError` / `rules`（react-f0rm ≥ 0.6）

`FormItem` 把这些字段级选项直接透传给 react-f0rm 的 `useField`：

- `validateDebounce={300}`——对该字段的校验触发做防抖：窗口内只有最后一
  次触发会运行校验器（例如用户快速输入时，逐键的异步校验器不会连续开火）。
  计时器挂起期间该字段计入「校验中」，`trigger`/提交会等它完成。
- `delayError={500}`——延迟*显示*新出现的错误（渲染出的错误 span 与绑定
  返回的 `invalid`/`errors`）。表单自身的错误状态保持即时——提交和
  `getError` 仍以它为准。在窗口内就被清除的错误永远不会显示。
- `rules={{ required: 'Email is required', minLength: 4, pattern: { value: /@/, message: 'Must be an email' } }}`
  ——声明式约束（react-hook-form `register` 规则的一个子集）编译成在
  `validate` *之前*运行的校验器；两个来源的错误合并进字段的错误列表，
  rules 的错误排在前面。

```jsx
<FormItem
  form={form}
  name="email"
  label="Email"
  validateDebounce={300}
  delayError={500}
  rules={{ required: 'Email is required' }}
  validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
>
  {({ id, errorId, invalid, value, onChange }) => (
    <InputCore id={id} value={value} onChange={onChange} aria-invalid={invalid} aria-describedby={errorId} />
  )}
</FormItem>
```

三者都是可选的；省略时字段行为与之前完全一致（按表单 `mode` 即时校验、
错误即时显示、仅 `validate`）。

## 无障碍与 RTL

无障碍是基线，而非可选项：每个组件的测试套件都包含 axe 检查，token
样式表自带全局 `@media (prefers-reduced-motion: reduce)` 块，把所有动画
时长 token 折叠为 `0ms`——对动效敏感的用户即刻得到状态切换，无需任何
逐组件接线。

haze-ui 在「边」有语义（阅读流的 *start/end*）而非纯装饰之处，一律用
CSS 逻辑属性支持 RTL。在祖先元素上设置 `dir="rtl"`（或 `direction: rtl`），
这些边即自动镜像——无需改动任何组件 props。回归冒烟测试
（`src/lib/rtl.test.tsx`）在 `dir="rtl"` 子树中渲染 Progress、Alert、
Badge、Tag 与 Dialog，断言正常渲染、axe 干净且 aria 契约不变。

### 天生方向自适应（无物理 CSS）

- **Progress（条形）**——填充是常规流中的块、宽度为百分比，因此从
  inline-start 边（RTL 下即右侧）生长，CSS 中没有任何 `left`/`right`。
- **Slider**——原生 `<input type="range">`；浏览器在 `dir="rtl"` 下自动
  镜像填充与滑块。
- **Flex gap / `flex-direction: row`**——间距与行序跟随书写模式，Tag、
  ChatMessage、Alert 等的图标-标签间距免费获得镜像。
- **Carousel 轨道滚动**——使用 `scrollIntoView({ inline: 'start' })`，
  一个逻辑滚动位置。

### 已修复：物理属性 → 逻辑属性转换

| 文件 | 改动 |
| --- | --- |
| `Carousel.tsx` | 上一个/下一个按钮 `left`/`right` → `inset-inline-start`/`inset-inline-end`，外加 `[dir='rtl']` 下 `scale: -1 1` 镜像，让 `‹`/`›` 字形沿阅读方向指向 |
| `ChatMessage.tsx` | 气泡尾巴圆角 `border-bottom-right-radius` / `border-bottom-left-radius` → `border-end-end-radius` / `border-end-start-radius`（尾巴跟随气泡锚定的一侧） |
| `Chip.tsx` | 关闭按钮 `margin-left` → `margin-inline-start` |
| `Container.tsx` | `margin-left/right: auto` → `margin-inline: auto`；`padding-left/right` → `padding-inline` |
| `ContextMenuItem.tsx`、`DropdownMenuItem.tsx`、`MenuItem.tsx`、`ConversationItem.tsx` | `text-align: left` → `text-align: start` |
| `DiffViewer.tsx` | 行号槽 `text-align: right` → `end`，`border-right` → `border-inline-end`（槽保持在起始侧） |
| `List.tsx` | `padding-left` → `padding-inline-start`（列表缩进），两种变体 |
| `NavigationBar.tsx` | 尾部插槽 `margin-left: auto` → `margin-inline-start: auto` |
| `StepTimeline.tsx` | 连接线 `left` → `inset-inline-start`（保持在 inline-start 标记列下方） |
| `Stepper/Step.tsx` | 连接线 `left: 50%` → `inset-inline-start: 50%`（朝下一个步骤延伸） |
| `TableHead.tsx` | `th { text-align: left }` → `start` |
| `TreeItem.tsx` | 复选框/图标 `margin-right` → `margin-inline-end`；缩进参考线 `border-left` → `border-inline-start` |

有意保持物理属性——字形几何或对称布局，而非阅读流的边：
Accordion/Disclosure 中旋转边框的箭头、Checkbox 旋转的对勾、Radio 居中
的圆点、Affix 对称的 `left: 0; right: 0` 拉伸。

### 部分支持：已知缺口

- **浮层面板（Popover、DropdownMenu、Tooltip、ContextMenu、Combobox、
  Datepicker）**——placement 是物理边（`'left'`/`'right'`/`'bottom-end'`……）。
  CSS anchor positioning 的 `position-area` 网格关键字与 JS 碰撞计算
  （`utils/collision.ts`，视口坐标）都是物理的；迁移到逻辑
  `position-area` 关键字是已跟踪的未来变更。RTL 下面板定位与 LTR 完全
  相同。
- **输入装饰**——`SelectCore` / `ModelPicker` 的箭头
  （`background-position: right …` + `padding-right`）与
  `PasswordInputCore` 绝对定位的显示密码按钮位于物理右侧并配相应
  padding。RTL 下保持一致，但不镜像。
- **Progress（环形）**——SVG `stroke-dashoffset` 填充无论方向如何都顺时针
  进行（SVG 没有内联轴）。
- **以物理为设计意图的 placement API**——`Drawer` 的 `placement`
  （`'left'`/`'right'`）、`Toast` 的方位（`'top-left'`……）、`SwipeAction`
  的左右操作边、`BackToTop` 的右下角、`CodeBlock` 的右上角语言徽标：
  边本身就是 API，因此保持物理。

### 剩余缺口的临时方案

对上述一切用 `dir="rtl"` 包裹即可；对以物理为设计意图的场景，通过每个
组件都接受的 `className` 用逻辑 inset 覆写：

```jsx
<Drawer placement="right" className="rtl-drawer" />
```

```css
[dir='rtl'] .rtl-drawer {
  /* 把物理方位拨回阅读流一侧 */
  inset-inline-end: 0;
}
```

## 相关项目

- [react-use-control](https://github.com/wmzy/react-use-control)

## 参与贡献

欢迎任何形式的贡献。

## 版权声明

[MIT](https://choosealicense.com/licenses/mit/)

## 常见问题

### 组件渲染出来没有样式

haze-ui 的样式通过独立 CSS 子路径发布，JS 入口不内联任何样式文件。
全量引入一次即可：

```js
import 'haze-ui/styles.css';
```

或按组件引入 tokens 与该组件自己的规则：

```js
import 'haze-ui/css/tokens.css';
import 'haze-ui/css/button.css';
```

### 是否提供 CommonJS 构建？

不提供——haze-ui 仅发布 ESM（`"type": "module"`）。请使用支持 ESM 的
打包器或运行时（Vite、webpack 5、Next.js、Node ≥ 18 等）。

### haze-ui 支持 React 18 吗？

不支持——peer 范围有意定为 `react@^19.0.0`（参见
[「为 React 19+ 而设计」](#为-react-19-而设计)）。请先升级到 React 19；
haze-ui 不附带 React 18 兼容层。

### 如何检测（或降级）relative-color 语法？

自 v1.13 起，主题交互态由 CSS 相对色派生，因此适用
[「浏览器支持」](#浏览器支持)一节的浏览器基线——Chrome/Edge 119+、
Safari 16.4+、Firefox 128+，且不提供 HSL/hex 回退。要让你自己的回退
样式以支持性为门控，可在 CSS 中探测该语法：

```css
@supports (color: oklch(from red calc(l + 0.05) 0 h)) {
  /* 相对色可用：从 token 派生自定义交互态 */
}
```

或在 JS 中探测，再决定加载哪份样式表：

```js
if (CSS.supports('color: oklch(from red calc(l + 0.05) 0 h)')) {
  // 相对色可用——加载 v1.13+ 的 token 样式表
} else {
  // 低于基线：锁定 pre-OKLCH 版本，或自行提供回退
}
```

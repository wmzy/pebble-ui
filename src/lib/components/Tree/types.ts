import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

/**
 * Tree 节点数据接口
 */
export type TreeNodeData = {
  /** 节点唯一标识 */
  key: string;
  /** 节点标题 */
  title: ReactNode;
  /** 子节点 */
  children?: TreeNodeData[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可选中 */
  selectable?: boolean;
  /** 是否禁用复选框 */
  disableCheckbox?: boolean;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 是否叶子节点 */
  isLeaf?: boolean;
  /** 自定义数据 */
  [key: string]: unknown;
};

/**
 * 展开/选择/复选状态
 */
export type TreeState = {
  expandedKeys: string[];
  selectedKeys: string[];
  checkedKeys: string[];
  halfCheckedKeys: string[];
};

/**
 * Virtualized windowing metrics for `Tree.virtualized`.
 */
export type TreeVirtualizedConfig = {
  /** Scrollport height in px. Default `320`. */
  height?: number;
  /** Row height in px. Default `32` — the treeitem min-height (2rem). */
  itemHeight?: number;
  /**
   * Extra rows kept mounted above/below the visible window. Defaults to
   * `VirtualList`'s `5`.
   */
  overscan?: number;
};

/**
 * Tree 组件 Props
 */
export type TreeProps = {
  /** 树节点数据 */
  treeData: TreeNodeData[];
  /** 是否支持多选 */
  multiple?: boolean;
  /** 是否显示复选框 */
  checkable?: boolean;
  /** 是否完全受控复选（父子不关联） */
  checkStrictly?: boolean;
  /** 是否可选中 */
  selectable?: boolean;
  /** 是否禁用整棵树 */
  disabled?: boolean;
  /** 是否节点占据整行 */
  blockNode?: boolean;
  /** 是否显示连接线 */
  showLine?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 自定义展开/折叠图标 */
  switcherIcon?: ReactNode;
  /** 自定义加载图标 */
  loadingIcon?: ReactNode;
  /** 自定义节点标题渲染 */
  titleRender?: (node: TreeNodeData) => ReactNode;
  /** 自定义节点图标渲染 */
  iconRender?: (node: TreeNodeData) => ReactNode;
  /**
   * Render the tree through `VirtualList` so large trees mount only the
   * visible window (plus overscan) instead of the full DOM list: the
   * visible rows are flattened depth-first (depth indent preserved) and
   * windowed. `false`/omitted (default) keeps the plain nested DOM
   * path; an object additionally customizes row metrics.
   * `expandedKeys`/`selectedKeys`/`checkedKeys` semantics are identical
   * in both paths, and roving-tabindex keyboard navigation works the
   * same way — focus moves `scrollToIndex` the target row into the
   * window before focusing it.
   */
  virtualized?: boolean | TreeVirtualizedConfig;
  /**
   * Async child loading: called when a node **without** `children` and
   * without `isLeaf: true` is expanded (by click, keyboard, controlled
   * `expandedKeys`, or the auto-expanded ancestor path of a search hit).
   *
   * While the promise is pending the node's switcher shows the loading
   * spinner; resolved children are merged into an internal cache, so
   * collapsing and re-expanding does **not** request again. Cache entries
   * are dropped when the controlled `treeData` no longer maps onto them
   * (the key disappeared, or the node now ships children of its own —
   * controlled data always wins). An empty array marks the node as a
   * leaf. A rejected promise renders an inline "Load failed · Retry"
   * affordance on the node row; expanding a failed node again also
   * retries.
   */
  loadData?: (node: TreeNodeData) => Promise<TreeNodeData[]>;
  /**
   * Search filter: when non-empty, only nodes whose (string) title
   * matches case-insensitively — plus the ancestor path leading to
   * them — are rendered, ancestors auto-expanded so hits stay visible,
   * and every match is wrapped in a token-styled `<mark>`. `titleRender`
   * output is passed through untouched. When nothing matches, the
   * localized empty state is shown.
   */
  searchValue?: string;
  /**
   * Wraps one rendered treeitem row — called on both render paths
   * (recursive and virtualized) with the row element and its node.
   * Injection seam for drag-and-drop variants: the wrapper owns the
   * sortable node while the base tree stays free of any dnd runtime.
   * @internal
   */
  rowWrap?: (row: ReactNode, node: TreeNodeData) => ReactNode;
  /**
   * Disables the built-in tree keymap (arrows / Home / End / Enter /
   * Space). The roving tabindex itself is unaffected — only the key
   * handlers go quiet.
   * @internal — injected by `SortableTree` while a drag is active so
   * dnd-kit owns the keydown stream (Space lift/drop, arrows, Escape)
   * without the tree also moving focus or toggling selection and
   * checkboxes mid-drag.
   */
  keyboardNavigation?: boolean;
  /** （受控）展开的节点 */
  expandedKeys?: ControlOrValue<string[]>;
  /** （受控）选中的节点 */
  selectedKeys?: ControlOrValue<string[]>;
  /** （受控）复选的节点 */
  checkedKeys?: ControlOrValue<string[]>;
  /** 自定义类名 */
  className?: string;
  /** 展开/收起回调 */
  onExpand?: (
    expandedKeys: string[],
    info: { expanded: boolean; node: TreeNodeData }
  ) => void;
  /** 选中回调 */
  onSelect?: (
    selectedKeys: string[],
    info: {
      selected: boolean;
      selectedNodes: TreeNodeData[];
      node: TreeNodeData;
    }
  ) => void;
  /** 复选回调 */
  onCheck?: (
    checkedKeys: string[] | { checked: string[]; halfChecked: string[] },
    info: {
      checked: boolean;
      checkedNodes: TreeNodeData[];
      node: TreeNodeData;
      halfCheckedKeys: string[];
    }
  ) => void;
};

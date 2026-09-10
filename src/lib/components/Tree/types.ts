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

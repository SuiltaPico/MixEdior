import { Node } from "./Node";
import { NodeHandlerMap, NodeManager } from "./NodeManager";

/** 获取节点路径 */
export async function get_node_path(
  node_manager: NodeManager<NodeHandlerMap<any>, any>,
  node: Node
) {
  let result: number[] = [];
  let current_child = node;
  let current: Node | undefined = node_manager.get_parent(node);
  while (current) {
    const index = await node_manager.execute_handler(
      "get_index_of_child",
      current,
      current_child
    );
    result.push(index ?? 0);
    current_child = current;
    current = node_manager.get_parent(current);
  }
  return result.reverse();
}

/** 获取节点路径和祖先节点（不包含自身） */
export async function get_node_path_and_ancestors(
  node_manager: NodeManager<NodeHandlerMap<any>, any>,
  node: Node
) {
  let path: number[] = [];
  let ancestors: Node[] = [];
  let current_child = node;
  let current: Node | undefined = node_manager.get_parent(node);
  while (current) {
    const index = await node_manager.execute_handler(
      "get_index_of_child",
      current,
      current_child
    );
    path.push(index ?? 0);
    ancestors.push(current);
    current_child = current;
    current = node_manager.get_parent(current);
  }
  return { path: path.reverse(), ancestors: ancestors.reverse() };
}

/** 获取节点的公共祖先节点，和节点的路径 */
export async function get_common_ancestor_from_node(
  node_manager: NodeManager<NodeHandlerMap<any>, any>,
  node1: Node,
  node2: Node
) {
  let common_ancestor: Node | undefined;
  let ancestor_index_of_node1: number = -1;

  // 直接获取 node1 的路径
  const { path: path1, ancestors: ancestors1 } =
    await get_node_path_and_ancestors(node_manager, node1);

  // 获取 node2 的路径，直接在查找公共祖先节点的同时收集路径
  let path2: number[] = [];
  let ancestors2: Node[] = [];
  let current_child = node2;
  let current: Node | undefined = node_manager.get_parent(node2);
  while (current) {
    ancestors2.push(current);
    const index = await node_manager.execute_handler(
      "get_index_of_child",
      current,
      current_child
    );
    path2.push(index ?? 0);
    current_child = current;
    current = node_manager.get_parent(current);
    ancestor_index_of_node1 = ancestors1.indexOf(current!);
    if (ancestor_index_of_node1 !== -1) {
      common_ancestor = current;
      break;
    }
  }

  if (!common_ancestor) {
    return;
  }

  // 反转
  path2 = path2.reverse();
  ancestors2 = ancestors2.reverse();

  return {
    common_ancestor,
    path1,
    path2: path1.slice(0, ancestor_index_of_node1 + 1).concat(path2),
    ancestors1,
    ancestors2: ancestors1
      .slice(0, ancestor_index_of_node1 + 1)
      .concat(ancestors2),
    ancestor_index: ancestor_index_of_node1,
  };
}

/** 比较两个节点的路径的先后顺序。
 * * 如果 path1 在 path2 之前，返回 -1；
 * * 如果 path1 在 path2 之后，返回 1；
 * * 如果 path1 和 path2 相同，返回 0。
 */
export function path_compare(path1: number[], path2: number[]) {
  const len = Math.min(path1.length, path2.length);

  // 逐个比较每个位置的索引
  for (let i = 0; i < len; i++) {
    if (path1[i] < path2[i]) {
      return -1;
    }
    if (path1[i] > path2[i]) {
      return 1;
    }
  }

  // 如果前面的索引都相同，则比较路径长度
  if (path1.length < path2.length) {
    return -1;
  }
  if (path1.length > path2.length) {
    return 1;
  }

  // 完全相同的路径
  return 0;
}

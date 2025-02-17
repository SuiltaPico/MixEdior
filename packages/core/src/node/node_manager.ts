import { MaybePromise, UlidIdGenerator } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../MixEditor";
import { TransferDataObject } from "./tdo";
import { Node } from "./node";
import { NodeContext } from "./node_context";
import { CaretNavigateEnterDecision } from "../resp_chain/caret_navigate";
import { NavigateDirection } from "../common/navigate";
import { DeleteFromPointDecision } from "../resp_chain/delete_from_point";
import { DeleteRangeDecision } from "../resp_chain/delete_range";
import { ParametersExceptFirst } from "../common/type";
import { MergeNodeDecision } from "../resp_chain/merge_node";
import { Mark } from "./mark";

/** 节点处理器类型表。 */
export interface NodeHandlerMap<TNode extends Node = Node>
  extends ItemHandlerMap<MixEditor, TNode> {
  /** 获取子节点 */
  get_child(
    editor: MixEditor,
    node: TNode,
    index: number
  ): MaybePromise<Node | undefined>;
  /** 获取子节点数量 */
  get_children_count(editor: MixEditor, node: TNode): MaybePromise<number>;
  /** 获取子节点 */
  get_children(editor: MixEditor, node: TNode): MaybePromise<Node[]>;
  /** 获取子节点索引 */
  get_index_of_child(
    editor: MixEditor,
    node: TNode,
    child: TNode
  ): MaybePromise<number>;

  /** 获取节点标记 */
  get_marks(editor: MixEditor, node: TNode): MaybePromise<Mark[]>;
  /** 设置节点标记 */
  set_marks(editor: MixEditor, node: TNode, marks: Mark[]): MaybePromise<void>;

  /** 保存节点 */
  save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;

  /** 节点切片 */
  slice(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<TNode>;

  /** 插入子节点 */
  insert_children(
    editor: MixEditor,
    node: TNode,
    index: number,
    children: TransferDataObject[]
  ): MaybePromise<void>;

  /** 删除子节点 */
  delete_children(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<TransferDataObject[]>;

  // handle 开头的方法用于责任链决策

  /** 移动节点 */
  handle_caret_navigate(
    editor: MixEditor,
    node: TNode,
    /** 移动目标索引 */
    to: number,
    /** 移动方向 */
    direction: NavigateDirection,
    /** 移动来源 */
    from?: "child" | "parent"
  ): MaybePromise<CaretNavigateEnterDecision>;

  /** 从点删除 */
  handle_delete_from_point(
    editor: MixEditor,
    node: TNode,
    from: number,
    direction: NavigateDirection
  ): MaybePromise<DeleteFromPointDecision>;

  /** 删除范围 */
  handle_delete_range(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<DeleteRangeDecision>;

  /** 合并节点 */
  handle_merge_node(
    editor: MixEditor,
    node: TNode,
    /** 要合并的目标节点 */
    target: TNode
  ): MaybePromise<MergeNodeDecision>;
}

type NodeManagerHandlerManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> = HandlerManager<TNodeHandler, TNode, Node, MixEditor>;

/** 节点管理器 */
export class NodeManager<
  TNodeHandler extends NodeHandlerMap<any> = any,
  TNode extends Node = Node
> {
  /** 节点 ID 管理器 */
  private idgen = new UlidIdGenerator();
  /** 节点 ID 映射 */
  private id_node_map = new Map<string, Node>();
  /** 处理器管理器 */
  private handler_manager: NodeManagerHandlerManager<TNodeHandler, TNode>;
  /** 节点上下文 */
  private node_contexts = new WeakMap<Node, NodeContext>();

  register_handler!: NodeManagerHandlerManager<
    TNodeHandler,
    TNode
  >["register_handler"];
  register_handlers!: NodeManagerHandlerManager<
    TNodeHandler,
    TNode
  >["register_handlers"];
  get_handler!: NodeManagerHandlerManager<TNodeHandler, TNode>["get_handler"];
  execute_handler!: NodeManagerHandlerManager<
    TNodeHandler,
    TNode
  >["execute_handler"];

  /** 获取节点 ID */
  generate_id() {
    return this.idgen.next();
  }

  /** 创建节点 */
  create_node<TNodeFactory extends (id: string, ...args: any[]) => TNode>(
    node_factory: TNodeFactory,
    ...args: ParametersExceptFirst<TNodeFactory>
  ) {
    const node_id = this.idgen.next();
    const node = node_factory(node_id, ...args);
    this.id_node_map.set(node_id, node);
    return node;
  }

  /** 记录节点 */
  record_node(node: Node) {
    this.id_node_map.set(node.id, node);
  }

  /** 移除节点 */
  remove_node(node: Node) {
    this.id_node_map.delete(node.id);
  }

  /** 获取节点 ID */
  get_node_by_id(node_id: string) {
    return this.id_node_map.get(node_id);
  }

  /** 设置节点父节点 */
  set_parent(node: Node, parent: Node) {
    const context = this.node_contexts.get(node);
    if (context) {
      context.parent = parent;
    } else {
      this.node_contexts.set(node, new NodeContext(node, parent));
    }
  }

  /** 获取节点上下文 */
  get_context(node: Node) {
    const context = this.node_contexts.get(node);
    return context;
  }

  /** 获取节点父节点 */
  get_parent(node: Node) {
    const context = this.node_contexts.get(node);
    return context?.parent;
  }

  constructor(public editor: MixEditor) {
    this.handler_manager = new HandlerManager<
      TNodeHandler,
      TNode,
      Node,
      MixEditor
    >(this.editor);
    this.register_handlers = this.handler_manager.register_handlers.bind(
      this.handler_manager
    );
    this.register_handler = this.handler_manager.register_handler.bind(
      this.handler_manager
    );
    this.get_handler = this.handler_manager.get_handler.bind(
      this.handler_manager
    );
    this.execute_handler = this.handler_manager.execute_handler.bind(
      this.handler_manager
    );
  }
}

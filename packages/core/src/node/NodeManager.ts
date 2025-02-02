import { MaybePromise } from "@mixeditor/common";
import { HandlerManager, ItemHandlerMap } from "../common/HandlerManager";
import { MixEditor } from "../MixEditor";
import { TransferDataObject } from "../saver";
import { Node } from "./Node";
import { NodeContext } from "./NodeContext";
import { TagManager } from "./TagManager";

/** 节点处理器类型表。 */
export interface NodeHandlerMap<TNode extends Node = Node>
  extends ItemHandlerMap<MixEditor, TNode> {
  /** 获取子节点 */
  get_child(
    editor: MixEditor,
    node: TNode,
    index: number
  ): MaybePromise<TNode | undefined>;
  /** 获取子节点数量 */
  get_children_count(editor: MixEditor, node: TNode): MaybePromise<number>;
  /** 保存节点 */
  save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;
  /** 切片节点 */
  slice(
    editor: MixEditor,
    node: TNode,
    from: number,
    to: number
  ): MaybePromise<TNode>;
  /** 移动节点 */
  move_enter(
    editor: MixEditor,
    node: TNode,
    /** 移动目标索引 */
    to: number,
    /** 移动方向 */
    direction: "next" | "prev",
    /** 移动来源 */
    from?: "child" | "parent"
  ): MaybePromise<TNode>;
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
  /** 处理器管理器 */
  private handler_manager: NodeManagerHandlerManager<TNodeHandler, TNode>;
  /** 标签管理器 */
  private tag_manager = new TagManager<string>();
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

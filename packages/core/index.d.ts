// Generated by dts-bundle-generator v9.5.1

import { Accessor, Setter, createSignal as createSignal$1 } from 'solid-js';

interface Plugin$1<TContext = unknown, TExposed = any> {
	/** 插件唯一标识 */
	id: string;
	/** 初始化函数 */
	init: (ctx: TContext) => TExposed | Promise<TExposed>;
	/** 销毁函数 */
	dispose: () => void | Promise<void>;
}
/** 插件数据结构 */
export type PluginData<T> = {
	inited: boolean;
	plugin: T;
	pwr: PromiseWithResolvers<void>;
	exposed: any;
};
declare class PluginManager<TContext = unknown, TPlugin extends Plugin$1<TContext> = Plugin$1<TContext>> {
	private plugins;
	private state;
	/** 处理插件初始化成功 */
	private resolve_plugin_pwr;
	/** 处理插件初始化失败 */
	private reject_plugin_pwr;
	/** 注册插件 */
	register(plugin: TPlugin): void;
	/** 注销插件 */
	unregister(id: string): Promise<void>;
	/** 等待插件初始化完成 */
	wait_plugin_inited<TExposed>(id: string): Promise<TExposed>;
	/** 等待插件初始化完成 */
	wait_plugins_inited<TExposed extends any[]>(ids: string[]): Promise<TExposed>;
	/** 初始化所有已注册的插件 */
	init_plugins(context: TContext): Promise<{
		success: [
			PluginData<TPlugin>,
			any
		][];
		failed: any[];
	}>;
}
export type MaybePromise<T> = T | Promise<T>;
/** 事件。 */
interface Event$1 {
	/** 事件类型。 */
	event_type: string;
	/** 事件附带的上下文，可以用于传递数据。 */
	context?: Record<string, any> & {
		/** 事件处理的返回结果。 */
		result?: any;
	};
}
/** 事件。 */
export interface EventForEmit {
	/** 事件类型。 */
	event_type: string;
	/** 事件附带的上下文，可以用于传递数据。 */
	context: Record<string, any> & {
		/** 事件处理的返回结果。 */
		result?: any;
	};
}
export type EventToEventForEmit<TEvent extends Event$1> = Omit<TEvent, "context"> & {
	context: Exclude<TEvent["context"], undefined>;
};
/** 事件监听器。*/
export type EventHandler<TEvent extends Event$1 = any> = (props: {
	/** 事件。*/
	event: EventToEventForEmit<TEvent>;
	/** 等待依赖的处理器完成。*/
	wait_dependencies: () => Promise<any>;
}) => MaybePromise<void>;
/** 事件管理器。
 *
 * ## 监听器
 * 监听器之间的依赖关系构成一个有向无环图。
 */
export declare class EventManager<TEvent extends Event$1> {
	/** 监听器到监听器节点的映射。*/
	private handler_relation_map;
	/** 检查 `ancestor_handler` 是否是 `child_handler` 的祖先。*/
	private has_ancestor_handler;
	/** 添加监听器。*/
	add_handler<TEventType extends TEvent["event_type"]>(event_type: TEventType, handler: EventHandler<TEvent & {
		event_type: TEventType;
	}>, dependencies?: Iterable<EventHandler<TEvent>>): void;
	/** 移除监听器。*/
	remove_handler<TEventType extends TEvent["event_type"]>(event_type: TEventType, handler: EventHandler<TEvent & {
		event_type: TEventType;
	}>): void;
	/** 触发事件。*/
	emit(event: TEvent, options?: {
		/** 是否快速失败。
		 * 如果为 true，则一旦有处理器抛出错误，则立即向上传递错误。
		 * 如果为 false，则等待所有处理器执行完毕。
		 */
		fast_fail?: boolean;
	}): Promise<{
		context: (Record<string, any> & {
			/** 事件处理的返回结果。 */
			result?: any;
		}) | undefined;
	}>;
	constructor();
}
export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any ? R : never;
export type ParametersExceptFirst2<F> = F extends (arg0: any, arg1: any, ...rest: infer R) => any ? R : never;
export type MaybeNode = Node$1 | undefined;
interface Node$1 {
	type: string;
}
export declare class NodeContext {
	node: Node$1;
	constructor(node: Node$1);
}
export interface AllNodes {
	document: DocumentNode;
}
/** 传输数据对象。用于保存和传输数据。 */
export interface TransferDataObject {
	type: string;
}
export type AnyTDO = TransferDataObject & {
	[key: string]: any;
};
export interface Events {
	before_save: {
		event_type: "before_save";
	};
	save: {
		event_type: "save";
	};
	after_save: {
		event_type: "after_save";
		save_result: any;
	};
	before_load: {
		event_type: "before_load";
		tdo: DocumentTDO;
	};
	load: {
		event_type: "load";
		tdo: DocumentTDO;
	};
	after_load: {
		event_type: "after_load";
	};
}
export type Loader<T extends TransferDataObject = AnyTDO> = (tdo: T) => MaybePromise<Node$1>;
export declare class Saver {
	editor: MixEditor;
	serializer_map: Record<string, (tdo: TransferDataObject) => any>;
	deserializer_map: Record<string, (data: any) => TransferDataObject>;
	loader_map: Record<string, Loader>;
	/** 保存编辑器的文档为文档传输数据对象。 */
	save(): Promise<any>;
	/** 从文档传输数据对象加载文档，并应用到编辑器上。 */
	load(tdo: DocumentTDO): Promise<void>;
	/** 保存节点为传输数据对象。 */
	save_node_to_tdo(node: Node$1): Promise<TransferDataObject>;
	/** 从传输数据对象加载节点。 */
	load_node_from_tdo(tdo: TransferDataObject): Promise<Node$1>;
	/** 注册传输数据对象的序列化器。 */
	register_serializer(type: string, serializer: (tdo: TransferDataObject) => any): Promise<void>;
	/** 注册传输数据对象的反序列化器。 */
	register_deserializer(type: string, deserializer: (data: any) => TransferDataObject): Promise<void>;
	/** 注册节点加载器。 */
	register_loader<T extends TransferDataObject = AnyTDO>(type: string, loader: Loader<T>): Promise<void>;
	/** 序列化传输数据对象。 */
	serialize(type: string, tdo: TransferDataObject): Promise<any>;
	/** 反序列化传输数据对象。 */
	deserialize(type: string, data: any): Promise<TransferDataObject>;
	/** 保存文档为指定类型的数据。 */
	save_to(type: string): Promise<any>;
	/** 从指定类型的数据加载文档，并应用到编辑器上。 */
	load_from(type: string, data: any): Promise<void>;
	constructor(editor: MixEditor);
}
/** Node 属性操作行为接口 */
export interface NodeBehavior<TNode extends Node$1 = Node$1> {
	get_child(editor: MixEditor, node: TNode, index: number): MaybePromise<TNode | undefined>;
	get_children_count(editor: MixEditor, node: TNode): MaybePromise<number>;
	save(editor: MixEditor, node: TNode): MaybePromise<TransferDataObject>;
	clone(editor: MixEditor, node: TNode): MaybePromise<TNode>;
	slice(editor: MixEditor, node: TNode, from: number, to: number): MaybePromise<TNode>;
	handle_event(editor: MixEditor, node: TNode, event: any): MaybePromise<void>;
}
export type NodeOfNodeBehavior<TNodeBehavior extends NodeBehavior> = TNodeBehavior extends NodeBehavior<infer TNode> ? TNode : never;
/** Node 属性未找到错误 */
export declare class NodeManagerNoPropertyError extends Error {
	node_type: string;
	property_name: string;
	constructor(node_type: string, property_name: string);
}
export declare class NodeManager<TNodeBehavior extends NodeBehavior = NodeBehavior> {
	editor: MixEditor;
	private node_behaviors;
	private tag_manager;
	/** 设置节点属性行为 */
	register_behavior<TBehavior extends keyof TNodeBehavior>(node_type: string, property_name: TBehavior, behavior: TNodeBehavior[TBehavior]): void;
	/** 为所有节点注册行为 */
	register_behaviors<TNodeType extends NodeOfNodeBehavior<TNodeBehavior>["type"], TBehaviors extends {
		[key in keyof NodeBehavior<NodeOfNodeBehavior<TNodeBehavior> & {
			type: TNodeType;
		}>]?: NodeBehavior<NodeOfNodeBehavior<TNodeBehavior> & {
			type: TNodeType;
		}>[key];
	}>(node_type: TNodeType, behaviors: TBehaviors): void;
	/** 获取节点属性行为 */
	get_property<TBehavior extends keyof TNodeBehavior>(node_type: string, behavior_name: TBehavior): TNodeBehavior[TBehavior];
	execute_behavior<TBehavior extends keyof TNodeBehavior>(behavior_name: TBehavior, node: Node$1, ...args: ParametersExceptFirst2<TNodeBehavior[TBehavior]>): TNodeBehavior[TBehavior] extends (...args: any) => any ? ReturnType<TNodeBehavior[TBehavior]> : never;
	constructor(editor: MixEditor);
}
/** 操作。 */
export interface Operation<TData = any> {
	/** 操作的唯一标识。*/
	id: string;
	/** 操作的类型。*/
	type: string;
	/** 操作的数据。*/
	data: TData;
	/** 操作所基于的版本。*/
	version: number;
	/** 合并到哪个 Operation。*/
	merge_with?: string;
}
/** 操作的正在执行的行为。*/
export type OperationRunningBehavior = "execute" | "undo";
/** 操作行为接口，使用泛型确保数据类型一致性 */
export interface OperationBehavior<TData = any> {
	/** 执行操作。*/
	execute(operation: Operation<TData>): void | Promise<void>;
	/** 撤销操作。*/
	undo(operation: Operation<TData>): void | Promise<void>;
	/** 取消操作。*/
	cancel(operation: Operation<TData>, 
	/** 正在执行的操作行为。如果为空，则表示没有正在执行的行为。*/
	running_behavior?: OperationRunningBehavior): void | Promise<void>;
	merge?(operation: Operation<TData>): boolean | Promise<boolean>;
	/** 处理错误。处理 `execute` 或者 `undo` 产生的错误，恢复文档至正确的状态。 */
	handle_error(operation: Operation<TData>, error: Error): void | Promise<void>;
	/** 序列化操作。 */
	serialize?(operation: Operation<TData>): string | Promise<string>;
}
/** 操作行为未找到错误 */
export declare class OperationManagerNoBehaviorError extends Error {
	operation: Operation;
	constructor(operation: Operation);
}
/** 操作管理器。
 *
 * 管理操作的行为。允许通过更改第一个泛型参数，来扩展操作行为的具体类型。
 */
export declare class OperationManager<TOperationBehavior extends OperationBehavior = OperationBehavior> {
	/** 操作行为映射。*/
	private behaviors_map;
	/** 设置操作行为 */
	set_behavior<TBehavior extends keyof TOperationBehavior>(type: string, behavior_name: TBehavior, behavior: TOperationBehavior[TBehavior]): void;
	/** 移除操作行为 */
	remove_behavior<TBehavior extends keyof TOperationBehavior>(type: string, behavior_name: TBehavior): void;
	/** 获取操作行为 */
	get_behavior<TBehavior extends keyof TOperationBehavior>(type: string, behavior_name: TBehavior): TOperationBehavior[TBehavior];
	/** 执行操作。*/
	execute: <TData>(operation: Operation<TData>, ...args: ParametersExceptFirst<TOperationBehavior["execute"]>) => TOperationBehavior["execute"] extends (...args: any) => any ? ReturnType<TOperationBehavior["execute"]> : never;
	/** 撤销操作。*/
	undo: <TData>(operation: Operation<TData>, ...args: ParametersExceptFirst<TOperationBehavior["undo"]>) => TOperationBehavior["undo"] extends (...args: any) => any ? ReturnType<TOperationBehavior["undo"]> : never;
	/** 取消操作。*/
	cancel: <TData>(operation: Operation<TData>, ...args: ParametersExceptFirst<TOperationBehavior["cancel"]>) => TOperationBehavior["cancel"] extends (...args: any) => any ? ReturnType<TOperationBehavior["cancel"]> : never;
	/** 合并操作。*/
	merge<TData>(src: Operation<TData>, target: Operation<TData>): boolean | Promise<boolean>;
	/** 处理错误。*/
	handle_error: <TData>(operation: Operation<TData>, ...args: ParametersExceptFirst<TOperationBehavior["handle_error"]>) => TOperationBehavior["handle_error"] extends (...args: any) => any ? ReturnType<TOperationBehavior["handle_error"]> : never;
}
export type OperationType = "undo" | "execute";
export interface OperationExecution {
	operation: Operation;
	type: OperationType;
}
/** 操作的状态 */
export declare enum OperationState {
	/** 未完成 */
	Pending = 0,
	/** 执行中 */
	Executing = 1,
	/** 已完成 */
	Completed = 2
}
/** 操作历史管理器。
 * 操作历史管理器用于管理操作的历史，包括撤销和重做。操作历史管理器完全信任于操作的行为实现。
 *
 * 操作历史管理器是异步串行的，即在同一时间只能有一个操作在执行。
 *
 * ## 操作历史序列
 * 操作历史是一个序列，序列中的操作分为三种类型：
 * 1. 未完成的操作：未完成的操作是指已经进入执行队列但是尚未开始执行的操作。
 * 2. 正在执行的操作：正在执行的操作是指已经开始执行但是尚未结束的操作。
 * 3. 已完成的操作：已完成的操作是指已经执行完毕的操作。
 *
 * 在操作历史序列中，不可能存在两个同一个操作的执行。
 *
 * ## 操作合并
 * 设 Operation `A`、`B`，如果 `A` 先执行，且 `B.merge_with == A.id`，
 * 那么 `B` 在执行后，`B` 会被合并到 A 中，且 `B` 不会进入执行队列。
 *
 * ## 撤销和重做
 * 撤销会把当前操作从操作历史中移除，并把该操作压入撤销栈中。
 *
 * 撤销操作会根据操作的类型执行不同的额外行为：
 * * 如果撤销了未完成的操作，那么管理器只是将该操作从执行队列中移除。
 * * 如果撤销了正在执行的操作，那么管理器将执行操作的“取消行为”。
 * * 如果撤销了已完成的操作，那么管理器将执行操作的“撤销行为”。
 *
 * 如果在存在撤销栈的时候执行了新的操作，那么撤销栈就会被清空，然后再执行新的操作。
 *
 *
 * ## 错误处理
 * 如果操作执行失败，管理器会调用操作的“错误处理行为”。错误处理行为不能打断后续的调度流程。
 */
export declare class HistoryManager {
	readonly operation_manager: OperationManager;
	/** 操作历史缓冲区。 */
	private readonly history_buffer;
	/** 撤销栈。最大占用空间与操作历史缓冲区相同。 */
	private readonly undo_stack;
	/** 当前正在执行的操作。 */
	private current_execution;
	/** 待执行的操作。 */
	private pending_operations;
	/** 是否正在调度操作执行。 */
	private is_scheduling;
	/** 当前正在执行的操作的取消函数。 */
	private cancel_current_operation;
	/** 为 execute 提供在操作执行完毕、报错或者被取消后再返回的需求。 */
	private operation_done_promise_map;
	/** 获取操作的当前状态 */
	get_operation_state(operation: Operation): OperationState;
	/** 执行新操作。在操作执行完毕后返回。 */
	execute(operation: Operation): Promise<void>;
	/** 撤销操作 */
	undo(): Promise<void>;
	/** 重做操作 */
	redo(): Promise<void>;
	/** 调度操作执行 */
	private scheduleOperations;
	/** 清空操作历史
	 * 该方法会清空历史记录缓冲区和撤销栈。
	 * 如果有正在执行的操作，会等待其完成。
	 * 如果有待执行的操作，会取消它们。
	 */
	clear_history(): Promise<void>;
	constructor(operation_manager: OperationManager, initial_capacity?: number);
}
export type MixEditorPluginContext = {
	editor: MixEditor;
};
export type MixEditorPlugin = Plugin$1<MixEditorPluginContext>;
declare class WrappedSignal<T> {
	get: Accessor<T>;
	set: Setter<T>;
	constructor([get, set]: ReturnType<typeof createSignal$1<T>>);
}
/** 选择节点信息。 */
export type SelectedNodeInfo = {
	node: Node$1;
	/** 子区域路径。 */
	child_path: number;
};
/** 折叠选择。 */
export type CollapsedSelected = {
	type: "collapsed";
	start: SelectedNodeInfo;
};
/** 扩展选择。 */
export type ExtendedSelected = {
	type: "extended";
	start: SelectedNodeInfo;
	end: SelectedNodeInfo;
};
export type Selected = CollapsedSelected | ExtendedSelected;
/** 选择管理器。 */
declare class Selection$1 {
	editor: MixEditor;
	selected: WrappedSignal<Selected | undefined>;
	/** 折叠选择。 */
	collapsed_select(selected: SelectedNodeInfo): void;
	/** 扩展选择。 */
	extended_select(start: SelectedNodeInfo, end: SelectedNodeInfo): void;
	/** 扩展到指定位置。 */
	extend_to(position: SelectedNodeInfo): void;
	constructor(editor: MixEditor);
}
export interface Events {
	init: {
		event_type: "init";
	};
}
export declare class MixEditor {
	/** 操作管理器。 */
	operation_manager: OperationManager<OperationBehavior<any>>;
	/** 命令管理器。 */
	command_manager: HistoryManager;
	/** 文档节点管理器。 */
	node_manager: NodeManager<NodeBehavior<DocumentNode>>;
	/** 文档。 */
	document: WrappedSignal<DocumentNode>;
	/** 事件管理器。 */
	event_manager: EventManager<{
		event_type: "before_save";
	} | {
		event_type: "save";
	} | {
		event_type: "after_save";
		save_result: any;
	} | {
		event_type: "before_load";
		tdo: DocumentTDO;
	} | {
		event_type: "load";
		tdo: DocumentTDO;
	} | {
		event_type: "after_load";
	} | {
		event_type: "init";
	}>;
	/** 插件管理器。 */
	plugin_manager: PluginManager<MixEditorPluginContext, Plugin$1<MixEditorPluginContext, any>>;
	/** 文档选区管理。 */
	selection: Selection$1;
	/** 文档保存器。 */
	saver: Saver;
	/** 事件处理器。 */
	handlers: {
		save: ({ event, wait_dependencies }: Parameters<EventHandler>[0]) => Promise<void>;
	};
	init(): Promise<void>;
	constructor(config: {
		plugins: MixEditorPlugin[];
	});
}
/** 文档。 */
export declare class DocumentNode implements Node$1 {
	children: WrappedSignal<Node$1[]>;
	schema_version: number;
	created_at: Date;
	modified_at: Date;
	type: "document";
	/** 更新最后修改时间 */
	update(): void;
	constructor(children?: WrappedSignal<Node$1[]>, schema_version?: number, created_at?: Date, modified_at?: Date);
}
export interface DocumentTDO extends TransferDataObject {
	type: "document";
	schema_version: number;
	created_at: Date;
	modified_at: Date;
	children: AnyTDO[];
}
export declare function create_DocumentTDO(params: Partial<Omit<DocumentTDO, "type">>): DocumentTDO;
export declare function save_document(editor: MixEditor, document: DocumentNode): Promise<{
	type: "document";
	schema_version: number;
	created_at: Date;
	modified_at: Date;
	children: TransferDataObject[];
}>;
export interface Command {
	id: string;
	meta: {
		name: string;
	};
	/** 执行命令。*/
	execute(): void | Promise<void>;
	/** 撤销命令。*/
	undo(): void | Promise<void>;
}

export {
	Event$1 as Event,
	Node$1 as Node,
	Selection$1 as Selection,
};

export {};

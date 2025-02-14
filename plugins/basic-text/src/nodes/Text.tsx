import {
  BrowserViewPluginResult,
  get_caret_pos_from_point,
  NodeRenderer,
  PointerEventDecision,
  SelectedMaskDecision,
  WithMixEditorNode,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  CaretNavigateDirection,
  CaretNavigateEnterDecision,
  get_node_path,
  MixEditorPluginContext,
  Node,
  path_compare,
  TransferDataObject,
} from "@mixeditor/core";
import { onMount } from "solid-js";

declare module "@mixeditor/core" {
  interface AllNodes {
    text: TextNode;
  }
}

export interface TextNodeTDO extends TransferDataObject {
  type: "text";
  content: string;
}

export class TextNode implements Node {
  type = "text" as const;
  text: WrappedSignal<string>;
  constructor(public id: string, text: string) {
    this.text = createSignal(text);
  }
}

export const TextRenderer: NodeRenderer<TextNode> = (props) => {
  const { node, editor } = props;

  let container!: WithMixEditorNode<HTMLElement>;
  onMount(() => {
    container.mixed_node = node;
    const context = editor.node_manager.get_context(node);
    if (context) {
      context["bv:html_node"] = container;
    }
  });

  return (
    <span class="_text" ref={container}>
      {node.text.get()}
    </span>
  );
};

export function text() {
  return {
    id: "text",
    async init(ctx: MixEditorPluginContext) {
      const { editor } = ctx;
      const { node_manager, plugin_manager, saver, selection } = editor;
      const browser_view_plugin =
        await plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );
      const { renderer_manager, bv_selection } = browser_view_plugin;

      saver.register_loader<TextNodeTDO>("text", (tdo) => {
        return new TextNode(tdo.id, tdo.content);
      });

      node_manager.register_handlers("text", {
        save: (_, node) => {
          return {
            id: node.id,
            type: "text",
            content: node.text.get(),
          } satisfies TextNodeTDO;
        },

        get_children_count: (_, node) => {
          return node.text.get().length;
        },

        slice: (_, node, start, end) => {
          return new TextNode(
            node_manager.generate_id(),
            node.text.get().slice(start, end)
          );
        },

        caret_navigate_enter: (_, node, to, direction) => {
          const text = node.text.get();
          to += direction;
          if (to > text.length) {
            to = text.length;
          }
          const to_prev = direction === CaretNavigateDirection.Prev;

          if ((to_prev && to >= text.length) || (!to_prev && to <= 0)) {
            // 顺方向前边界进入
            return CaretNavigateEnterDecision.enter(
              to_prev ? text.length - 1 : 1
            );
          } else if ((to_prev && to <= 0) || (!to_prev && to >= text.length)) {
            // 顺方向后边界跳过
            return CaretNavigateEnterDecision.skip;
          } else {
            return CaretNavigateEnterDecision.enter(to);
          }
        },

        "bv:handle_delegated_pointer_down": (_, node, event, caret_pos) => {
          const html_node = node_manager.get_context(node)?.["bv:html_node"];
          // 应该是文本节点
          if (!html_node || caret_pos.node !== html_node.firstChild) return;

          const rect_index = caret_pos.offset;
          selection.collapsed_select({
            node,
            child_path: rect_index,
          });
          return;
        },

        "bv:handle_pointer_down": (_, node, element, event) => {
          event.context.bv_handled = true;
          const raw_event = event.raw;
          const result = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          )!;
          if (!result) return PointerEventDecision.none;
          editor.selection.collapsed_select({
            node,
            child_path: result.offset,
          });
          return PointerEventDecision.none;
        },

        "bv:handle_selected_mask": (_, node, from, to) => {
          const selection = editor.selection.get_selected();
          if (selection?.type === "collapsed") return SelectedMaskDecision.skip;

          const context = node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return SelectedMaskDecision.skip;

          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();
          const range = document.createRange();
          const text_node = html_node.firstChild;
          if (!text_node) return SelectedMaskDecision.skip;

          const adjusted_to = Math.min(node.text.get().length, to);
          range.setStart(text_node, from);
          range.setEnd(text_node, adjusted_to);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            return SelectedMaskDecision.render(
              Array.from(range_rects).map((rect) => ({
                x: rect.left - root_rect.left,
                y: rect.top - root_rect.top,
                width: rect.width,
                height: rect.height,
              }))
            );
          } else {
            return SelectedMaskDecision.skip;
          }
        },

        "bv:handle_pointer_move": async (_, node, element, event) => {
          const raw_event = event.raw;
          if (raw_event.buttons !== 1) return PointerEventDecision.none;
          // TODO：下面函数通过节流函数触发，确保最小采样率是 60fps

          // 获取选区
          const selected = editor.selection.get_selected();
          if (!selected) return PointerEventDecision.none;

          // 计算鼠标所在的字符索引
          const mouse_index = get_caret_pos_from_point(
            raw_event.clientX,
            raw_event.clientY
          )?.offset;
          if (!mouse_index) return PointerEventDecision.none;

          // 获取自己的路径和选区起始节点的路径
          const self_path = await get_node_path(editor.node_manager, node);

          // TODO：移动并不会影响节点树的变化，节点可以缓存自己的路径，甚至是比较结果。
          // TODO：因为节点变更会更新 update_count，只需要比对 update_count 即可判断要不要重新计算一次先后了。

          // 利用比较函数，计算鼠标位置相对于选区起始节点或者锚点位置在前还是后，
          // 然后根据比较结果，选择之前选区到新选区的转换模式。

          const new_selected_info = {
            node,
            child_path: mouse_index,
          };

          if (selected.type === "collapsed") {
            const start_path = await get_node_path(
              editor.node_manager,
              selected.start.node
            );

            let compare_result;
            if (selected.start.node === node) {
              compare_result = mouse_index - selected.start.child_path;
            } else {
              compare_result = path_compare(self_path, start_path);
            }

            if (compare_result < 0) {
              // 转换模式：
              // s c
              // s e
              editor.selection.extended_select(
                new_selected_info,
                selected.start,
                "end"
              );
            } else if (compare_result > 0) {
              // 转换模式：
              // s c
              // s e
              editor.selection.extended_select(
                selected.start,
                new_selected_info,
                "start"
              );
            }
          } else if (selected.type === "extended") {
            const anchor = selected["anchor"];
            const anchor_info = selected[anchor];
            const anchor_path = await get_node_path(
              editor.node_manager,
              anchor_info.node
            );

            let compare_result;
            if (anchor_info.node === node) {
              compare_result = mouse_index - anchor_info.child_path;
            } else {
              compare_result = path_compare(self_path, anchor_path);
            }

            if (compare_result < 0) {
              // 转换模式：
              // c a
              // s e
              editor.selection.extended_select(
                new_selected_info,
                anchor_info,
                "end"
              );
            } else if (compare_result > 0) {
              // 转换模式：
              // a c
              // s e
              editor.selection.extended_select(
                anchor_info,
                new_selected_info,
                "start"
              );
            }
          }

          return PointerEventDecision.none;
        },

        "bv:get_child_caret": (_, node, index) => {
          const context = editor.node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return undefined;
          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();

          const range = document.createRange();
          const text_node = html_node.firstChild;
          if (!text_node) throw new Error("文本节点的起始节点丢失。");

          if (index < node.text.get().length) {
            range.setStart(html_node.firstChild!, index);
          } else {
            range.setStart(html_node.firstChild!, index);
          }

          range.collapse(true);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            const caret_rect = range_rects[0];
            return {
              x: caret_rect.left - root_rect.left - 1,
              y: caret_rect.top - root_rect.top,
              height: caret_rect.height,
            };
          } else {
            // 处理没有rect的情况，比如文本为空
            // 使用html_node的位置作为默认
            const node_rect = html_node.getBoundingClientRect();
            return {
              x: node_rect.left - root_rect.left - 1,
              y: node_rect.top - root_rect.top,
              height: node_rect.height,
            };
          }
        },
      });

      // 注册渲染器
      renderer_manager.register("text", TextRenderer);
    },
    dispose() {},
  };
}

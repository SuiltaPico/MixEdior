import {
  BrowserViewPluginResult,
  NodeRenderer,
  PointerBehaviorResult,
  WithMixEditorNode,
  get_caret_pos_from_point,
} from "@mixeditor/browser-view";
import { createSignal, WrappedSignal } from "@mixeditor/common";
import {
  MixEditorPluginContext,
  Node,
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
  constructor(text: string) {
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
      const browser_view_plugin =
        await editor.plugin_manager.wait_plugin_inited<BrowserViewPluginResult>(
          "browser-view"
        );
      const { renderer_manager, bv_selection } = browser_view_plugin;

      editor.saver.register_loader<TextNodeTDO>("text", (tdo) => {
        return new TextNode(tdo.content);
      });

      editor.node_manager.register_handlers("text", {
        save: (_, node) => {
          return {
            type: "text",
            content: node.text.get(),
          } satisfies TextNodeTDO;
        },
        get_children_count: (_, node) => {
          return node.text.get().length;
        },
        slice: (_, node, start, end) => {
          return new TextNode(node.text.get().slice(start, end));
        },
        "bv:handle_pointer_down": (_, node, element, event) => {
          const result = get_caret_pos_from_point(
            event.clientX,
            event.clientY
          )!;
          if (!result) return PointerBehaviorResult.skip;
          const height = parseFloat(getComputedStyle(element).fontSize);
          editor.selection.collapsed_select({
            node,
            child_path: result.offset,
          });
          return PointerBehaviorResult.handled;
        },
        "bv:get_child_pos": (_, node, index) => {
          const context = editor.node_manager.get_context(node);
          const html_node = context?.["bv:html_node"];
          if (!html_node) return undefined;

          const root_rect =
            renderer_manager.editor_root.getBoundingClientRect();

          const range = document.createRange();
          const textNode = html_node.firstChild;
          if (!textNode) throw new Error("文本节点的起始节点丢失。");

          if (index < node.text.get().length) {
            range.setStart(html_node.firstChild!, index);
            // range.setEnd(html_node.firstChild!, index + 1);
          } else {
            range.setStart(html_node.firstChild!, index);
            // range.setEnd(html_node.firstChild!, index);
          }

          range.collapse(true);

          const range_rects = range.getClientRects();
          if (range_rects.length > 0) {
            const caret_rect = range_rects[0];
            bv_selection.start_caret.height.set(caret_rect.height);
            return {
              x: caret_rect.left - root_rect.left - 1,
              y: caret_rect.top - root_rect.top,
            };
          } else {
            // 处理没有rect的情况，比如文本为空
            // 使用html_node的位置作为默认
            const node_rect = html_node.getBoundingClientRect();
            bv_selection.start_caret.height.set(node_rect.height);
            return {
              x: node_rect.left - root_rect.left - 1,
              y: node_rect.top - root_rect.top,
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

import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const DRAG_HANDLE_KEY = new PluginKey("dragHandle");

export const DragHandle = Extension.create({
  name: "dragHandle",

  addProseMirrorPlugins() {
    let handle: HTMLElement | null = null;
    let overlay: HTMLElement | null = null;
    let placeholder: HTMLElement | null = null;
    let currentBlockPos = -1;
    let dragSourcePos = -1;
    let dragSourceHeight = 0;
    let isDragging = false;
    let blocksInfo: Array<{ pos: number; end: number; top: number; height: number; dom: HTMLElement }> = [];

    function getTopBlocks(view: EditorView) {
      const blocks: typeof blocksInfo = [];
      const doc = view.state.doc;
      doc.forEach((node, offset) => {
        const dom = view.nodeDOM(offset);
        if (dom && dom instanceof HTMLElement) {
          const rect = dom.getBoundingClientRect();
          blocks.push({
            pos: offset,
            end: offset + node.nodeSize,
            top: rect.top,
            height: rect.height,
            dom,
          });
        }
      });
      return blocks;
    }

    function getBlockAtY(view: EditorView, clientY: number): { pos: number; dom: HTMLElement } | null {
      const doc = view.state.doc;
      let found: { pos: number; dom: HTMLElement } | null = null;
      doc.forEach((node, offset) => {
        if (found) return;
        const dom = view.nodeDOM(offset);
        if (dom && dom instanceof HTMLElement) {
          const rect = dom.getBoundingClientRect();
          if (clientY >= rect.top && clientY <= rect.bottom) {
            found = { pos: offset, dom };
          }
        }
      });
      return found;
    }

    function createHandle(editorDom: HTMLElement) {
      const el = document.createElement("div");
      el.className = "drag-handle";
      el.innerHTML = "⋮";

      const wrapper = editorDom.parentElement;
      if (wrapper) {
        wrapper.style.position = "relative";
        wrapper.appendChild(el);
      }
      return el;
    }

    function positionHandle(view: EditorView, blockPos: number) {
      if (!handle) return;
      const dom = view.nodeDOM(blockPos);
      if (!dom || !(dom instanceof HTMLElement)) return;

      const editorRect = view.dom.getBoundingClientRect();
      const blockRect = dom.getBoundingClientRect();
      const top = blockRect.top - editorRect.top + view.dom.offsetTop;
      handle.style.top = `${top + 4}px`;
      handle.classList.add("visible");
    }

    function hideHandle() {
      if (handle) handle.classList.remove("visible");
      currentBlockPos = -1;
    }

    function createOverlay(sourceDom: HTMLElement) {
      const el = document.createElement("div");
      el.className = "drag-overlay";
      el.innerHTML = sourceDom.innerHTML;

      // Copy computed styles for realistic preview
      const cs = getComputedStyle(sourceDom);
      el.style.width = `${sourceDom.offsetWidth}px`;
      el.style.padding = cs.padding;
      el.style.fontSize = cs.fontSize;
      el.style.lineHeight = cs.lineHeight;
      el.style.fontFamily = cs.fontFamily;
      el.style.fontWeight = cs.fontWeight;

      document.body.appendChild(el);
      return el;
    }

    function createPlaceholder(height: number) {
      const el = document.createElement("div");
      el.className = "drag-placeholder";
      el.style.height = `${height}px`;
      return el;
    }

    function getDropIndex(clientY: number): number {
      for (let i = 0; i < blocksInfo.length; i++) {
        const block = blocksInfo[i];
        const mid = block.top + block.height / 2;
        if (clientY < mid) return i;
      }
      return blocksInfo.length;
    }

    function startDrag(view: EditorView, e: MouseEvent) {
      const block = getBlockAtY(view, e.clientY);
      if (!block) return;

      isDragging = true;
      dragSourcePos = block.pos;
      const node = view.state.doc.nodeAt(dragSourcePos);
      if (!node) { isDragging = false; return; }

      const sourceDom = block.dom;
      dragSourceHeight = sourceDom.offsetHeight;

      // Gather block info
      blocksInfo = getTopBlocks(view);

      // Create floating overlay clone
      overlay = createOverlay(sourceDom);
      const rect = sourceDom.getBoundingClientRect();
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;

      // Create placeholder in place of source
      placeholder = createPlaceholder(dragSourceHeight);
      sourceDom.parentElement?.insertBefore(placeholder, sourceDom);

      // Hide the source block
      sourceDom.style.display = "none";

      // Hide handle during drag
      if (handle) handle.classList.remove("visible");

      // Add body class
      document.body.classList.add("block-dragging");

      // Set up transitions on other blocks
      blocksInfo.forEach((b) => {
        if (b.pos !== dragSourcePos) {
          b.dom.style.transition = "transform 0.2s ease";
        }
      });
    }

    function moveDrag(view: EditorView, e: MouseEvent) {
      if (!isDragging || !overlay || !placeholder) return;

      // Move the overlay with the cursor
      overlay.style.top = `${e.clientY - dragSourceHeight / 2}px`;

      // Calculate which position we'd drop into
      const dropIdx = getDropIndex(e.clientY);

      // Move placeholder to the right position
      const editorDom = view.dom;
      const children = Array.from(editorDom.children).filter(
        (c) => c !== placeholder && (c as HTMLElement).style.display !== "none"
      );

      if (dropIdx >= children.length) {
        editorDom.appendChild(placeholder);
      } else {
        editorDom.insertBefore(placeholder, children[dropIdx]);
      }
    }

    function endDrag(view: EditorView, e: MouseEvent) {
      if (!isDragging) return;
      isDragging = false;

      // Clean up visual elements
      if (overlay) {
        overlay.remove();
        overlay = null;
      }

      // Restore source block visibility
      const sourceDom = view.nodeDOM(dragSourcePos);
      if (sourceDom instanceof HTMLElement) {
        sourceDom.style.display = "";
      }

      // Remove placeholder
      if (placeholder) {
        placeholder.remove();
        placeholder = null;
      }

      // Remove transitions
      blocksInfo.forEach((b) => {
        b.dom.style.transition = "";
        b.dom.style.transform = "";
      });

      document.body.classList.remove("block-dragging");

      // Perform the actual move in ProseMirror
      const dropIdx = getDropIndex(e.clientY);
      const sourceNode = view.state.doc.nodeAt(dragSourcePos);
      if (!sourceNode) return;

      // Find the source block index
      let sourceIdx = -1;
      const doc = view.state.doc;
      let idx = 0;
      doc.forEach((_node, offset) => {
        if (offset === dragSourcePos) sourceIdx = idx;
        idx++;
      });

      if (sourceIdx === -1) return;

      // Calculate adjusted drop index (accounting for source removal)
      let targetIdx = dropIdx;
      if (targetIdx === sourceIdx || targetIdx === sourceIdx + 1) return; // No-op

      // Calculate positions for the transaction
      const sourceEnd = dragSourcePos + sourceNode.nodeSize;
      let insertPos: number;

      if (targetIdx > sourceIdx) {
        // Moving down: adjust for the removal of source
        targetIdx -= 1;
      }

      // Find insertion position by index
      let currentIdx = 0;
      let resolvedInsertPos = 0;
      doc.forEach((node, offset) => {
        if (currentIdx === targetIdx && currentIdx !== sourceIdx) {
          resolvedInsertPos = offset;
        }
        currentIdx++;
      });

      // If target is at the end
      if (targetIdx >= idx - 1 && targetIdx !== sourceIdx) {
        resolvedInsertPos = doc.content.size;
      }

      // Perform transaction
      const tr = view.state.tr;
      const nodeContent = sourceNode.copy(sourceNode.content);

      if (resolvedInsertPos > dragSourcePos) {
        tr.delete(dragSourcePos, sourceEnd);
        const adjusted = resolvedInsertPos - sourceNode.nodeSize;
        tr.insert(adjusted, nodeContent);
      } else {
        tr.insert(resolvedInsertPos, nodeContent);
        tr.delete(dragSourcePos + sourceNode.nodeSize, sourceEnd + sourceNode.nodeSize);
      }

      view.dispatch(tr);
      dragSourcePos = -1;
    }

    return [
      new Plugin({
        key: DRAG_HANDLE_KEY,
        view(view) {
          handle = createHandle(view.dom);

          const onMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            startDrag(view, e);

            const onMouseMove = (ev: MouseEvent) => {
              moveDrag(view, ev);
            };
            const onMouseUp = (ev: MouseEvent) => {
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
              endDrag(view, ev);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          };

          handle.addEventListener("mousedown", onMouseDown);

          return {
            update() {},
            destroy() {
              if (handle) {
                handle.removeEventListener("mousedown", onMouseDown);
                if (handle.parentElement) handle.parentElement.removeChild(handle);
              }
              handle = null;
            },
          };
        },
        props: {
          handleDOMEvents: {
            mousemove(view, event) {
              if (isDragging) return false;
              const block = getBlockAtY(view, event.clientY);
              if (!block) {
                hideHandle();
                return false;
              }
              if (block.pos === currentBlockPos) return false;
              currentBlockPos = block.pos;
              positionHandle(view, block.pos);
              return false;
            },
            mouseleave() {
              if (!isDragging) hideHandle();
              return false;
            },
          },
        },
      }),
    ];
  },
});

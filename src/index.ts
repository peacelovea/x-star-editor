export type { ToolbarItem } from './components/Toolbar';
export { createSelection, getRange } from './utils/container';
export {
  batchHandler,
  insertHandler,
  mutateHandler,
  redoHandler,
  selectHandler,
  setHandler,
  toggleHandler,
  undoHandler,
} from './utils/handler';
export type { Executor, Handler, KeyboardEventHandler } from './utils/handler';
export { toHTML, toMarkdown, toText } from './utils/markdown';
export { default as XStarEditor, useEditorRef } from './x-star-editor';
export type { XStarEditorHandle, XStarEditorProps } from './x-star-editor';
export { default as XStarMdEditor, useMdEditorRef } from './x-star-md-editor';
export type {
  XStarMdEditorHandle,
  XStarMdEditorPlugin,
  XStarMdEditorProps,
} from './x-star-md-editor';
export { default as XStarMdViewer, useMdViewerRef } from './x-star-md-viewer';
export type {
  XStarMdViewerHandle,
  XStarMdViewerPlugin,
  XStarMdViewerProps,
} from './x-star-md-viewer';

import { SelectionContainerProps } from './components/SelectionContainer';
import { useSelectionContainer } from './hooks/useSelectionContainer';
import { boxesIntersect } from './utils/boxes';
import { Point, Box, SelectionBox, OnSelectionChange, SelectionContainerRef } from './utils/types';

export type { Point, Box, SelectionBox, OnSelectionChange, SelectionContainerRef, SelectionContainerProps };

export { useSelectionContainer, boxesIntersect };


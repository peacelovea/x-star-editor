import classNames from 'classnames';
import type { Components } from 'hast-util-to-jsx-runtime';
import React, {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import workerRaw from '../../workers-dist/markdown.worker.js';
import { containerRefContext } from '../context/containerRefContext';
import { prefix } from '../utils/global';
import { composeHandlers } from '../utils/handler';
import type { Schema } from '../utils/markdown';
import {
  getDefaultSchema,
  postViewerRender,
  preViewerRender,
} from '../utils/markdown';

let worker: Worker;

export interface ViewerOptions {
  /**
   * 自定义过滤模式
   */
  customSchema: Schema;

  /**
   * 自定义 HTML 元素
   */
  customHTMLElements: Partial<Components>;

  /**
   * 自定义块
   */
  customBlocks: Partial<
    Record<string, React.ComponentType<{ children: string }>>
  >;
}

export interface XStarMdViewerPlugin {
  (ctx: ViewerOptions): void;
}

export interface XStarMdViewerHandle {
  getViewerContainer: () => HTMLDivElement;
}

export interface XStarMdViewerProps {
  /**
   * CSS 类名
   */
  className?: string;

  /**
   * CSS 样式
   */
  style?: React.CSSProperties;

  /**
   * 查看器的高度
   */
  height?: React.CSSProperties['height'];

  /**
   * 内置主题
   */
  theme?: string;

  /**
   * 文本
   */
  value?: string;

  /**
   * 插件
   */
  plugins?: XStarMdViewerPlugin[];

  /**
   * viewer是否可编辑
   */
  canContentEditable?: boolean;
}

const XStarMdViewer = React.forwardRef<XStarMdViewerHandle, XStarMdViewerProps>(
  (
    {
      className,
      style,
      height,
      theme,
      value = '',
      plugins,
      canContentEditable = false,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { editorRef } = useContext(containerRefContext);

    useImperativeHandle(
      ref,
      () => ({ getViewerContainer: () => containerRef.current! }),
      [],
    );

    const options = useMemo(
      () =>
        // plugins 是一个数组，里面是一些函数
        composeHandlers(plugins)({
          customSchema: getDefaultSchema(),
          customHTMLElements: {},
          customBlocks: {},
        }),
      [plugins],
    );

    const optionsLatest = useRef(options);
    optionsLatest.current = options;

    const [children, setChildren] = useState<React.JSX.Element>();

    const id = useMemo(
      () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      [],
    );

    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const anchorOffset = selection?.anchorOffset;

    useEffect(() => {
      if (!worker) {
        worker = new Worker(
          URL.createObjectURL(
            new Blob([workerRaw], { type: 'text/javascript' }),
          ),
        );
      }

      const listener = ({ data }: MessageEvent) => {
        if (data.id === id) {
          setChildren(
            postViewerRender(
              data.root,
              optionsLatest.current,
              canContentEditable,
            ),
          );
        }
      };

      worker.addEventListener('message', listener);
      return () => worker.removeEventListener('message', listener);
    }, []);

    useEffect(() => {
      let timer: ReturnType<typeof setTimeout> | number;
      if (!editorRef?.current?.getIsViewerChangeCode()) {
        timer = window.setTimeout(
          async () =>
            worker.postMessage({
              id,
              root: await preViewerRender(value),
              schema: options.customSchema,
            }),
          100,
        );
      }
      return () => window.clearTimeout(timer);
    }, [value, options]);

    // 确保在末尾输入时能同步滚动
    useEffect(() => {
      if (
        anchorNode &&
        anchorOffset &&
        anchorNode.nodeType === Node.TEXT_NODE &&
        editorRef?.current?.getIsViewerChangeCode() &&
        canContentEditable
      ) {
        // 确保 anchorOffset 不超过 anchorNode 的长度
        const validOffset = Math.min(
          anchorOffset,
          anchorNode.textContent?.length || 0,
        );
        selection.setPosition(anchorNode, validOffset);
      }

      const timer = window.setTimeout(
        () => containerRef.current?.dispatchEvent(new Event('render')),
        100,
      );
      return () => window.clearTimeout(timer);
    }, [children]);

    return (
      <div
        key={new Date().valueOf()}
        ref={containerRef}
        className={classNames(
          `${prefix}-md-viewer`,
          { [`${prefix}-theme-${theme}`]: theme },
          className,
        )}
        style={{ ...style, height }}
      >
        {children}
      </div>
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  XStarMdViewer.displayName = 'XStarMdViewer';
}

export default XStarMdViewer;

export const useMdViewerRef = () => useRef<XStarMdViewerHandle>(null);

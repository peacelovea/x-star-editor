import classNames from 'classnames';
// import html2canvas from 'html2canvas';
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
//  import SignaturePad, { PointGroup } from 'signature_pad';
import { ViewerOptions } from 'x-star-editor/x-star-md-viewer/index.js';
import workerRaw from '../../workers-dist/markdown.worker.js';
// import SvgDelete from '../icons/Delete';
// import SvgEnterFullscreen from '../icons/EnterFullscreen';
// import SvgHelp from '../icons/Help';
// import SvgRedo from '../icons/Redo';
// import SvgStrong from '../icons/Strong';
// import SvgUndo from '../icons/Undo';
// import SvgViewOnly from '../icons/ViewOnly';
import { prefix } from '../utils/global';
import { composeHandlers } from '../utils/handler';
import {
  getDefaultSchema,
  postViewerRender,
  preViewerRender,
} from '../utils/markdown';
// import { getScaleNumber } from '../utils/slide';

let worker: Worker;

export interface XStarSlideViewerPlugin {
  (ctx: ViewerOptions): void;
}

export interface XStarSlideViewerHandle {
  getViewerContainer: () => HTMLDivElement;
  getSlideContainer: () => HTMLDivElement;
}

export interface XStarSlideViewerProps {
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
   * 内部 Slide 容器 CSS 类名
   */
  slideClassName?: string;

  /**
   * 文本
   */
  value?: string;

  /**
   * 插件
   */
  plugins?: XStarSlideViewerPlugin[];

  /**
   * 画板初始数据
   */
  // padInitialValue?: any;

  /**
   * 画板改变回调函数
   */
  // onPadChange?: (value: any) => void;
}

// enum OperationType {
//   NONE,
//   STROKE,
//   ERASE,
// }

// export type CanvasData = {
//   points: PointGroup[];
//   scale: number;
// };

const XStarSlideViewer = React.forwardRef<
  XStarSlideViewerHandle,
  XStarSlideViewerProps
>(
  (
    {
      className,
      style,
      height,
      theme,
      slideClassName,
      value = '',
      plugins,
      // padInitialValue,
      // onPadChange,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const childRef = useRef<HTMLDivElement>(null);
    // const canvasRef = useRef<HTMLCanvasElement>(null);
    // const signaturePadRef = useRef<SignaturePad | null>(null);
    // const historyRef = useRef<CanvasData[]>([]); // 保存清除历史
    // const currentShowIndex = useRef<number>(-1);
    // const pathBeginScale = useRef(1);
    // const [operationType, setOperationType] = useState(OperationType.NONE);
    // const [strokeColor, setStrokeColor] = useState('#4285f4');
    // const [strokeWidth, setStrokeWidth] = useState(5);
    // const [eraseWidth, setEraseWidth] = useState(5);
    // const [, { toggleFullscreen }] = useFullscreen(containerRef);
    // const MAX_STEP = 100; // 最大保存历史记录数

    // useEffect(() => {
    //   if (canvasRef.current) {
    //     signaturePadRef.current = new SignaturePad(canvasRef.current, {
    //       penColor: '#4285f4',
    //     });
    //     if (padInitialValue) {
    //       signaturePadRef.current.fromData(padInitialValue);
    //     }
    //     signaturePadRef.current.addEventListener('beginStroke', () => {
    //       if (!childRef.current) return;
    //       pathBeginScale.current = getScaleNumber(
    //         childRef.current.style.transform,
    //       );
    //     });
    //     signaturePadRef.current.addEventListener('endStroke', () => {
    //       if (!childRef.current) return;
    //       if (currentShowIndex.current < historyRef.current.length - 1) {
    //         //小于说明发生过撤销，并且触发了endStroke（动过画布）, 就不支持恢复
    //         historyRef.current.splice(currentShowIndex.current + 1);
    //       }
    //       if (historyRef.current.length > MAX_STEP) {
    //         historyRef.current.shift();
    //       } else {
    //         currentShowIndex.current++;
    //       }
    //       historyRef.current.push(
    //         JSON.parse(
    //           JSON.stringify({
    //             points: signaturePadRef.current!.toData(),
    //             scale: getScaleNumber(childRef.current.style.transform),
    //           }),
    //         ),
    //       );
    //       onPadChange?.(signaturePadRef.current?.toData());
    //     });
    //   }
    // }, []);

    useImperativeHandle(
      ref,
      () => ({
        getViewerContainer: () => containerRef.current!,
        getSlideContainer: () => childRef.current!,
      }),
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
          setChildren(postViewerRender(data.root, optionsLatest.current));
        }
      };

      worker.addEventListener('message', listener);
      return () => worker.removeEventListener('message', listener);
    }, []);

    useEffect(() => {
      const timer = window.setTimeout(
        async () =>
          worker.postMessage({
            id,
            root: await preViewerRender(value),
            schema: options.customSchema,
          }),
        100,
      );
      return () => window.clearTimeout(timer);
    }, [value, options]);

    // 确保在末尾输入时能同步滚动
    useEffect(() => {
      const timer = window.setTimeout(
        () => containerRef.current?.dispatchEvent(new Event('render')),
        100,
      );
      return () => window.clearTimeout(timer);
    }, [children]);

    // useEffect(() => {
    //   if (canvasRef.current) {
    //     if (operationType !== OperationType.NONE) {
    //       canvasRef.current.style.pointerEvents = 'auto';
    //     } else {
    //       canvasRef.current.style.pointerEvents = 'none';
    //     }
    //   }
    // }, [operationType]);

    const handleScale = (entries: ResizeObserverEntry[]) => {
      // 处理尺寸变化后的scale
      if (
        !containerRef.current ||
        // !canvasRef.current ||
        !childRef.current
        // || !signaturePadRef.current
      ) {
        return;
      }
      const parentWidth = entries[0].contentRect.width; // 获取父容器的宽度
      // const pointData = signaturePadRef.current.toData();
      // const ratio = Math.max(window.devicePixelRatio || 1, 1);
      childRef.current.style.transform = `scale(${parentWidth / 960})`;
      // canvasRef.current.width = parentWidth * ratio;
      // canvasRef.current.height = parentWidth * (9 / 16) * ratio;
      // pointData.forEach(({ points }) =>
      //   points.forEach((point) => {
      //     point.x = (point.x / pathBeginScale.current) * (parentWidth / 960);
      //     point.y = (point.y / pathBeginScale.current) * (parentWidth / 960);
      //   }),
      // );
      // signaturePadRef.current.fromData(pointData);
      // pathBeginScale.current = getScaleNumber(childRef.current.style.transform);
    };

    const resizeObserver = new ResizeObserver((entries) =>
      requestAnimationFrame(() => handleScale(entries)),
    );

    useEffect(() => {
      // 容器尺寸监听
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      }
    }, []);

    // const handleStokeChange = (base: number, offset: number) => {
    //   // 处理stroke大小变化
    //   if (!signaturePadRef.current) return;
    //   signaturePadRef.current.minWidth = base + offset;
    //   signaturePadRef.current.maxWidth = base;
    // };

    // useEffect(() => {
    //   // 编辑模式切换
    //   if (operationType === OperationType.STROKE) {
    //     signaturePadRef.current!.penColor = strokeColor;
    //     handleStokeChange(strokeWidth, -2);
    //   } else if (operationType === OperationType.ERASE) {
    //     handleStokeChange(eraseWidth, 0);
    //   }
    // }, [strokeColor, strokeWidth, eraseWidth, operationType]);

    // const handleUndo = () => {
    //   // 撤销函数
    //   if (!signaturePadRef.current || !childRef.current) return;
    //   if (currentShowIndex.current > 0) {
    //     currentShowIndex.current--;
    //     const data = computeScaledPoint(
    //       historyRef.current[currentShowIndex.current],
    //       containerRef.current?.clientWidth || 960,
    //     );
    //     signaturePadRef.current.fromData(data);
    //   } else {
    //     // currentShowIndex为0清空画布
    //     signaturePadRef.current.clear();
    //   }
    // };

    // const handleRedo = () => {
    //   // 恢复函数
    //   if (!signaturePadRef.current || !childRef.current) return;
    //   if (currentShowIndex.current < historyRef.current.length - 1) {
    //     currentShowIndex.current++;
    //     const data = computeScaledPoint(
    //       historyRef.current[currentShowIndex.current],
    //       containerRef.current?.clientWidth || 960,
    //     );
    //     signaturePadRef.current.fromData(data);
    //   }
    // };

    // useEventListener('keydown', (event) => {
    //   if (
    //     (event.ctrlKey || event.metaKey) &&
    //     (event.key === 'z' || event.key === 'Z')
    //   ) {
    //     event.preventDefault(); // 阻止默认的撤销行为（如浏览器返回）
    //     handleUndo();
    //   }
    // });

    // useEventListener('keydown', (event) => {
    //   if (
    //     (event.ctrlKey || event.metaKey) &&
    //     (event.key === 'y' || event.key === 'Y')
    //   ) {
    //     event.preventDefault(); // 阻止默认的恢复行为（如浏览器返回）
    //     handleRedo();
    //   }
    // });

    // const handleClear = () => {
    //   if (!signaturePadRef.current || !childRef.current) return;
    //   if (currentShowIndex.current < historyRef.current.length - 1) {
    //     //小于说明发生过撤销，并且触发了endStroke（动过画布）, 就不支持恢复
    //     historyRef.current.splice(currentShowIndex.current + 1);
    //   }
    //   signaturePadRef.current.clear(); // 清空画布
    //   if (historyRef.current.length > MAX_STEP) {
    //     historyRef.current.shift();
    //   } else {
    //     currentShowIndex.current++;
    //   }
    //   historyRef.current.push(
    //     JSON.parse(
    //       JSON.stringify({
    //         points: signaturePadRef.current!.toData(),
    //         scale: 1,
    //       }),
    //     ),
    //   );
    // };

    // const handleScreenShot = async () => {
    //   const canvas = await html2canvas(childRef.current!, {
    //     ignoreElements: (e) => e.classList.contains('btn-container'),
    //   });
    //   const a = document.createElement('a');
    //   a.href = canvas.toDataURL('image/png');
    //   a.download = 'slide.png';
    //   a.click();
    // };

    // const handleSwitchToErase = () => {
    //   if (!signaturePadRef.current) return;
    //   if (operationType !== OperationType.ERASE) {
    //     signaturePadRef.current.compositeOperation = 'destination-out';
    //     setOperationType(OperationType.ERASE);
    //   } else {
    //     setOperationType(OperationType.NONE);
    //   }
    // };

    // const handleSwitchToDraw = () => {
    //   if (!signaturePadRef.current) return;
    //   if (operationType !== OperationType.STROKE) {
    //     signaturePadRef.current.compositeOperation = 'source-over';
    //     setOperationType(OperationType.STROKE);
    //   } else {
    //     setOperationType(OperationType.NONE);
    //   }
    // };

    return (
      <div
        id="container"
        ref={containerRef}
        className={classNames(
          `${prefix}-slide-viewer`,
          { [`${prefix}-theme-${theme}`]: theme },
          className,
        )}
        style={{ ...style, height }}
      >
        <div
          ref={childRef}
          className={classNames(`${prefix}-slide`, slideClassName)}
        >
          {children}
          {/* <canvas
            ref={canvasRef}
            className={classNames(
              'pad',
              {
                [`custom-cursor-pencil`]:
                  operationType === OperationType.STROKE,
              },
              {
                [`custom-cursor-eraser`]: operationType === OperationType.ERASE,
              },
            )}
            width={960}
            height={540}
          /> */}
        </div>

        {/* <div className={classNames('btn-container')}>
          <span className={classNames('common-btn')} onClick={toggleFullscreen}>
            <SvgEnterFullscreen />
          </span>
          <span
            className={classNames('common-btn', 'shot')}
            onClick={handleScreenShot}
          >
            <SvgHelp />
          </span>
          <div>
            <span
              className={classNames('common-btn', 'draw')}
              style={{
                backgroundColor:
                  operationType === OperationType.STROKE
                    ? 'rgb(66, 133, 244)'
                    : '',
              }}
              onClick={handleSwitchToDraw}
            >
              <SvgStrong />
            </span>
            <div className={classNames('popover', 'draw-popover')}>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                }}
              />
              <input
                type="range"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={(e) => {
                  setStrokeWidth(Number(e.target.value));
                }}
              />
            </div>
          </div>
          <div>
            <span
              className={classNames('common-btn', 'erase')}
              style={{
                backgroundColor:
                  operationType === OperationType.ERASE
                    ? 'rgb(66, 133, 244)'
                    : '',
              }}
              onClick={handleSwitchToErase}
            >
              <SvgViewOnly />
            </span>
            <div className={classNames('popover', 'erase-popover')}>
              <input
                type="range"
                min={5}
                max={50}
                value={eraseWidth}
                onChange={(e) => {
                  setEraseWidth(Number(e.target.value));
                }}
              />
            </div>
          </div>
          <span
            className={classNames('common-btn', 'clear')}
            onClick={handleClear}
          >
            <SvgDelete />
          </span>
          <span
            className={classNames('common-btn', 'undo')}
            onClick={handleRedo}
          >
            <SvgRedo />
          </span>
          <span
            className={classNames('common-btn', 'undo')}
            onClick={handleUndo}
          >
            <SvgUndo />
          </span>
        </div> */}
      </div>
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  XStarSlideViewer.displayName = 'XStarSlideViewer';
}

export default XStarSlideViewer;

export const useSlideViewerRef = () => useRef<XStarSlideViewerHandle>(null);
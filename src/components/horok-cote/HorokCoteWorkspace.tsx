"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileCode2,
  Sparkles,
} from "lucide-react";
import type {
  CSSProperties,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import HorokChat from "@/components/chat/HorokChat";
import HorokCoteIDE from "@/components/horok-cote/HorokCoteIDE";
import type { HorokCoteProblem } from "@/lib/horok-cote";
import { cn } from "@/lib/utils";

type HorokCoteWorkspaceProps = {
  problem: HorokCoteProblem;
};

type DragState = {
  firstPanelIndex: number;
  secondPanelIndex: number;
  isDesktop: boolean;
  startDesktopSizes: number[];
  startMobileSizes: number[];
  startPointer: number;
};

const DESKTOP_BREAKPOINT = "(min-width: 1280px)";
const DESKTOP_DEFAULT_SIZES = [0.3, 0.4, 0.3];
const MOBILE_DEFAULT_SIZES = [0.34, 0.33, 0.33];
const DESKTOP_PANEL_MIN_SIZE = 320;
const MOBILE_PANEL_MIN_SIZE = 220;
const COLLAPSED_PANEL_SIZE = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function findLargestOpenPanelIndex(sizes: number[], excludedIndex: number) {
  return sizes
    .map((size, index) => ({ size, index }))
    .filter(({ index, size }) => index !== excludedIndex && size > 0)
    .sort((left, right) => right.size - left.size)[0]?.index;
}

export default function HorokCoteWorkspace({
  problem,
}: HorokCoteWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [containerMainSize, setContainerMainSize] = useState(0);
  const [desktopSizes, setDesktopSizes] = useState(DESKTOP_DEFAULT_SIZES);
  const [mobileSizes, setMobileSizes] = useState(MOBILE_DEFAULT_SIZES);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    const updateLayoutMode = () => setIsDesktop(mediaQuery.matches);

    updateLayoutMode();
    mediaQuery.addEventListener("change", updateLayoutMode);

    return () => mediaQuery.removeEventListener("change", updateLayoutMode);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateContainerSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerMainSize(isDesktop ? rect.width : rect.height);
    };

    updateContainerSize();

    const observer = new ResizeObserver(updateContainerSize);
    observer.observe(container);
    window.addEventListener("resize", updateContainerSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateContainerSize);
    };
  }, [isDesktop]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      const container = containerRef.current;

      if (!dragState || !container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const containerSize = dragState.isDesktop ? rect.width : rect.height;

      if (containerSize <= 0) {
        return;
      }

      const currentPointer = dragState.isDesktop
        ? event.clientX
        : event.clientY;
      const deltaRatio =
        (currentPointer - dragState.startPointer) / containerSize;
      const sizes = dragState.isDesktop
        ? dragState.startDesktopSizes
        : dragState.startMobileSizes;
      const minimumPanelSize = dragState.isDesktop
        ? DESKTOP_PANEL_MIN_SIZE
        : MOBILE_PANEL_MIN_SIZE;
      const minSizeRatio =
        containerSize > 0
          ? Math.min(minimumPanelSize / containerSize, 0.45)
          : 0;
      const pairTotal =
        sizes[dragState.firstPanelIndex] + sizes[dragState.secondPanelIndex];
      const nextCurrentSize = clamp(
        sizes[dragState.firstPanelIndex] + deltaRatio,
        minSizeRatio,
        pairTotal - minSizeRatio,
      );
      const nextAdjacentSize = pairTotal - nextCurrentSize;
      const nextSizes = [...sizes];
      nextSizes[dragState.firstPanelIndex] = nextCurrentSize;
      nextSizes[dragState.secondPanelIndex] = nextAdjacentSize;

      if (dragState.isDesktop) {
        setDesktopSizes(nextSizes);
      } else {
        setMobileSizes(nextSizes);
      }
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  function handleResizeStart(
    index: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();

    const sizes = isDesktop ? desktopSizes : mobileSizes;
    const isMiddleCollapsed = sizes[1] <= 0;
    const pair =
      index === 1 && isMiddleCollapsed ? ([0, 2] as const) : ([index, index + 1] as const);

    dragStateRef.current = {
      firstPanelIndex: pair[0],
      secondPanelIndex: pair[1],
      isDesktop,
      startDesktopSizes: desktopSizes,
      startMobileSizes: mobileSizes,
      startPointer: isDesktop ? event.clientX : event.clientY,
    };
    setIsDragging(true);
  }

  function handleTogglePanel(panelIndex: number) {
    const sizes = isDesktop ? desktopSizes : mobileSizes;
    const nextSizes = [...sizes];
    const panelSize = nextSizes[panelIndex];

    if (panelSize > 0) {
      const recipientIndex = findLargestOpenPanelIndex(nextSizes, panelIndex);

      if (recipientIndex === undefined) {
        return;
      }

      nextSizes[panelIndex] = 0;
      nextSizes[recipientIndex] += panelSize;
    } else {
      const defaultSizes = isDesktop
        ? DESKTOP_DEFAULT_SIZES
        : MOBILE_DEFAULT_SIZES;
      const donorIndex = findLargestOpenPanelIndex(nextSizes, panelIndex);

      if (donorIndex === undefined) {
        return;
      }

      const donorSize = nextSizes[donorIndex];

      const minSizeRatio =
        containerMainSize > 0
          ? Math.min(minimumPanelSize / containerMainSize, 0.45)
          : 0;
      const availableSize = donorSize - minSizeRatio;

      if (availableSize <= 0) {
        return;
      }

      const restoredSize = Math.max(
        minSizeRatio,
        Math.min(defaultSizes[panelIndex], availableSize),
      );

      nextSizes[panelIndex] = restoredSize;
      nextSizes[donorIndex] -= restoredSize;
    }

    if (isDesktop) {
      setDesktopSizes(nextSizes);
      return;
    }

    setMobileSizes(nextSizes);
  }

  const sizes = isDesktop ? desktopSizes : mobileSizes;
  const minimumPanelSize = isDesktop
    ? DESKTOP_PANEL_MIN_SIZE
    : MOBILE_PANEL_MIN_SIZE;
  const panelMinSize =
    containerMainSize > 0
      ? Math.min(minimumPanelSize, containerMainSize * 0.45)
      : minimumPanelSize;
  const collapsedPanels = sizes.map((size) => size <= 0);

  return (
    <div
      ref={containerRef}
      className={cn(
        "mt-5 flex min-h-0 flex-1",
        isDesktop
          ? "flex-row items-stretch"
          : "scrollbar-hide flex-col overflow-y-auto overscroll-contain pr-1",
        isDragging && "select-none",
      )}
    >
      <WorkspacePanel
        style={{
          flex: collapsedPanels[0]
            ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
            : `${sizes[0]} 1 0%`,
          minWidth: isDesktop
            ? collapsedPanels[0]
              ? `${COLLAPSED_PANEL_SIZE}px`
              : `${panelMinSize}px`
            : "0px",
          minHeight:
            !isDesktop
              ? collapsedPanels[0]
                ? `${COLLAPSED_PANEL_SIZE}px`
                : `${panelMinSize}px`
              : "0px",
          background: collapsedPanels[0] ? "transparent" : undefined,
          borderWidth: collapsedPanels[0] ? 0 : undefined,
          borderRadius: collapsedPanels[0] ? 0 : undefined,
        }}
        className={cn(
          "scrollbar-hide overflow-x-hidden overflow-y-auto rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]",
          collapsedPanels[0] &&
            "overflow-hidden rounded-none border-transparent bg-transparent p-0",
        )}
        isCollapsed={collapsedPanels[0]}
        closeButton={
          <PanelCloseButton
            isDesktop={isDesktop}
            isCollapsed={collapsedPanels[0]}
            onClick={() => handleTogglePanel(0)}
          />
        }
      >
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <FileCode2 className="size-4" />
            문제 설명
          </div>
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-[15px]">
            {problem.prompt}
          </p>
        </div>

        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              제한사항
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {problem.constraints.map((constraint) => (
                <li key={constraint}>- {constraint}</li>
              ))}
            </ul>
          </article>

          <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  입력
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {problem.inputDescription.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  출력
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {problem.outputDescription.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </div>

        <div className="min-w-0 mt-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Sparkles className="size-4" />
            예제
          </div>
          {problem.examples.map((example, index) => (
            <article
              key={`${problem.slug}-${index + 1}`}
              className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  예제 {index + 1}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  입력 / 출력
                </p>
              </div>
              <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    입력
                  </p>
                  <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-slate-700 dark:text-slate-300">
                    {example.input}
                  </pre>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    출력
                  </p>
                  <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 text-slate-700 dark:text-slate-300">
                    {example.output}
                  </pre>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {example.explanation}
              </p>
            </article>
          ))}
        </div>
      </WorkspacePanel>

      {!collapsedPanels[0] && !collapsedPanels[1] ? (
        <ResizeHandle
          isDesktop={isDesktop}
          onPointerDown={(event) => handleResizeStart(0, event)}
        />
      ) : null}

      <WorkspacePanel
        style={{
          flex: collapsedPanels[1]
            ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
            : `${sizes[1]} 1 0%`,
          minWidth: isDesktop
            ? collapsedPanels[1]
              ? `${COLLAPSED_PANEL_SIZE}px`
              : `${panelMinSize}px`
            : "0px",
          minHeight:
            !isDesktop
              ? collapsedPanels[1]
                ? `${COLLAPSED_PANEL_SIZE}px`
                : `${panelMinSize}px`
              : "0px",
        }}
        isCollapsed={collapsedPanels[1]}
        closeButton={
          <PanelCloseButton
            isDesktop={isDesktop}
            isCollapsed={collapsedPanels[1]}
            onClick={() => handleTogglePanel(1)}
          />
        }
      >
        <HorokCoteIDE problem={problem} />
      </WorkspacePanel>

      {!collapsedPanels[2] ? (
        <ResizeHandle
          isDesktop={isDesktop}
          onPointerDown={(event) => handleResizeStart(1, event)}
        />
      ) : null}

      <WorkspacePanel
        style={{
          flex: collapsedPanels[2]
            ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
            : `${sizes[2]} 1 0%`,
          minWidth: isDesktop
            ? collapsedPanels[2]
              ? `${COLLAPSED_PANEL_SIZE}px`
              : `${panelMinSize}px`
            : "0px",
          minHeight:
            !isDesktop
              ? collapsedPanels[2]
                ? `${COLLAPSED_PANEL_SIZE}px`
                : `${panelMinSize}px`
              : "0px",
        }}
        isCollapsed={collapsedPanels[2]}
        closeButton={
          <PanelCloseButton
            isDesktop={isDesktop}
            isCollapsed={collapsedPanels[2]}
            onClick={() => handleTogglePanel(2)}
            placement="opposite"
          />
        }
      >
        <HorokChat variant="embedded" />
      </WorkspacePanel>
    </div>
  );
}

function WorkspacePanel({
  children,
  className,
  closeButton,
  isCollapsed = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  closeButton?: ReactNode;
  isCollapsed?: boolean;
  style: CSSProperties;
}) {
  return (
    <div className={cn("relative min-h-0 min-w-0", className)} style={style}>
      {closeButton}
      {!isCollapsed ? children : null}
    </div>
  );
}

function PanelCloseButton({
  isDesktop,
  isCollapsed,
  onClick,
  placement = "default",
}: {
  isDesktop: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  placement?: "default" | "opposite";
}) {
  const isOpposite = placement === "opposite";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute z-20 flex items-center justify-center border border-slate-200 bg-white/95 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur-sm transition hover:border-[#06923E]/45 hover:bg-[#eef7f1] hover:text-[#06923E] dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:border-[#46c86f]/50 dark:hover:bg-[#06923E]/10 dark:hover:text-[#46c86f]",
        isDesktop
          ? isOpposite
            ? "right-0 top-1/2 h-16 w-4 -translate-y-1/2 border-r-0"
            : "left-0 top-1/2 h-16 w-4 -translate-y-1/2 border-l-0"
          : isOpposite
            ? "bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 border-b-0"
            : "left-1/2 top-0 h-4 w-16 -translate-x-1/2 border-t-0",
      )}
      aria-label="패널 닫기"
    >
      {isDesktop ? (
        isOpposite ? (
          isCollapsed ? (
            <ChevronLeft className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )
        ) : (
          isCollapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronLeft className="size-3" />
          )
        )
      ) : (
        isOpposite ? (
          isCollapsed ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )
        ) : (
          isCollapsed ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronUp className="size-3" />
          )
        )
      )}
    </button>
  );
}

function ResizeHandle({
  isDesktop,
  onPointerDown,
}: {
  isDesktop: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      className={cn(
        "group relative shrink-0 touch-none rounded-full border border-slate-200 bg-white/85 backdrop-blur-sm transition hover:border-[#06923E]/45 hover:bg-[#eef7f1] dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-[#06923E]/50 dark:hover:bg-slate-800",
        isDesktop
          ? "mx-2 my-auto h-24 w-3 cursor-ew-resize"
          : "mx-auto my-2 h-3 w-24 cursor-ns-resize",
      )}
      aria-label={isDesktop ? "패널 너비 조절" : "패널 높이 조절"}
    >
      <span
        className={cn(
          "absolute inset-1 rounded-full bg-slate-300/90 transition group-hover:bg-[#06923E] dark:bg-slate-600 dark:group-hover:bg-[#46c86f]",
          isDesktop ? "w-[2px]" : "h-[2px]",
        )}
      />
      <span
        className={cn(
          "absolute rounded-full bg-slate-300/70 transition group-hover:bg-[#06923E]/80 dark:bg-slate-500 dark:group-hover:bg-[#46c86f]/85",
          isDesktop
            ? "left-1/2 top-1/2 h-9 w-[2px] -translate-x-1/2 -translate-y-1/2"
            : "left-1/2 top-1/2 h-[2px] w-9 -translate-x-1/2 -translate-y-1/2",
        )}
      />
    </button>
  );
}

"use client";

import { AlarmClock, Eye, EyeOff } from "lucide-react";
import type {
  CSSProperties,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import HorokChat from "@/components/chat/HorokChat";
import HorokCoteIDE from "@/components/horok-cote/HorokCoteIDE";
import type { HorokCoteProblem } from "@/lib/horok-cote-shared";
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

type TabletResizeState = {
  pageIndex: number;
  startPointer: number;
  startFirstPanelRatio: number;
  viewportWidth: number;
};

type PanelId = "problem" | "ide" | "chat";

type PanelDropTarget =
  | {
      type: "panel";
      panelId: PanelId;
      insertAfterTarget: boolean;
    }
  | {
      type: "hide";
    };

type MobileSwipeState = {
  pageIndex: number;
  startX: number;
  startY: number;
};

const DESKTOP_BREAKPOINT = "(min-width: 1280px)";
const TABLET_BREAKPOINT = "(min-width: 768px)";
const DESKTOP_DEFAULT_SIZES = [0.3, 0.4, 0.3];
const MOBILE_DEFAULT_SIZES = [0.34, 0.33, 0.33];
const DESKTOP_PANEL_MIN_SIZE = 320;
const MOBILE_PANEL_MIN_SIZE = 220;
const COLLAPSED_PANEL_SIZE = 0;
const DEFAULT_PANEL_ORDER: PanelId[] = ["problem", "ide", "chat"];
const MOBILE_SWIPE_THRESHOLD = 36;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function findLargestOpenPanelIndex(sizes: number[], excludedIndex: number) {
  return sizes
    .map((size, index) => ({ size, index }))
    .filter(({ index, size }) => index !== excludedIndex && size > 0)
    .sort((left, right) => right.size - left.size)[0]?.index;
}

function isPanelId(value: string | undefined): value is PanelId {
  return value === "problem" || value === "ide" || value === "chat";
}

function movePanelOrder(
  order: PanelId[],
  sourcePanelId: PanelId,
  targetPanelId: PanelId,
  insertAfterTarget: boolean,
) {
  if (sourcePanelId === targetPanelId) {
    return order;
  }

  const nextOrder = order.filter((panelId) => panelId !== sourcePanelId);
  const targetIndex = nextOrder.indexOf(targetPanelId);

  if (targetIndex < 0) {
    return order;
  }

  nextOrder.splice(targetIndex + (insertAfterTarget ? 1 : 0), 0, sourcePanelId);
  return nextOrder;
}

function getMobilePageCount(panelSizes: number[], isTablet: boolean) {
  const visiblePanelCount = Math.max(
    1,
    panelSizes.filter((size) => size > 0).length,
  );

  if (!isTablet) {
    return visiblePanelCount;
  }

  return visiblePanelCount <= 2 ? 1 : 2;
}

function renderInlineCode(text: string) {
  let searchStartIndex = 0;

  return text.split(/(`[^`]+`)/g).map((segment) => {
    const isCode = segment.startsWith("`") && segment.endsWith("`");
    const segmentStartIndex = text.indexOf(segment, searchStartIndex);
    const key = `${segment}-${segmentStartIndex}`;

    searchStartIndex =
      segmentStartIndex >= 0
        ? segmentStartIndex + segment.length
        : searchStartIndex + segment.length;

    if (!isCode) {
      return <span key={key}>{segment}</span>;
    }

    return (
      <code
        key={key}
        className="rounded-md bg-orange-100 px-1.5 py-0.5 font-mono text-[0.9em] text-orange-900 dark:bg-orange-300/85 dark:text-orange-950"
      >
        {segment.slice(1, -1)}
      </code>
    );
  });
}

export default function HorokCoteWorkspace({
  problem,
}: HorokCoteWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mobileViewportRef = useRef<HTMLDivElement | null>(null);
  const activeMobilePageRef = useRef(0);
  const mobileSwipeStateRef = useRef<MobileSwipeState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const tabletResizeStateRef = useRef<TabletResizeState | null>(null);
  const movingPanelRef = useRef<PanelId | null>(null);
  const movingPanelPreviewRef = useRef<HTMLElement | null>(null);
  const movingPanelOffsetRef = useRef({ x: 0, y: 0 });
  const panelOrderRef = useRef<PanelId[]>(DEFAULT_PANEL_ORDER);
  const hiddenPanelCountRef = useRef(0);
  const togglePanelRef = useRef<(panelIndex: number) => void>(() => undefined);
  const timerStartedAtRef = useRef(Date.now());
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [containerMainSize, setContainerMainSize] = useState(0);
  const [desktopSizes, setDesktopSizes] = useState(DESKTOP_DEFAULT_SIZES);
  const [mobileSizes, setMobileSizes] = useState(MOBILE_DEFAULT_SIZES);
  const [tabletPageRatios, setTabletPageRatios] = useState([0.5, 0.5]);
  const [panelOrder, setPanelOrder] = useState<PanelId[]>(DEFAULT_PANEL_ORDER);
  const [movingPanelId, setMovingPanelId] = useState<PanelId | null>(null);
  const [panelDropTarget, setPanelDropTarget] =
    useState<PanelDropTarget | null>(null);
  const [activeMobilePage, setActiveMobilePage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTabletResizing, setIsTabletResizing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    activeMobilePageRef.current = activeMobilePage;
  }, [activeMobilePage]);

  const cleanupPanelPreview = useCallback(() => {
    movingPanelPreviewRef.current?.remove();
    movingPanelPreviewRef.current = null;
  }, []);

  const movePanelPreview = useCallback((pointerX: number, pointerY: number) => {
    const preview = movingPanelPreviewRef.current;

    if (!preview) {
      return;
    }

    preview.style.left = `${pointerX - movingPanelOffsetRef.current.x}px`;
    preview.style.top = `${pointerY - movingPanelOffsetRef.current.y}px`;
  }, []);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);
    const tabletMediaQuery = window.matchMedia(TABLET_BREAKPOINT);

    const updateLayoutMode = () => {
      setIsDesktop(desktopMediaQuery.matches);
      setIsTablet(tabletMediaQuery.matches && !desktopMediaQuery.matches);
    };

    updateLayoutMode();
    desktopMediaQuery.addEventListener("change", updateLayoutMode);
    tabletMediaQuery.addEventListener("change", updateLayoutMode);

    return () => {
      desktopMediaQuery.removeEventListener("change", updateLayoutMode);
      tabletMediaQuery.removeEventListener("change", updateLayoutMode);
    };
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

  useEffect(() => {
    if (!isTabletResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = tabletResizeStateRef.current;

      if (!resizeState || resizeState.viewportWidth <= 0) {
        return;
      }

      const deltaRatio =
        (event.clientX - resizeState.startPointer) / resizeState.viewportWidth;

      setTabletPageRatios((currentRatios) =>
        currentRatios.map((ratio, index) =>
          index === resizeState.pageIndex
            ? clamp(resizeState.startFirstPanelRatio + deltaRatio, 0.35, 0.65)
            : ratio,
        ),
      );
    };

    const handlePointerUp = () => {
      tabletResizeStateRef.current = null;
      setIsTabletResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isTabletResizing]);

  useEffect(() => {
    if (!movingPanelId) {
      return;
    }

    const findDropTarget = (event: PointerEvent): PanelDropTarget | null => {
      const sourcePanelId = movingPanelRef.current;

      if (!sourcePanelId) {
        return null;
      }

      const pointedElement = document.elementFromPoint(
        event.clientX,
        event.clientY,
      );
      const hideTargetElement = pointedElement?.closest<HTMLElement>(
        "[data-panel-hide-target]",
      );

      if (hideTargetElement && hiddenPanelCountRef.current === 0) {
        return { type: "hide" };
      }

      const targetElement =
        pointedElement?.closest<HTMLElement>("[data-panel-id]");
      const targetPanelId = targetElement?.dataset.panelId;

      if (
        !targetElement ||
        !isPanelId(targetPanelId) ||
        targetPanelId === sourcePanelId
      ) {
        return null;
      }

      const targetRect = targetElement.getBoundingClientRect();

      return {
        type: "panel",
        panelId: targetPanelId,
        insertAfterTarget:
          event.clientX > targetRect.left + targetRect.width / 2,
      };
    };

    const updateDropTarget = (nextDropTarget: PanelDropTarget | null) => {
      setPanelDropTarget((currentDropTarget) => {
        if (
          currentDropTarget?.type === nextDropTarget?.type &&
          (currentDropTarget?.type !== "panel" ||
            nextDropTarget?.type !== "panel" ||
            (currentDropTarget.panelId === nextDropTarget.panelId &&
              currentDropTarget.insertAfterTarget ===
                nextDropTarget.insertAfterTarget))
        ) {
          return currentDropTarget;
        }

        return nextDropTarget;
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      movePanelPreview(event.clientX, event.clientY);
      updateDropTarget(findDropTarget(event));
    };

    const handlePointerUp = (event: PointerEvent) => {
      const sourcePanelId = movingPanelRef.current;
      const nextDropTarget = findDropTarget(event);
      movingPanelRef.current = null;
      setMovingPanelId(null);
      setPanelDropTarget(null);

      if (!sourcePanelId || !nextDropTarget) {
        cleanupPanelPreview();
        return;
      }

      if (nextDropTarget.type === "hide") {
        const sourcePanelIndex = panelOrderRef.current.indexOf(sourcePanelId);

        if (sourcePanelIndex >= 0) {
          togglePanelRef.current(sourcePanelIndex);
        }

        cleanupPanelPreview();
        return;
      }

      setPanelOrder((currentOrder) =>
        movePanelOrder(
          currentOrder,
          sourcePanelId,
          nextDropTarget.panelId,
          nextDropTarget.insertAfterTarget,
        ),
      );
      cleanupPanelPreview();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setPanelDropTarget(null);
      cleanupPanelPreview();
    };
  }, [movingPanelId, cleanupPanelPreview, movePanelPreview]);

  useEffect(() => {
    void problem.slug;
    timerStartedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setActiveMobilePage(0);
  }, [problem.slug]);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const updateElapsedSeconds = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - timerStartedAtRef.current) / 1000),
      );
    };

    updateElapsedSeconds();

    const interval = window.setInterval(updateElapsedSeconds, 1000);

    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  function handleProblemSolved() {
    if (!isTimerRunning) {
      return;
    }

    const solvedElapsedSeconds = Math.floor(
      (Date.now() - timerStartedAtRef.current) / 1000,
    );

    setElapsedSeconds(solvedElapsedSeconds);
    setIsTimerRunning(false);

    void fetch("/api/horok-cote/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problemSlug: problem.slug,
        problemNumber: problem.number,
        elapsedSeconds: solvedElapsedSeconds,
      }),
    }).catch(() => {
      return null;
    });
  }

  function formatElapsedTime(totalSeconds: number) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  function handleResizeStart(
    index: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();

    const sizes = isDesktop ? desktopSizes : mobileSizes;
    const isMiddleCollapsed = sizes[1] <= 0;
    const pair =
      index === 1 && isMiddleCollapsed
        ? ([0, 2] as const)
        : ([index, index + 1] as const);

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

  function handleTabletResizeStart(
    pageIndex: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const viewport = mobileViewportRef.current;

    if (!viewport) {
      return;
    }

    tabletResizeStateRef.current = {
      pageIndex,
      startPointer: event.clientX,
      startFirstPanelRatio: tabletPageRatios[pageIndex] ?? 0.5,
      viewportWidth: viewport.clientWidth,
    };
    setIsTabletResizing(true);
  }

  function handlePanelMoveStart(
    panelId: PanelId,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const panelElement =
      event.currentTarget.closest<HTMLElement>("[data-panel-id]");

    if (panelElement) {
      const rect = panelElement.getBoundingClientRect();
      const clone = panelElement.cloneNode(true) as HTMLElement;

      cleanupPanelPreview();
      movingPanelOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      clone.removeAttribute("data-panel-id");
      clone.style.position = "fixed";
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.margin = "0";
      clone.style.zIndex = "9999";
      clone.style.pointerEvents = "none";
      clone.style.opacity = "0.88";
      clone.style.boxShadow = "0 24px 70px rgba(15, 23, 42, 0.24)";
      clone.style.cursor = "grabbing";
      clone.style.userSelect = "none";
      clone.setAttribute("aria-hidden", "true");

      document.body.appendChild(clone);
      movingPanelPreviewRef.current = clone;
      movePanelPreview(event.clientX, event.clientY);
    }

    movingPanelRef.current = panelId;
    setPanelDropTarget(null);
    setMovingPanelId(panelId);
  }

  function handleTogglePanel(panelIndex: number) {
    const sizes = isDesktop ? desktopSizes : mobileSizes;
    const nextSizes = [...sizes];
    const panelSize = nextSizes[panelIndex];

    if (panelSize > 0) {
      const hasHiddenPanel = nextSizes.some(
        (size, index) => index !== panelIndex && size <= 0,
      );

      if (hasHiddenPanel) {
        return;
      }

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

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    const mobilePageCount = getMobilePageCount(mobileSizes, isTablet);
    const maxScrollIndex = mobilePageCount - 1;
    const nextPageIndex = Math.round(
      clamp(activeMobilePageRef.current, 0, maxScrollIndex),
    );
    activeMobilePageRef.current = nextPageIndex;
    setActiveMobilePage(nextPageIndex);
  }, [isDesktop, isTablet, mobileSizes]);

  const sizes = isDesktop ? desktopSizes : mobileSizes;
  const minimumPanelSize = isDesktop
    ? DESKTOP_PANEL_MIN_SIZE
    : MOBILE_PANEL_MIN_SIZE;
  const panelMinSize =
    containerMainSize > 0
      ? Math.min(minimumPanelSize, containerMainSize * 0.45)
      : minimumPanelSize;
  const collapsedPanels = sizes.map((size) => size <= 0);
  const hiddenPanelCount = collapsedPanels.filter(Boolean).length;

  useEffect(() => {
    panelOrderRef.current = panelOrder;
    hiddenPanelCountRef.current = hiddenPanelCount;
    togglePanelRef.current = handleTogglePanel;
  });

  const problemPanelContent = (
    <div className="flex h-full min-h-0 flex-col">
      <section className="min-h-0 flex-1 overflow-y-auto pb-5">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-bold text-slate-700 dark:text-slate-200 sm:text-lg">
              문제 설명
            </div>
            <div className="flex shrink-0 items-center gap-1.5 font-mono text-sm font-semibold text-slate-500 dark:text-slate-400 sm:text-base">
              <AlarmClock className="size-4" />
              {formatElapsedTime(elapsedSeconds)}
            </div>
          </div>
          <p className="text-[15px] leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
            {renderInlineCode(problem.prompt)}
          </p>
        </div>
      </section>

      <section className="scrollbar-hide min-h-0 flex-1 overflow-y-auto border-t border-slate-200 pt-5 dark:border-slate-800">
        <div className="min-w-0 space-y-3">
          <div className="text-base font-bold text-slate-700 dark:text-slate-200 sm:text-lg">
            예제
          </div>
          {problem.examples.map((example, index) => (
            <div
              key={`${problem.slug}-${index + 1}`}
              className="grid min-w-0 gap-3 sm:grid-cols-2"
            >
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  입력 {index + 1}
                </p>
                <pre className="scrollbar-hide mt-2 overflow-x-auto font-mono text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {example.input}
                </pre>
              </div>
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  출력 {index + 1}
                </p>
                <pre className="scrollbar-hide mt-2 overflow-x-auto font-mono text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {example.output}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
  const panelDefinitions = {
    problem: { id: "problem", label: "문제", content: problemPanelContent },
    ide: {
      id: "ide",
      label: "IDE",
      content: (
        <HorokCoteIDE problem={problem} onSolved={handleProblemSolved} />
      ),
    },
    chat: {
      id: "chat",
      label: "채팅",
      content: <HorokChat variant="embedded" problem={problem} />,
    },
  } satisfies Record<
    PanelId,
    { id: PanelId; label: string; content: ReactNode }
  >;
  const mobilePanels = panelOrder.map((panelId) => panelDefinitions[panelId]);
  const mobilePageCount = getMobilePageCount(mobileSizes, isTablet);
  const hiddenPanelIndex = collapsedPanels.findIndex(Boolean);
  const hiddenPanelLabel =
    hiddenPanelIndex >= 0 ? mobilePanels[hiddenPanelIndex]?.label : undefined;
  const mobilePanelEntries = mobilePanels.map((panel, panelIndex) => ({
    panel,
    panelIndex,
  }));
  const visibleMobilePanelEntries = mobilePanelEntries.filter(
    ({ panelIndex }) => !collapsedPanels[panelIndex],
  );
  const tabletPanelEntries = mobilePanelEntries;
  const tabletPages =
    hiddenPanelCount > 0
      ? [tabletPanelEntries]
      : [
          [tabletPanelEntries[0], tabletPanelEntries[1]],
          [tabletPanelEntries[1], tabletPanelEntries[2]],
        ];
  const getPanelDropSide = (panelId: PanelId) =>
    panelDropTarget?.type === "panel" && panelDropTarget.panelId === panelId
      ? panelDropTarget.insertAfterTarget
        ? "after"
        : "before"
      : undefined;
  const getRestoredPanelPageIndex = (panelIndex: number) =>
    isTablet ? (panelIndex === 2 ? 1 : 0) : panelIndex;
  const handleCentralVisibilityButtonClick = () => {
    if (hiddenPanelIndex < 0) {
      return;
    }

    handleTogglePanel(hiddenPanelIndex);
    setActiveMobilePage(getRestoredPanelPageIndex(hiddenPanelIndex));
  };

  function handleMobileViewportScroll() {
    const viewport = mobileViewportRef.current;

    if (!viewport || viewport.clientWidth <= 0) {
      return;
    }

    const maxScrollIndex = getMobilePageCount(mobileSizes, isTablet) - 1;
    const nextPageIndex = Math.round(
      clamp(viewport.scrollLeft / viewport.clientWidth, 0, maxScrollIndex),
    );

    activeMobilePageRef.current = nextPageIndex;
    setActiveMobilePage((currentPageIndex) =>
      currentPageIndex === nextPageIndex ? currentPageIndex : nextPageIndex,
    );
  }

  function scrollMobileViewportToPage(pageIndex: number) {
    const viewport = mobileViewportRef.current;

    if (!viewport || viewport.clientWidth <= 0) {
      return;
    }

    viewport.scrollTo({
      left: pageIndex * viewport.clientWidth,
      behavior: "smooth",
    });
  }

  function handleMobileSwipeStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest(
        "button, a, select, input, textarea, [data-swipe-ignore]",
      )
    ) {
      mobileSwipeStateRef.current = null;
      return;
    }

    const maxScrollIndex = getMobilePageCount(mobileSizes, isTablet) - 1;
    const pageIndex = Math.round(
      clamp(activeMobilePageRef.current, 0, maxScrollIndex),
    );

    mobileSwipeStateRef.current = {
      pageIndex,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handleMobileSwipeEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const swipeState = mobileSwipeStateRef.current;
    mobileSwipeStateRef.current = null;

    if (!swipeState) {
      return;
    }

    const deltaX = event.clientX - swipeState.startX;
    const deltaY = event.clientY - swipeState.startY;

    if (
      Math.abs(deltaX) < MOBILE_SWIPE_THRESHOLD ||
      Math.abs(deltaX) < Math.abs(deltaY)
    ) {
      return;
    }

    const maxScrollIndex = getMobilePageCount(mobileSizes, isTablet) - 1;
    const nextPageIndex = clamp(
      swipeState.pageIndex + (deltaX < 0 ? 1 : -1),
      0,
      maxScrollIndex,
    );

    activeMobilePageRef.current = nextPageIndex;
    setActiveMobilePage(nextPageIndex);
    scrollMobileViewportToPage(nextPageIndex);
  }

  function handleMobileSwipeCancel() {
    mobileSwipeStateRef.current = null;
  }

  useEffect(() => {
    if (isDesktop) {
      return;
    }

    const viewport = mobileViewportRef.current;

    if (!viewport || viewport.clientWidth <= 0) {
      return;
    }

    const maxScrollIndex = getMobilePageCount(mobileSizes, isTablet) - 1;
    const nextPageIndex = Math.round(
      clamp(activeMobilePage, 0, maxScrollIndex),
    );
    const nextScrollLeft = nextPageIndex * viewport.clientWidth;

    if (Math.abs(viewport.scrollLeft - nextScrollLeft) < 1) {
      return;
    }

    viewport.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
  }, [activeMobilePage, isDesktop, isTablet, mobileSizes]);

  const isHideDropTargetActive = panelDropTarget?.type === "hide";

  if (!isDesktop) {
    return (
      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 flex-col pt-2"
      >
        <div className="flex shrink-0 justify-center pb-2">
          <WorkspaceHideButton
            hiddenPanelLabel={hiddenPanelLabel}
            isDropTargetActive={isHideDropTargetActive}
            isReadyForDrop={Boolean(movingPanelId) && hiddenPanelCount === 0}
            onClick={handleCentralVisibilityButtonClick}
          />
        </div>
        <div
          ref={mobileViewportRef}
          onScroll={handleMobileViewportScroll}
          className="scrollbar-hide flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth"
        >
          {isTablet
            ? tabletPages.map((pagePanelEntries, pageIndex) => {
                const firstPanelRatio = tabletPageRatios[pageIndex] ?? 0.5;
                const visibleTabletEntries = pagePanelEntries.filter(
                  ({ panelIndex }) => !collapsedPanels[panelIndex],
                );

                if (hiddenPanelCount > 0) {
                  return (
                    <div
                      key={`tablet-page-${pageIndex + 1}`}
                      className="flex min-h-0 min-w-0 flex-[0_0_100%] snap-start items-stretch overflow-visible"
                    >
                      {pagePanelEntries.map(({ panel, panelIndex }) => {
                        const isCollapsed = collapsedPanels[panelIndex];
                        const visibleIndex = visibleTabletEntries.findIndex(
                          (entry) => entry.panelIndex === panelIndex,
                        );
                        const shouldShowResizeHandle =
                          visibleIndex === 1 && visibleTabletEntries.length > 1;

                        return (
                          <Fragment key={panel.id}>
                            {shouldShowResizeHandle ? (
                              <TabletPanelResizeHandle
                                onPointerDown={(event) =>
                                  handleTabletResizeStart(pageIndex, event)
                                }
                              />
                            ) : null}
                            <WorkspacePanel
                              panelId={panel.id}
                              dropSide={getPanelDropSide(panel.id)}
                              style={{
                                flex: isCollapsed
                                  ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
                                  : visibleTabletEntries.length > 1 &&
                                      visibleIndex === 0
                                    ? `${firstPanelRatio} 1 0%`
                                    : visibleTabletEntries.length > 1
                                      ? `${1 - firstPanelRatio} 1 0%`
                                      : "1 1 0%",
                                minWidth: isCollapsed ? "0px" : undefined,
                              }}
                              className={cn(
                                panel.label === "문제" && !isCollapsed
                                  ? "rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]"
                                  : "overflow-visible",
                                isCollapsed &&
                                  "rounded-none border-transparent bg-transparent p-0",
                                movingPanelId === panel.id && "opacity-30",
                              )}
                              isCollapsed={isCollapsed}
                              moveHandle={
                                !isCollapsed ? (
                                  <PanelMoveHandle
                                    isActive={movingPanelId === panel.id}
                                    label={panel.label}
                                    panelId={panel.id}
                                    onPointerDown={handlePanelMoveStart}
                                  />
                                ) : undefined
                              }
                            >
                              {panel.content}
                            </WorkspacePanel>
                          </Fragment>
                        );
                      })}
                    </div>
                  );
                }

                const [firstPanelEntry, secondPanelEntry] = pagePanelEntries;
                const firstPanel = firstPanelEntry.panel;
                const secondPanel = secondPanelEntry.panel;
                const isFirstPanelCollapsed =
                  collapsedPanels[firstPanelEntry.panelIndex];
                const isSecondPanelCollapsed =
                  collapsedPanels[secondPanelEntry.panelIndex];
                const isTabletResizeVisible =
                  !isFirstPanelCollapsed && !isSecondPanelCollapsed;

                return (
                  <div
                    key={`tablet-page-${pageIndex + 1}`}
                    className="flex min-h-0 min-w-0 flex-[0_0_100%] snap-start items-stretch overflow-visible"
                  >
                    <WorkspacePanel
                      panelId={firstPanel.id}
                      dropSide={getPanelDropSide(firstPanel.id)}
                      style={{
                        flex: isFirstPanelCollapsed
                          ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
                          : isSecondPanelCollapsed
                            ? "1 1 0%"
                            : `${firstPanelRatio} 1 0%`,
                        minWidth: isFirstPanelCollapsed ? "0px" : undefined,
                      }}
                      className={cn(
                        firstPanel.label === "문제" && !isFirstPanelCollapsed
                          ? "rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]"
                          : "overflow-visible",
                        isFirstPanelCollapsed &&
                          "rounded-none border-transparent bg-transparent p-0",
                        movingPanelId === firstPanel.id && "opacity-30",
                      )}
                      isCollapsed={isFirstPanelCollapsed}
                      moveHandle={
                        !isFirstPanelCollapsed ? (
                          <PanelMoveHandle
                            isActive={movingPanelId === firstPanel.id}
                            label={firstPanel.label}
                            panelId={firstPanel.id}
                            onPointerDown={handlePanelMoveStart}
                          />
                        ) : undefined
                      }
                    >
                      {firstPanel.content}
                    </WorkspacePanel>
                    {isTabletResizeVisible ? (
                      <TabletPanelResizeHandle
                        onPointerDown={(event) =>
                          handleTabletResizeStart(pageIndex, event)
                        }
                      />
                    ) : null}
                    <WorkspacePanel
                      panelId={secondPanel.id}
                      dropSide={getPanelDropSide(secondPanel.id)}
                      style={{
                        flex: isSecondPanelCollapsed
                          ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
                          : isFirstPanelCollapsed
                            ? "1 1 0%"
                            : `${1 - firstPanelRatio} 1 0%`,
                        minWidth: isSecondPanelCollapsed ? "0px" : undefined,
                      }}
                      className={cn(
                        secondPanel.label === "문제" && !isSecondPanelCollapsed
                          ? "rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]"
                          : "overflow-visible",
                        isSecondPanelCollapsed &&
                          "rounded-none border-transparent bg-transparent p-0",
                        movingPanelId === secondPanel.id && "opacity-30",
                      )}
                      isCollapsed={isSecondPanelCollapsed}
                      moveHandle={
                        !isSecondPanelCollapsed ? (
                          <PanelMoveHandle
                            isActive={movingPanelId === secondPanel.id}
                            label={secondPanel.label}
                            panelId={secondPanel.id}
                            onPointerDown={handlePanelMoveStart}
                          />
                        ) : undefined
                      }
                    >
                      {secondPanel.content}
                    </WorkspacePanel>
                  </div>
                );
              })
            : visibleMobilePanelEntries.map(({ panel, panelIndex }) => {
                const isCollapsed = collapsedPanels[panelIndex];

                return (
                  <div
                    key={`mobile-page-${panel.id}`}
                    className="flex min-h-0 min-w-0 flex-[0_0_100%] items-stretch overflow-visible"
                  >
                    <WorkspacePanel
                      panelId={panel.id}
                      dropSide={getPanelDropSide(panel.id)}
                      style={{
                        flex: "1 1 0%",
                        minWidth: "0px",
                      }}
                      className={cn(
                        panel.id === "problem" && !isCollapsed
                          ? "rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]"
                          : "overflow-visible",
                        isCollapsed &&
                          "rounded-none border-transparent bg-transparent p-0",
                      )}
                      isCollapsed={isCollapsed}
                      moveHandle={
                        !isCollapsed ? (
                          <PanelMoveHandle
                            isActive={movingPanelId === panel.id}
                            label={panel.label}
                            panelId={panel.id}
                            onPointerDown={handlePanelMoveStart}
                          />
                        ) : undefined
                      }
                    >
                      {panel.content}
                    </WorkspacePanel>
                  </div>
                );
              })}
        </div>

        {mobilePageCount > 1 ? (
          <div
            className="mt-3 flex shrink-0 items-center justify-center gap-2"
            aria-hidden="true"
          >
            {Array.from({ length: mobilePageCount }, (_, index) => (
              <span
                key={`mobile-page-${index + 1}`}
                className={cn(
                  "size-2 rounded-full transition",
                  activeMobilePage === index
                    ? "bg-[#06923E] dark:bg-[#46c86f]"
                    : "bg-slate-300 dark:bg-slate-700",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col pt-2",
        (isDragging || movingPanelId) && "select-none",
        movingPanelId && "cursor-grabbing",
      )}
    >
      <div className="flex shrink-0 justify-center pb-2">
        <WorkspaceHideButton
          hiddenPanelLabel={hiddenPanelLabel}
          isDropTargetActive={isHideDropTargetActive}
          isReadyForDrop={Boolean(movingPanelId) && hiddenPanelCount === 0}
          onClick={handleCentralVisibilityButtonClick}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-row items-stretch">
        {mobilePanels.map((panel, index) => {
          const isCollapsed = collapsedPanels[index];
          const isProblemPanel = panel.id === "problem";

          return (
            <Fragment key={panel.id}>
              <WorkspacePanel
                panelId={panel.id}
                dropSide={getPanelDropSide(panel.id)}
                style={{
                  flex: isCollapsed
                    ? `0 0 ${COLLAPSED_PANEL_SIZE}px`
                    : `${sizes[index]} 1 0%`,
                  minWidth: isCollapsed
                    ? `${COLLAPSED_PANEL_SIZE}px`
                    : `${panelMinSize}px`,
                  minHeight: "0px",
                  background: isCollapsed ? "transparent" : undefined,
                  borderWidth: isCollapsed ? 0 : undefined,
                  borderRadius: isCollapsed ? 0 : undefined,
                }}
                className={cn(
                  isProblemPanel &&
                    "rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3.5 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]",
                  isCollapsed &&
                    "overflow-visible rounded-none border-transparent bg-transparent p-0",
                  movingPanelId === panel.id && "opacity-30",
                )}
                isCollapsed={isCollapsed}
                moveHandle={
                  !isCollapsed ? (
                    <PanelMoveHandle
                      isActive={movingPanelId === panel.id}
                      label={panel.label}
                      panelId={panel.id}
                      onPointerDown={handlePanelMoveStart}
                    />
                  ) : undefined
                }
              >
                {panel.content}
              </WorkspacePanel>

              {index === 0 && !collapsedPanels[0] && !collapsedPanels[1] ? (
                <ResizeHandle
                  isDesktop={isDesktop}
                  onPointerDown={(event) => handleResizeStart(0, event)}
                />
              ) : null}

              {index === 1 && !collapsedPanels[2] ? (
                <ResizeHandle
                  isDesktop={isDesktop}
                  onPointerDown={(event) => handleResizeStart(1, event)}
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function TabletPanelResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      className="group relative mx-2 my-auto h-24 w-3 shrink-0 cursor-ew-resize touch-none rounded-full border border-slate-200 bg-white/85 backdrop-blur-sm transition hover:border-[#06923E]/45 hover:bg-[#eef7f1] dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-[#06923E]/50 dark:hover:bg-slate-800"
      aria-label="패널 너비 조절"
    >
      <span className="absolute inset-1 rounded-full bg-slate-300/90 transition group-hover:bg-[#06923E] dark:bg-slate-600 dark:group-hover:bg-[#46c86f]" />
      <span className="absolute left-1/2 top-1/2 h-9 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300/70 transition group-hover:bg-[#06923E]/80 dark:bg-slate-500 dark:group-hover:bg-[#46c86f]/85" />
    </button>
  );
}

function PanelMoveHandle({
  isActive,
  label,
  panelId,
  onPointerDown,
}: {
  isActive: boolean;
  label: string;
  panelId: PanelId;
  onPointerDown: (
    panelId: PanelId,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => onPointerDown(panelId, event)}
      className={cn(
        "absolute left-1/2 top-0.5 z-30 flex h-3 w-20 -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-full transition active:cursor-grabbing",
        isActive && "cursor-grabbing",
      )}
      aria-label={`${label} 패널 이동`}
    >
      <span
        className={cn(
          "h-1 w-10 rounded-full bg-slate-300/90 shadow-sm transition hover:bg-[#06923E] dark:bg-slate-600 dark:hover:bg-[#46c86f]",
          isActive && "bg-[#06923E] dark:bg-[#46c86f]",
        )}
      />
    </button>
  );
}

function WorkspacePanel({
  children,
  className,
  dropSide,
  isCollapsed = false,
  moveHandle,
  panelId,
  style,
}: {
  children: ReactNode;
  className?: string;
  dropSide?: "before" | "after";
  isCollapsed?: boolean;
  moveHandle?: ReactNode;
  panelId?: PanelId;
  style: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative min-h-0 min-w-0 transition-opacity duration-150",
        className,
      )}
      data-panel-id={panelId}
      style={style}
    >
      {dropSide ? (
        <>
          <span className="pointer-events-none absolute inset-0 z-30 rounded-[26px] ring-2 ring-inset ring-[#06923E]/70 shadow-[0_0_0_4px_rgba(6,146,62,0.12)] dark:ring-[#46c86f]/80 dark:shadow-[0_0_0_4px_rgba(70,200,111,0.16)]" />
          <span
            className={cn(
              "pointer-events-none absolute bottom-4 top-4 z-40 w-1.5 rounded-full bg-[#06923E] shadow-[0_0_0_4px_rgba(6,146,62,0.14)] dark:bg-[#46c86f] dark:shadow-[0_0_0_4px_rgba(70,200,111,0.16)]",
              dropSide === "before" ? "left-1.5" : "right-1.5",
            )}
          />
        </>
      ) : null}
      {!isCollapsed ? moveHandle : null}
      {!isCollapsed ? children : null}
    </div>
  );
}

function WorkspaceHideButton({
  hiddenPanelLabel,
  isDropTargetActive,
  isReadyForDrop,
  onClick,
}: {
  hiddenPanelLabel?: string;
  isDropTargetActive: boolean;
  isReadyForDrop: boolean;
  onClick: () => void;
}) {
  const hasHiddenPanel = Boolean(hiddenPanelLabel);
  const Icon = hasHiddenPanel ? EyeOff : Eye;

  return (
    <button
      type="button"
      data-panel-hide-target="true"
      aria-disabled={!hasHiddenPanel}
      aria-label={
        hasHiddenPanel
          ? `${hiddenPanelLabel} 패널 보이기`
          : "패널을 여기로 이동해서 감추기"
      }
      onClick={onClick}
      className={cn(
        "z-50 flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur-sm transition hover:border-[#06923E]/45 hover:bg-[#eef7f1] hover:text-[#06923E] dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:border-[#46c86f]/50 dark:hover:bg-[#06923E]/10 dark:hover:text-[#46c86f]",
        hasHiddenPanel && "border-[#06923E]/45 text-[#06923E]",
        isReadyForDrop &&
          "border-[#06923E]/45 text-[#06923E] dark:border-[#46c86f]/50 dark:text-[#46c86f]",
        isDropTargetActive &&
          "scale-110 border-[#06923E] bg-[#eef7f1] text-[#06923E] ring-4 ring-[#06923E]/15 dark:border-[#46c86f] dark:bg-[#06923E]/10 dark:text-[#46c86f] dark:ring-[#46c86f]/20",
      )}
    >
      <Icon className="size-4" />
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

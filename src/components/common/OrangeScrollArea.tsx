"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function OrangeScrollArea({ children, className = "" }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollHideTimeoutRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startScrollTop: number;
  } | null>(null);
  const [thumb, setThumb] = useState({
    height: 0,
    top: 0,
    visible: false,
  });
  const [isScrolling, setIsScrolling] = useState(false);

  const updateThumb = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = viewport;
    const visible = scrollHeight > clientHeight + 1;
    const height = visible
      ? Math.max(36, (clientHeight / scrollHeight) * clientHeight)
      : 0;
    const maxTop = Math.max(0, clientHeight - height);
    const top = visible
      ? (scrollTop / Math.max(1, scrollHeight - clientHeight)) * maxTop
      : 0;

    setThumb({ height, top, visible });
  }, []);

  const showScrollThumb = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport || viewport.scrollHeight <= viewport.clientHeight + 1) {
      setIsScrolling(false);
      return;
    }

    setIsScrolling(true);

    if (scrollHideTimeoutRef.current !== null) {
      window.clearTimeout(scrollHideTimeoutRef.current);
    }

    scrollHideTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 700);
  }, []);

  const keepScrollThumbVisible = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport || viewport.scrollHeight <= viewport.clientHeight + 1) {
      return;
    }

    setIsScrolling(true);

    if (scrollHideTimeoutRef.current !== null) {
      window.clearTimeout(scrollHideTimeoutRef.current);
      scrollHideTimeoutRef.current = null;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;

    updateThumb();
    showScrollThumb();

    if (!viewport) {
      return;
    }

    const distanceToBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

    if (distanceToBottom <= 240) {
      window.dispatchEvent(new CustomEvent("orange-scroll-area-near-end"));
    }
  }, [showScrollThumb, updateThumb]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;

    if (!viewport || event.deltaY <= 0) {
      return;
    }

    const distanceToBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

    if (
      viewport.scrollHeight <= viewport.clientHeight + 1 ||
      distanceToBottom <= 240
    ) {
      window.dispatchEvent(new CustomEvent("orange-scroll-area-near-end"));
    }
  }, []);

  const handleThumbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;

      if (!viewport || !thumb.visible) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startScrollTop: viewport.scrollTop,
      };
      keepScrollThumbVisible();
    },
    [keepScrollThumbVisible, thumb.visible],
  );

  const handleThumbPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current;
      const dragState = dragStateRef.current;

      if (!viewport || !dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const maxThumbTop = Math.max(1, viewport.clientHeight - thumb.height);
      const maxScrollTop = Math.max(
        0,
        viewport.scrollHeight - viewport.clientHeight,
      );
      const scrollDelta =
        ((event.clientY - dragState.startY) / maxThumbTop) * maxScrollTop;

      viewport.scrollTop = dragState.startScrollTop + scrollDelta;
      updateThumb();
      keepScrollThumbVisible();
    },
    [keepScrollThumbVisible, thumb.height, updateThumb],
  );

  const handleThumbPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      dragStateRef.current = null;
      showScrollThumb();
    },
    [showScrollThumb],
  );

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(updateThumb);
    const timeout = window.setTimeout(updateThumb, 150);

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(viewport);

    const mutationObserver = new MutationObserver(updateThumb);
    mutationObserver.observe(viewport, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("resize", updateThumb);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updateThumb);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
      if (scrollHideTimeoutRef.current !== null) {
        window.clearTimeout(scrollHideTimeoutRef.current);
      }
    };
  }, [updateThumb]);

  return (
    <div className="relative h-full min-h-0 min-w-0">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className={`scrollbar-native-hidden scroll-hover-surface min-w-0 overflow-x-hidden overflow-y-scroll overscroll-contain ${className}`}
      >
        <div className="min-w-0">{children}</div>
      </div>
      {thumb.visible ? (
        <div
          className={`absolute inset-y-0 right-0 z-30 w-3 transition-opacity duration-300 ease-out ${
            isScrolling
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <div
            className="absolute right-0 w-2 cursor-grab touch-none rounded-full bg-primary active:cursor-grabbing"
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerEnd}
            onPointerCancel={handleThumbPointerEnd}
            style={{
              height: `${thumb.height}px`,
              transform: `translateY(${thumb.top}px)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback } from "react";

export default function CustomScrollbar({
  children,
  height = 300,
  trackTop = 0,
  trackBottom = 0,
  trackRight = 4,
  trackWidth = 6,
  lockPageScroll = false,
  className = "",
  style = {},
  // Optional style applied to the OUTER positioning wrapper (not the inner
  // scroll box). Use to make the scroll region flex-grow inside a column.
  wrapperStyle = {},
  // When true, `height` acts as a MAX height: the box shrinks to fit short
  // content (no empty band below the last row) but caps + scrolls when tall.
  useMaxHeight = false,
  // When true, this is a HORIZONTAL scrollbar: the track runs along the bottom
  // and the thumb/drag math work on the X axis. Backward-compatible: defaults
  // to the original vertical behavior.
  horizontal = false,
  // Horizontal-only track insets (used when horizontal===true). Mirror the
  // vertical trackTop/Bottom/Right/Width props.
  trackLeft = 0,
  trackRightH = 0,
  trackBottomH = 2,
  trackHeight = 4,
  // When true (vertical mode only), ALSO render a cloned horizontal scrollbar
  // on the same scroll container — so ONE container has both #CDCED6 thumbs and
  // a sticky header inside it isn't trapped by nested overflow.
  withHorizontal = false,
}) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const dragStart = useRef(0);
  const dragStartScroll = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Cloned horizontal bar (only used when withHorizontal in vertical mode).
  const hTrackRef = useRef(null);
  const hThumbRef = useRef(null);
  const hDragStart = useRef(0);
  const hDragStartScroll = useRef(0);
  const [hHasOverflow, setHHasOverflow] = useState(false);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!el || !track || !thumb) return;

    if (horizontal) {
      const { scrollWidth, clientWidth, scrollLeft } = el;
      const overflowing = scrollWidth > clientWidth;
      if (!overflowing) {
        thumb.style.width = "0px";
        setHasOverflow(false);
        return;
      }
      setHasOverflow(true);

      const trackLen = track.clientWidth;
      if (!trackLen) {
        requestAnimationFrame(updateThumb);
        return;
      }
      const thumbLenRaw = (clientWidth / scrollWidth) * trackLen;
      const thumbLen = Math.max(12, Math.min(trackLen, thumbLenRaw));
      const maxScroll = scrollWidth - clientWidth;
      const safeScroll = Math.min(Math.max(scrollLeft, 0), maxScroll);
      const rawThumbPos =
        maxScroll > 0 ? (safeScroll / maxScroll) * (trackLen - thumbLen) : 0;
      const thumbPos = Math.min(
        Math.max(rawThumbPos, 0),
        Math.max(trackLen - thumbLen, 0),
      );
      thumb.style.width = `${thumbLen}px`;
      thumb.style.height = "100%";
      thumb.style.transform = `translateX(${thumbPos}px)`;
      return;
    }

    const { scrollHeight, clientHeight, scrollTop } = el;

    // Decide overflow from the scroll element itself — NOT from the track.
    // The track is display:none while hasOverflow is false, so its clientHeight
    // reads 0; gating on that created a deadlock where the track could never
    // become visible (0 height → early return → hasOverflow never set true).
    const overflowing = scrollHeight > clientHeight;
    if (!overflowing) {
      thumb.style.height = "0px";
      setHasOverflow(false);
      return;
    }
    setHasOverflow(true);

    // Track is now visible (or about to be) — measure it. If it hasn't laid out
    // yet this frame, retry on the next frame so the thumb still gets sized.
    const trackHeightPx = track.clientHeight;
    if (!trackHeightPx) {
      requestAnimationFrame(updateThumb);
      return;
    }

    const thumbHeightRaw = (clientHeight / scrollHeight) * trackHeightPx;
    const thumbHeight = Math.max(12, Math.min(trackHeightPx, thumbHeightRaw));
    const maxScroll = scrollHeight - clientHeight;
    const safeScrollTop = Math.min(Math.max(scrollTop, 0), maxScroll);
    const rawThumbTop =
      maxScroll > 0
        ? (safeScrollTop / maxScroll) * (trackHeightPx - thumbHeight)
        : 0;
    const thumbTop = Math.min(
      Math.max(rawThumbTop, 0),
      Math.max(trackHeightPx - thumbHeight, 0),
    );

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;

    // Cloned horizontal bar on the same scroll container.
    if (withHorizontal && hTrackRef.current && hThumbRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = el;
      const hOver = scrollWidth > clientWidth + 1;
      setHHasOverflow(hOver);
      if (hOver) {
        const hTrackLen = hTrackRef.current.clientWidth;
        if (hTrackLen) {
          const hLen = Math.max(30, (clientWidth / scrollWidth) * hTrackLen);
          const hMax = scrollWidth - clientWidth;
          const hPos = hMax > 0 ? (scrollLeft / hMax) * (hTrackLen - hLen) : 0;
          hThumbRef.current.style.width = `${hLen}px`;
          hThumbRef.current.style.transform = `translateX(${Math.min(Math.max(hPos, 0), Math.max(hTrackLen - hLen, 0))}px)`;
        }
      }
    }
  }, [horizontal, withHorizontal]);

  // Handle Dragging Logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = horizontal ? e.clientX : e.clientY;
    dragStartScroll.current = horizontal
      ? scrollRef.current.scrollLeft
      : scrollRef.current.scrollTop;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;

      if (horizontal) {
        const delta = e.clientX - dragStart.current;
        const trackLen = trackRef.current?.clientWidth || el.clientWidth;
        const ratio = el.scrollWidth / trackLen;
        el.scrollLeft = dragStartScroll.current + delta * ratio;
        return;
      }

      const deltaY = e.clientY - dragStart.current;
      const trackHeight = trackRef.current?.clientHeight || el.clientHeight;
      const scrollRatio = el.scrollHeight / trackHeight;
      el.scrollTop = dragStartScroll.current + deltaY * scrollRatio;
    },
    [horizontal],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  // Cloned horizontal thumb drag (vertical mode + withHorizontal).
  const hMouseMove = useCallback((e) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const delta = e.clientX - hDragStart.current;
    const trackLen = hTrackRef.current?.clientWidth || el.clientWidth;
    el.scrollLeft = hDragStartScroll.current + delta * (el.scrollWidth / trackLen);
  }, []);
  const hMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", hMouseMove);
    document.removeEventListener("mouseup", hMouseUp);
  }, [hMouseMove]);
  const hMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    hDragStart.current = e.clientX;
    hDragStartScroll.current = scrollRef.current.scrollLeft;
    document.addEventListener("mousemove", hMouseMove);
    document.addEventListener("mouseup", hMouseUp);
  };

  useEffect(() => {
    updateThumb();
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (!lockPageScroll || horizontal) return;
      const target = scrollRef.current;
      if (!target) return;

      const deltaY = e.deltaY;
      const atTop = target.scrollTop <= 0;
      const atBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

      // Desired behavior:
      // - While the inner container can scroll, keep the scroll inside it (block page scroll).
      // - When the inner container reaches an edge and user keeps scrolling, allow page scroll.
      const scrollingPastTop = deltaY < 0 && atTop;
      const scrollingPastBottom = deltaY > 0 && atBottom;

      if (scrollingPastTop || scrollingPastBottom) {
        // Let the event bubble to the page so the whole page scroll can start.
        return;
      }

      // Keep the wheel interaction scoped to this scroll area.
      // Do NOT preventDefault here, otherwise the inner area won't scroll.
      e.stopPropagation();
    };

    // Use non-passive listener so preventDefault works.
    el.addEventListener("wheel", handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(el);
    // Also watch the inner content: the scroll box height is fixed, so when
    // rows load asynchronously the box size never changes — only its content
    // does. Observing the content lets overflow get detected after data loads.
    if (el.firstElementChild) resizeObserver.observe(el.firstElementChild);
    // Re-check after paint in case content settles late (fonts/images).
    const raf = requestAnimationFrame(updateThumb);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      el.removeEventListener("wheel", handleWheel);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [children, updateThumb, handleMouseMove, handleMouseUp, lockPageScroll, horizontal]);

  // ---- Horizontal render ----
  if (horizontal) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        <div
          ref={scrollRef}
          onScroll={updateThumb}
          className={`custom-scroll ${className}`}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            ...style,
          }}
        >
          {children}
        </div>

        <div
          className="custom-scrollbar-track-h"
          ref={trackRef}
          style={{
            position: "absolute",
            left: trackLeft,
            right: trackRightH,
            bottom: trackBottomH,
            height: `${trackHeight}px`,
            color: "#CDCED6",
            overflow: "hidden",
            display: hasOverflow ? "block" : "none",
          }}
        >
          <div
            ref={thumbRef}
            onMouseDown={handleMouseDown}
            className="custom-scrollbar-thumb"
            style={{
              cursor: "pointer",
              height: "100%",
              backgroundColor: "#CDCED6",
              borderRadius: "4px",
            }}
          />
        </div>
      </div>
    );
  }

  // ---- Vertical render (original) ----
  return (
    <div
      style={{
        position: "relative",
        ...(useMaxHeight ? { maxHeight: height } : { height }),
        userSelect: isDragging ? "none" : "auto",
        ...wrapperStyle,
      }}
    >
      <div
        ref={scrollRef}
        onScroll={updateThumb}
        className={`custom-scroll ${className}`}
        style={{
          ...(useMaxHeight ? { maxHeight: height } : { height: "100%" }),
          overflow: "auto",
          scrollbarWidth: "none", // Hides default scrollbar in Firefox
          msOverflowStyle: "none", // Hides default scrollbar in IE/Edge
          ...style,
        }}
      >
        {children}
      </div>

      <div
        className="custom-scrollbar-track"
        ref={trackRef}
        style={{
          position: "absolute",
          top: trackTop,
          bottom: trackBottom,
          right: trackRight,
          color:"#CDCED6",
          width: `${trackWidth}px`, // Ensure track has a width to be visible
          overflow: "hidden",
          display: hasOverflow ? "block" : "none", // hide track when nothing to scroll
        }}
      >
        <div
          ref={thumbRef}
          onMouseDown={handleMouseDown}
          className="custom-scrollbar-thumb"
          style={{
            cursor: "pointer",
            width: "100%",
            backgroundColor: "#CDCED6", // Default color for visibility
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Cloned HORIZONTAL bar (same #CDCED6 thumb) on the same container. */}
      {withHorizontal && (
        <div
          className="custom-scrollbar-track-h"
          ref={hTrackRef}
          style={{
            position: "absolute",
            left: trackLeft,
            right: trackRightH,
            bottom: trackBottomH,
            height: `${trackWidth + 2}px`,
            borderRadius: "4px",
            backgroundColor: "rgba(0,0,0,0.06)",
            overflow: "hidden",
            display: hHasOverflow ? "block" : "none",
          }}
        >
          <div
            ref={hThumbRef}
            onMouseDown={hMouseDown}
            className="custom-scrollbar-thumb"
            style={{
              cursor: "pointer",
              height: "100%",
              backgroundColor: "#CDCED6",
              borderRadius: "4px",
            }}
          />
        </div>
      )}
    </div>
  );
}

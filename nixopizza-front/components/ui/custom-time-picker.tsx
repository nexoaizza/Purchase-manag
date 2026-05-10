"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CustomTimePicker({
  value,
  onChange,
}: {
  value: string; // "HH:mm" or ""
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selH, setSelH] = useState<number | null>(null);
  const [selM, setSelM] = useState<number | null>(null);
  const [hRaw, setHRaw] = useState("");
  const [mRaw, setMRaw] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);

  // Sync from external value
  useEffect(() => {
    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(":").map(Number);
      setSelH(h);
      setSelM(m);
      setHRaw(pad(h));
      setMRaw(pad(m));
    }
  }, [value]);

  // Scroll active item into center when popup opens
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      scrollToItem(hourColRef.current, selH ?? 0);
      scrollToItem(minColRef.current, selM ?? 0);
    });
  }, [open, selH, selM]);

  function scrollToItem(col: HTMLDivElement | null, idx: number) {
    if (!col) return;
    const items = col.querySelectorAll<HTMLDivElement>("[data-idx]");
    const item = items[idx];
    if (item) {
      col.scrollTop = item.offsetTop - col.clientHeight / 2 + item.clientHeight / 2;
    }
  }

  function applyHour(h: number) {
    const clamped = Math.max(0, Math.min(23, h));
    setSelH(clamped);
    setHRaw(pad(clamped));
    const m = selM ?? 0;
    onChange(`${pad(clamped)}:${pad(m)}`);
    scrollToItem(hourColRef.current, clamped);
  }

  function applyMin(m: number) {
    const clamped = Math.max(0, Math.min(59, m));
    setSelM(clamped);
    setMRaw(pad(clamped));
    const h = selH ?? 0;
    onChange(`${pad(h)}:${pad(clamped)}`);
    scrollToItem(minColRef.current, clamped);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayH = selH !== null ? pad(selH) : "--";
  const displayM = selM !== null ? pad(selM) : "--";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger with inline text inputs */}
      <div
        className="flex items-center gap-1.5 w-32 h-10 px-3 border-2 border-input rounded-lg bg-background cursor-text"
        onClick={() => setOpen(true)}
      >
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-0.5">
          {/* Hour input */}
          <input
            type="number"
            min={0}
            max={23}
            placeholder="HH"
            value={hRaw}
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            onChange={(e) => {
              setHRaw(e.target.value);
              const v = parseInt(e.target.value);
              if (!isNaN(v)) {
                const clamped = Math.max(0, Math.min(23, v));
                setSelH(clamped);
                scrollToItem(hourColRef.current, clamped);
                onChange(`${pad(clamped)}:${pad(selM ?? 0)}`);
              }
            }}
            onBlur={() => {
              const v = parseInt(hRaw);
              applyHour(isNaN(v) ? 0 : v);
            }}
            className="w-7 bg-transparent border-none outline-none text-center text-sm text-foreground p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground select-none">:</span>
          {/* Minute input */}
          <input
            type="number"
            min={0}
            max={59}
            placeholder="MM"
            value={mRaw}
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            onChange={(e) => {
              setMRaw(e.target.value);
              const v = parseInt(e.target.value);
              if (!isNaN(v)) {
                const clamped = Math.max(0, Math.min(59, v));
                setSelM(clamped);
                scrollToItem(minColRef.current, clamped);
                onChange(`${pad(selH ?? 0)}:${pad(clamped)}`);
              }
            }}
            onBlur={() => {
              const v = parseInt(mRaw);
              applyMin(isNaN(v) ? 0 : v);
            }}
            className="w-7 bg-transparent border-none outline-none text-center text-sm text-foreground p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Dropdown — shorter height (148px) */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden w-36">
          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-border">
            <div className="text-center py-1 text-xs text-muted-foreground border-r border-border">
              HH
            </div>
            <div className="text-center py-1 text-xs text-muted-foreground">
              MM
            </div>
          </div>

          {/* Scrollable columns — 148px tall */}
          <div className="grid grid-cols-2 divide-x divide-border" style={{ height: 148 }}>
            {/* Hours 00–23 */}
            <div
              ref={hourColRef}
              className="overflow-y-auto"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="py-1">
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    data-idx={h}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus on text input
                      applyHour(h);
                    }}
                    className={`mx-1 my-0.5 py-1 text-center text-xs rounded cursor-pointer select-none transition-colors ${
                      selH === h
                        ? "bg-foreground text-background font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {pad(h)}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes 00–59 */}
            <div
              ref={minColRef}
              className="overflow-y-auto"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="py-1">
                {Array.from({ length: 60 }, (_, m) => (
                  <div
                    key={m}
                    data-idx={m}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyMin(m);
                    }}
                    className={`mx-1 my-0.5 py-1 text-center text-xs rounded cursor-pointer select-none transition-colors ${
                      selM === m
                        ? "bg-foreground text-background font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {pad(m)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
            <span className="text-xs font-medium text-foreground">
              {displayH}:{displayM}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="text-xs bg-foreground text-background rounded px-3 py-1 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

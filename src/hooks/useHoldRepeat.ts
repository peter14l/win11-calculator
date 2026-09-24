import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export function useHoldRepeat(action: () => void, delay = 450, interval = 60) {
  const actionRef = useRef(action);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    actionRef.current = action;
  });

  useEffect(
    () => () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
        clearInterval(timerRef.current);
      }
    },
    [],
  );

  const stop = () => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const start = () => {
    stop();
    actionRef.current();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = window.setInterval(() => actionRef.current(), interval);
    }, delay);
  };

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
  };
}
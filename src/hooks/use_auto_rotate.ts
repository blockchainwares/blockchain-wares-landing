import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_ROTATE_INTERVAL = 15000;

interface UseAutoRotateOptions {
  /** Total number of items to cycle through */
  count: number;
  /** Current active index */
  active_index: number;
  /** Callback to change the active index */
  on_change: (index: number) => void;
  /** Whether the rotating element intersects the viewport; rotation pauses while false */
  in_view?: boolean;
}

interface UseAutoRotateReturn {
  /** Whether auto-rotation is currently playing (not paused) */
  is_auto_playing: boolean;
  /** Incremented on every section change — use as CSS animation reset key */
  progress_key: number;
  /** Call when user manually selects a section */
  handle_user_select: (index: number) => void;
}

/**
 * Hook for auto-rotating through sections with progress tracking.
 *
 * - Cycles forward every AUTO_ROTATE_INTERVAL ms
 * - Stops permanently on user interaction
 * - Pauses when document tab is hidden or the element is out of view
 */
export function useAutoRotate({
  count,
  active_index,
  on_change,
  in_view = true,
}: UseAutoRotateOptions): UseAutoRotateReturn {
  const [user_stopped, set_user_stopped] = useState(false);
  const [is_document_hidden, set_is_document_hidden] = useState(false);
  const [progress_key, set_progress_key] = useState(0);
  const is_auto_playing = !user_stopped && !is_document_hidden && in_view;

  const timer_ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear_timer = useCallback(() => {
    if (timer_ref.current) {
      clearTimeout(timer_ref.current);
      timer_ref.current = null;
    }
  }, []);

  /** Schedule the next auto-rotation tick */
  const schedule_next = useCallback(() => {
    if (timer_ref.current) clearTimeout(timer_ref.current);
    timer_ref.current = setTimeout(() => {
      const next_index = (active_index + 1) % count;
      on_change(next_index);
      set_progress_key((k) => k + 1);
    }, AUTO_ROTATE_INTERVAL);
  }, [active_index, count, on_change]);

  /** Handle user manually selecting a section — stops auto-rotation permanently */
  const handle_user_select = useCallback(
    (index: number) => {
      clear_timer();
      on_change(index);
      set_user_stopped(true);
    },
    [clear_timer, on_change]
  );

  /** Main effect: keep the rotation timer in sync with state */
  useEffect(() => {
    if (!is_auto_playing) return;
    schedule_next();
    return () => {
      if (timer_ref.current) {
        clearTimeout(timer_ref.current);
        timer_ref.current = null;
      }
    };
  }, [is_auto_playing, schedule_next]);

  /** A resumed rotation starts a fresh interval, so the progress bar restarts with it */
  const was_playing_ref = useRef(is_auto_playing);
  useEffect(() => {
    if (is_auto_playing && !was_playing_ref.current) {
      set_progress_key((k) => k + 1);
    }
    was_playing_ref.current = is_auto_playing;
  }, [is_auto_playing]);

  useEffect(() => {
    function sync_visibility() {
      set_is_document_hidden(document.hidden);
    }

    sync_visibility();
    document.addEventListener("visibilitychange", sync_visibility);
    return () => {
      document.removeEventListener("visibilitychange", sync_visibility);
    };
  }, []);

  /** Cleanup on unmount */
  useEffect(() => {
    return clear_timer;
  }, [clear_timer]);

  return { is_auto_playing, progress_key, handle_user_select };
}

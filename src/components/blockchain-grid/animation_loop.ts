import {
  BASE_FRAME_MS,
  FRAME_TOLERANCE_MS,
  LOW_END_FRAME_MS,
  MAX_DPR,
  MAX_STEP_MS,
  REDUCED_MOTION_QUERY,
  RESIZE_DEBOUNCE_MS,
  RESIZE_HYSTERESIS_PX,
  TARGET_FRAME_MS,
} from "./constants";
import { draw_chain_layer, draw_frame } from "./draw_frame";
import { advance_scene, create_scene, layout_scene } from "./scene";

function is_low_end_device(): boolean {
  return (
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency < 4) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )
  );
}

function current_dpr(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_DPR);
}

/** Two stacked canvases of the same size; `chain` sits under `frame`. */
export interface GridLayers {
  /** Static chain links, repainted only on resize or DPR change. */
  chain: HTMLCanvasElement;
  /** Everything that moves, repainted every frame. */
  frame: HTMLCanvasElement;
}

/**
 * Runs the hero blockchain animation on `layers` and returns the teardown.
 * At most one rAF is pending at any time; the loop stops while the hero is off-screen,
 * the tab is hidden or the user prefers reduced motion (then a single static frame is drawn).
 */
export function start_blockchain_grid(layers: GridLayers): () => void {
  const { chain, frame: canvas } = layers;
  const ctx = canvas.getContext("2d");
  const chain_ctx = chain.getContext("2d");
  if (!ctx || !chain_ctx) return () => {};

  const low_end = is_low_end_device();
  const scene = create_scene(low_end ? 2 : 1);
  const frame_ms = low_end ? LOW_END_FRAME_MS : TARGET_FRAME_MS;
  const motion_query = window.matchMedia(REDUCED_MOTION_QUERY);

  let reduced_motion = motion_query.matches;
  let in_viewport = true;
  let raf_id = 0;
  let last_frame_ts = -1;
  let resize_timer = 0;
  let measured_width = 0;
  let measured_height = 0;
  let dpr_query: MediaQueryList | null = null;

  const has_size = () => scene.width > 0 && scene.height > 0;
  const should_animate = () =>
    has_size() && in_viewport && !document.hidden && !reduced_motion;

  const tick = (ts: number) => {
    raf_id = 0;
    if (!should_animate()) return;
    const elapsed = last_frame_ts < 0 ? frame_ms : ts - last_frame_ts;
    if (elapsed >= frame_ms - FRAME_TOLERANCE_MS) {
      last_frame_ts = ts;
      advance_scene(scene, Math.min(elapsed, MAX_STEP_MS) / BASE_FRAME_MS);
      draw_frame(ctx, scene);
    }
    raf_id = requestAnimationFrame(tick);
  };

  const sync_loop = () => {
    if (should_animate()) {
      if (raf_id === 0) {
        last_frame_ts = -1;
        raf_id = requestAnimationFrame(tick);
      }
      return;
    }
    if (raf_id !== 0) {
      cancelAnimationFrame(raf_id);
      raf_id = 0;
    }
  };

  const apply_layout = () => {
    resize_timer = 0;
    const dpr = current_dpr();
    if (
      measured_width === scene.width &&
      measured_height === scene.height &&
      dpr === scene.dpr
    ) {
      return;
    }
    const bitmap_width = Math.round(measured_width * dpr);
    const bitmap_height = Math.round(measured_height * dpr);
    canvas.width = bitmap_width;
    canvas.height = bitmap_height;
    chain.width = bitmap_width;
    chain.height = bitmap_height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    chain_ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout_scene(scene, measured_width, measured_height, dpr);
    // Reallocation wipes both bitmaps; repaint now instead of leaving a blank frame.
    if (has_size()) {
      draw_chain_layer(chain_ctx, scene);
      draw_frame(ctx, scene);
    }
    sync_loop();
  };

  const request_layout = () => {
    if (measured_width === 0 || measured_height === 0) return;
    const unchanged =
      Math.abs(measured_width - scene.width) <= RESIZE_HYSTERESIS_PX &&
      Math.abs(measured_height - scene.height) <= RESIZE_HYSTERESIS_PX &&
      current_dpr() === scene.dpr;
    if (unchanged) return;
    if (!has_size()) {
      apply_layout();
      return;
    }
    window.clearTimeout(resize_timer);
    resize_timer = window.setTimeout(apply_layout, RESIZE_DEBOUNCE_MS);
  };

  const resize_observer = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1].contentBoxSize[0];
    measured_width = Math.round(box.inlineSize);
    measured_height = Math.round(box.blockSize);
    request_layout();
  });

  const intersection_observer = new IntersectionObserver((entries) => {
    in_viewport = entries[entries.length - 1].isIntersecting;
    sync_loop();
  });

  const on_motion_change = (event: MediaQueryListEvent) => {
    reduced_motion = event.matches;
    sync_loop();
  };

  // Moving the window to a screen with another DPR fires no ResizeObserver entry.
  const watch_dpr = () => {
    dpr_query?.removeEventListener("change", on_dpr_change);
    dpr_query = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );
    dpr_query.addEventListener("change", on_dpr_change);
  };
  function on_dpr_change() {
    watch_dpr();
    request_layout();
  }

  resize_observer.observe(canvas);
  intersection_observer.observe(canvas);
  document.addEventListener("visibilitychange", sync_loop);
  motion_query.addEventListener("change", on_motion_change);
  watch_dpr();

  return () => {
    cancelAnimationFrame(raf_id);
    raf_id = 0;
    window.clearTimeout(resize_timer);
    resize_observer.disconnect();
    intersection_observer.disconnect();
    document.removeEventListener("visibilitychange", sync_loop);
    motion_query.removeEventListener("change", on_motion_change);
    dpr_query?.removeEventListener("change", on_dpr_change);
  };
}

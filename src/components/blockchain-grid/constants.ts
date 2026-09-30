export const MAX_DPR = 2;

export const TARGET_FRAME_MS = 1000 / 30;
export const LOW_END_FRAME_MS = 1000 / 20;
/** rAF timestamps jitter by a fraction of a millisecond; without slack a 60 Hz display would drop to 20 fps. */
export const FRAME_TOLERANCE_MS = 1;
/** Motion constants were tuned per 60 Hz frame — elapsed time is converted into that unit. */
export const BASE_FRAME_MS = 1000 / 60;
/** Cap on one simulation step, so resuming after a stall does not teleport packets. */
export const MAX_STEP_MS = 100;
export const TIME_PER_BASE_FRAME = 0.016;

export const RESIZE_DEBOUNCE_MS = 150;
export const RESIZE_HYSTERESIS_PX = 1;

export const TRANSACTION_POOL_SIZE = 3;
export const SPRITE_PADDING = 2;
export const BLOCK_RADIUS = 8;
export const BLOCK_BOB_PX = 3;
export const SHADOW_OFFSET_Y = 8;
export const GLOW_PEAK_ALPHA = 0.06;
export const TX_GLOW_RADIUS = 12;
export const NODE_LINK_ALPHA = 0.04;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const DASH_CHAIN: readonly number[] = [6, 6];
export const DASH_NODE: readonly number[] = [4, 10];
export const DASH_NONE: readonly number[] = [];

export const COLOR = {
  cyan: "rgb(100, 200, 255)",
  amber: "rgb(255, 200, 100)",
  chain_edge: "rgba(100, 200, 255, 0.12)",
  chain_mid: "rgba(100, 200, 255, 0.06)",
  shadow_core: "rgba(0, 0, 0, 0.25)",
  shadow_mid: "rgba(0, 0, 0, 0.1)",
  shadow_edge: "rgba(0, 0, 0, 0)",
  glow_core: `rgba(100, 200, 255, ${GLOW_PEAK_ALPHA})`,
  cyan_clear: "rgba(100, 200, 255, 0)",
  tx_glow_core: "rgba(100, 200, 255, 0.35)",
  tx_glow_mid: "rgba(100, 200, 255, 0.1)",
  tx_packet: "rgba(100, 200, 255, 0.5)",
  block_bg_top: "rgba(20, 30, 50, 0.6)",
  block_bg_bottom: "rgba(10, 20, 35, 0.7)",
  border_confirmed: "rgba(100, 200, 255, 0.25)",
  border_pending: "rgba(255, 200, 100, 0.2)",
  hash: "rgba(100, 200, 255, 0.6)",
  prev_hash: "rgba(100, 200, 255, 0.25)",
  data_line: "rgba(255, 255, 255, 0.08)",
  confirmed_dot: "rgba(100, 255, 150, 0.5)",
} as const;

export const TRAIL_COLORS: readonly string[] = [
  "rgba(100, 200, 255, 0.11)",
  "rgba(100, 200, 255, 0.07)",
  "rgba(100, 200, 255, 0.03)",
];

/** Relative node positions; `min_width` adds more nodes on wider screens. */
export const NODE_LAYOUT: readonly {
  x: number;
  y: number;
  min_width: number;
}[] = [
  { x: 0.08, y: 0.12, min_width: 0 },
  { x: 0.92, y: 0.18, min_width: 0 },
  { x: 0.04, y: 0.85, min_width: 0 },
  { x: 0.96, y: 0.78, min_width: 0 },
  { x: 0.15, y: 0.5, min_width: 1024 },
  { x: 0.85, y: 0.45, min_width: 1024 },
  { x: 0.02, y: 0.35, min_width: 1440 },
  { x: 0.98, y: 0.65, min_width: 1440 },
];

import {
  NODE_LAYOUT,
  TIME_PER_BASE_FRAME,
  TRANSACTION_POOL_SIZE,
} from "./constants";
import {
  create_block_sprite,
  create_glow_sprite,
  create_shadow_sprite,
  create_tx_glow_sprite,
  type Sprite,
} from "./sprites";

export interface Block {
  rel_x: number;
  rel_y: number;
  x: number;
  y: number;
  hash: string;
  prev_hash: string;
  confirmed: boolean;
  pulse: number;
  line_widths: number[];
  sprite: Sprite | null;
}

export interface Connection {
  from: Block;
  to: Block;
}

export interface NetworkNode {
  x: number;
  y: number;
  phase: number;
}

export interface Transaction {
  active: boolean;
  from: number;
  to: number;
  progress: number;
  speed: number;
  y_offset: number;
}

export interface Scene {
  width: number;
  height: number;
  dpr: number;
  block_width: number;
  block_height: number;
  time: number;
  /** Low-end devices check every other block when linking network nodes. */
  node_search_step: number;
  blocks: Block[];
  connections: Connection[];
  nodes: NetworkNode[];
  transactions: Transaction[];
  shadow: Sprite | null;
  glow: Sprite | null;
  tx_glow: Sprite | null;
}

const HEX_CHARS = "0123456789abcdef";
const GENESIS_HASH = "0x00000000";
const PADDING_X = 0.08;
const PADDING_Y = 0.1;
const PLACEMENT_ATTEMPTS = 100;
const NEIGHBOURS_PER_BLOCK = 2;

export function create_scene(node_search_step: number): Scene {
  const transactions: Transaction[] = [];
  for (let i = 0; i < TRANSACTION_POOL_SIZE; i++) {
    transactions.push({
      active: false,
      from: 0,
      to: 0,
      progress: 0,
      speed: 0,
      y_offset: 0,
    });
  }
  return {
    width: 0,
    height: 0,
    dpr: 1,
    block_width: 0,
    block_height: 0,
    time: 0,
    node_search_step,
    blocks: [],
    connections: [],
    nodes: [],
    transactions,
    shadow: null,
    glow: null,
    tx_glow: null,
  };
}

function generate_hash(): string {
  let hash = "0x";
  for (let i = 0; i < 8; i++) {
    hash += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  }
  return hash;
}

function block_count_for(width: number): number {
  if (width < 640) return 4;
  if (width < 1024) return 8;
  if (width < 1440) return 12;
  return 16;
}

function is_in_exclusion_zone(rel_x: number, rel_y: number): boolean {
  return Math.abs(rel_x - 0.5) < 0.2 && Math.abs(rel_y - 0.45) < 0.125;
}

function is_too_close(
  blocks: Block[],
  rel_x: number,
  rel_y: number,
  min_distance: number,
) {
  for (const block of blocks) {
    if (Math.hypot(block.rel_x - rel_x, block.rel_y - rel_y) < min_distance)
      return true;
  }
  return false;
}

function sync_block_count(scene: Scene): void {
  const { blocks, width } = scene;
  const target = block_count_for(width);
  if (blocks.length > target) {
    blocks.length = target;
    return;
  }

  const min_distance = width < 640 ? 0.15 : 0.12;
  let prev_hash =
    blocks.length > 0 ? blocks[blocks.length - 1].hash : GENESIS_HASH;
  for (let i = blocks.length; i < target; i++) {
    let rel_x = 0;
    let rel_y = 0;
    let attempts = 0;
    do {
      rel_x = PADDING_X + Math.random() * (1 - PADDING_X * 2);
      rel_y = PADDING_Y + Math.random() * (1 - PADDING_Y * 2);
      attempts++;
    } while (
      attempts < PLACEMENT_ATTEMPTS &&
      (is_in_exclusion_zone(rel_x, rel_y) ||
        is_too_close(blocks, rel_x, rel_y, min_distance))
    );
    if (attempts >= PLACEMENT_ATTEMPTS) continue;

    const hash = generate_hash();
    const confirmed = Math.random() > 0.3;
    const pulse = Math.random() * Math.PI * 2;
    const line_count = 2 + Math.floor(Math.random() * 3);
    const line_widths: number[] = [];
    for (let l = 0; l < line_count; l++)
      line_widths.push(35 + Math.random() * 25);

    blocks.push({
      rel_x,
      rel_y,
      x: 0,
      y: 0,
      hash,
      prev_hash,
      confirmed,
      pulse,
      line_widths,
      sprite: null,
    });
    prev_hash = hash;
  }
}

function build_connections(blocks: Block[]): Connection[] {
  const connections: Connection[] = [];
  const linked = new Set<number>();
  const count = blocks.length;
  for (let i = 0; i < count; i++) {
    const neighbours = blocks
      .map((block, idx) => ({
        idx,
        dist: Math.hypot(block.x - blocks[i].x, block.y - blocks[i].y),
      }))
      .filter((entry) => entry.idx !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, NEIGHBOURS_PER_BLOCK);

    for (const { idx } of neighbours) {
      const key = Math.min(i, idx) * count + Math.max(i, idx);
      if (linked.has(key)) continue;
      linked.add(key);
      connections.push({ from: blocks[i], to: blocks[idx] });
    }
  }
  return connections;
}

function build_nodes(scene: Scene): NetworkNode[] {
  const nodes: NetworkNode[] = [];
  for (const layout of NODE_LAYOUT) {
    if (scene.width < layout.min_width) continue;
    nodes.push({ x: layout.x * scene.width, y: layout.y * scene.height, phase: layout.x });
  }
  return nodes;
}

function spawn_transaction(scene: Scene, tx: Transaction): void {
  const count = scene.blocks.length;
  tx.active = count >= 2;
  if (!tx.active) return;
  tx.from = Math.floor(Math.random() * count);
  do {
    tx.to = Math.floor(Math.random() * count);
  } while (tx.to === tx.from);
  tx.progress = Math.random();
  tx.speed = 0.002 + Math.random() * 0.003;
  tx.y_offset = (Math.random() - 0.5) * 10;
}

/** Rebuilds everything that depends on canvas size or DPR; runs only on resize, never per frame. */
export function layout_scene(
  scene: Scene,
  width: number,
  height: number,
  dpr: number,
): void {
  scene.width = width;
  scene.height = height;
  scene.dpr = dpr;
  const is_narrow = width < 640;
  scene.block_width = is_narrow ? Math.min(90, width * 0.2) : 90;
  scene.block_height = is_narrow ? Math.min(54, width * 0.12) : 54;

  sync_block_count(scene);
  for (const block of scene.blocks) {
    block.x = block.rel_x * width;
    block.y = block.rel_y * height;
    block.sprite = create_block_sprite(
      block,
      scene.block_width,
      scene.block_height,
      dpr,
    );
  }

  scene.connections = build_connections(scene.blocks);
  scene.nodes = build_nodes(scene);
  scene.shadow = create_shadow_sprite(
    scene.block_width,
    scene.block_height,
    dpr,
  );
  scene.glow = create_glow_sprite(scene.block_width, dpr);
  scene.tx_glow = create_tx_glow_sprite(dpr);

  for (const tx of scene.transactions) {
    const stale =
      tx.from >= scene.blocks.length || tx.to >= scene.blocks.length;
    if (!tx.active || stale) spawn_transaction(scene, tx);
  }
}

/** Advances animation state by `frames` 60 Hz frames — allocation-free. */
export function advance_scene(scene: Scene, frames: number): void {
  scene.time += TIME_PER_BASE_FRAME * frames;
  for (let i = 0; i < scene.transactions.length; i++) {
    const tx = scene.transactions[i];
    if (!tx.active) continue;
    tx.progress += tx.speed * frames;
    if (tx.progress >= 1) spawn_transaction(scene, tx);
  }
}

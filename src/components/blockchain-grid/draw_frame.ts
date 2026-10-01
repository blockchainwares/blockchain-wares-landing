import {
  BLOCK_BOB_PX,
  COLOR,
  DASH_CHAIN,
  DASH_NODE,
  DASH_NONE,
  GLOW_PEAK_ALPHA,
  NODE_LINK_ALPHA,
  SHADOW_OFFSET_Y,
  SPRITE_PADDING,
  TRAIL_COLORS,
  TX_GLOW_RADIUS,
} from "./constants";
import type { Block, Scene } from "./scene";
import { glow_radius, shadow_radius } from "./sprites";

const TAU = Math.PI * 2;

function arc_y(
  from_y: number,
  to_y: number,
  progress: number,
  y_offset: number,
) {
  return (
    from_y +
    (to_y - from_y) * progress +
    y_offset -
    Math.sin(progress * Math.PI) * 10
  );
}

function nearest_block(scene: Scene, x: number, y: number): Block {
  const { blocks, node_search_step } = scene;
  let nearest = blocks[0];
  let min_dist = Infinity;
  for (let i = 0; i < blocks.length; i += node_search_step) {
    const dx = blocks[i].x - x;
    const dy = blocks[i].y - y;
    const dist = dx * dx + dy * dy;
    if (dist < min_dist) {
      min_dist = dist;
      nearest = blocks[i];
    }
  }
  return nearest;
}

function draw_nodes(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { nodes, time } = scene;
  // The shipped look links every node after the first with the previous node's
  // ring alpha (a carried-over strokeStyle); only the first link uses the faint colour.
  let link_alpha = NODE_LINK_ALPHA;

  ctx.fillStyle = COLOR.cyan;
  ctx.strokeStyle = COLOR.cyan;
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const y = node.y + Math.sin(time * 0.4 + node.phase * 10) * 8;
    const pulse = 0.15 + Math.sin(time * 1.5 + node.phase * 5) * 0.08;
    const target = nearest_block(scene, node.x, y);

    ctx.globalAlpha = link_alpha;
    ctx.setLineDash(DASH_NODE);
    ctx.beginPath();
    ctx.moveTo(node.x, y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash(DASH_NONE);

    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(node.x, y, 3, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = pulse + 0.1;
    ctx.beginPath();
    ctx.arc(node.x, y, 6, 0, TAU);
    ctx.stroke();
    link_alpha = pulse + 0.1;
  }
  ctx.globalAlpha = 1;
}

function draw_transactions(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { blocks, time, transactions, tx_glow } = scene;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const from = blocks[tx.from];
    const to = blocks[tx.to];
    if (!tx.active || !from || !to) continue;

    const x = from.x + (to.x - from.x) * tx.progress;
    const y = arc_y(from.y, to.y, tx.progress, tx.y_offset);

    if (tx_glow) {
      ctx.drawImage(
        tx_glow.image,
        x - TX_GLOW_RADIUS,
        y - TX_GLOW_RADIUS,
        tx_glow.width,
        tx_glow.height,
      );
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4 + time * 2);
    ctx.fillStyle = COLOR.tx_packet;
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    for (let t = 1; t <= TRAIL_COLORS.length; t++) {
      const trail_progress = tx.progress - t * 0.04;
      if (trail_progress < 0) continue;
      ctx.fillStyle = TRAIL_COLORS[t - 1];
      ctx.beginPath();
      ctx.arc(
        from.x + (to.x - from.x) * trail_progress,
        arc_y(from.y, to.y, trail_progress, tx.y_offset),
        2.5 - t * 0.5,
        0,
        TAU,
      );
      ctx.fill();
    }
  }
}

function draw_blocks(ctx: CanvasRenderingContext2D, scene: Scene): void {
  const { blocks, block_width, block_height, dpr, glow, shadow, time } = scene;
  const shadow_r = shadow_radius(block_width, block_height);
  const glow_r = glow_radius(block_width);
  const pending_alpha = 0.25 + Math.sin(time * 4) * 0.15;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (shadow) {
      ctx.drawImage(
        shadow.image,
        block.x - shadow_r,
        block.y + SHADOW_OFFSET_Y - shadow_r,
        shadow.width,
        shadow.height,
      );
    }

    if (block.confirmed && glow) {
      ctx.globalAlpha =
        (0.04 + Math.sin(time * 2 + block.pulse) * 0.02) / GLOW_PEAK_ALPHA;
      ctx.drawImage(
        glow.image,
        block.x - glow_r,
        block.y - glow_r,
        glow.width,
        glow.height,
      );
      ctx.globalAlpha = 1;
    }

    // Only the static x lands on a device pixel (crisp sprite text); the bobbing y
    // stays fractional, otherwise the float moves in visible 1px steps at DPR 1.
    const left = Math.round((block.x - block_width / 2) * dpr) / dpr;
    const top =
      block.y - block_height / 2 + Math.sin(time + block.pulse) * BLOCK_BOB_PX;
    const sprite = block.sprite;
    if (sprite) {
      ctx.drawImage(
        sprite.image,
        left - SPRITE_PADDING,
        top - SPRITE_PADDING,
        sprite.width,
        sprite.height,
      );
    }

    if (!block.confirmed) {
      ctx.globalAlpha = pending_alpha;
      ctx.fillStyle = COLOR.amber;
      ctx.beginPath();
      ctx.arc(left + block_width - 10, top + 10, 3, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

/** Renders one frame from the current scene state; performs no allocations. */
export function draw_frame(ctx: CanvasRenderingContext2D, scene: Scene): void {
  ctx.clearRect(0, 0, scene.width, scene.height);
  if (scene.blocks.length === 0) return;
  draw_nodes(ctx, scene);
  draw_transactions(ctx, scene);
  draw_blocks(ctx, scene);
}

/**
 * Paints the block-to-block chain links onto the static layer under the frame canvas.
 * Their ends never move (the bob only offsets the block sprite), so this runs once per layout.
 */
export function draw_chain_layer(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
): void {
  const { connections } = scene;
  ctx.lineWidth = 1;
  ctx.setLineDash(DASH_CHAIN);
  for (const { from, to } of connections) {
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    gradient.addColorStop(0, COLOR.chain_edge);
    gradient.addColorStop(0.5, COLOR.chain_mid);
    gradient.addColorStop(1, COLOR.chain_edge);
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
  ctx.setLineDash(DASH_NONE);
}

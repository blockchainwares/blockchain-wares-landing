import {
  BLOCK_RADIUS,
  COLOR,
  SPRITE_PADDING,
  TX_GLOW_RADIUS,
} from "./constants";

/** Pre-rendered bitmap; `width`/`height` are CSS pixels, the backing store is scaled by DPR. */
export interface Sprite {
  image: HTMLCanvasElement;
  width: number;
  height: number;
}

interface BlockContent {
  hash: string;
  prev_hash: string;
  confirmed: boolean;
  line_widths: number[];
}

function create_sprite(
  css_width: number,
  css_height: number,
  dpr: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): Sprite | null {
  const image = document.createElement("canvas");
  image.width = Math.max(1, Math.ceil(css_width * dpr));
  image.height = Math.max(1, Math.ceil(css_height * dpr));
  const ctx = image.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  paint(ctx);
  return { image, width: image.width / dpr, height: image.height / dpr };
}

function create_radial_sprite(
  radius: number,
  dpr: number,
  stops: readonly (readonly [number, string])[],
): Sprite | null {
  return create_sprite(radius * 2, radius * 2, dpr, (ctx) => {
    const gradient = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function shadow_radius(
  block_width: number,
  block_height: number,
): number {
  return Math.max(block_width, block_height) * 1.2;
}

export function glow_radius(block_width: number): number {
  return block_width * 0.9;
}

export function create_shadow_sprite(
  block_width: number,
  block_height: number,
  dpr: number,
) {
  return create_radial_sprite(shadow_radius(block_width, block_height), dpr, [
    [0, COLOR.shadow_core],
    [0.4, COLOR.shadow_mid],
    [1, COLOR.shadow_edge],
  ]);
}

/** Painted at peak intensity; the pulse is applied with `globalAlpha` at draw time. */
export function create_glow_sprite(block_width: number, dpr: number) {
  return create_radial_sprite(glow_radius(block_width), dpr, [
    [0, COLOR.glow_core],
    [1, COLOR.cyan_clear],
  ]);
}

export function create_tx_glow_sprite(dpr: number) {
  return create_radial_sprite(TX_GLOW_RADIUS, dpr, [
    [0, COLOR.tx_glow_core],
    [0.5, COLOR.tx_glow_mid],
    [1, COLOR.cyan_clear],
  ]);
}

/**
 * Static part of a block (body, border, hashes, data lines, confirmed dot).
 * Sprite origin sits at (block left - padding, block top - padding); data lines may
 * overflow a narrow mobile block, so the sprite grows to fit them instead of clipping.
 */
export function create_block_sprite(
  block: BlockContent,
  block_width: number,
  block_height: number,
  dpr: number,
): Sprite | null {
  let content_width = block_width;
  for (const line_width of block.line_widths) {
    content_width = Math.max(content_width, 8 + line_width);
  }
  const content_height = Math.max(
    block_height,
    32 + block.line_widths.length * 7,
  );
  const pad = SPRITE_PADDING;

  return create_sprite(
    content_width + pad * 2,
    content_height + pad * 2,
    dpr,
    (ctx) => {
      const border = block.confirmed
        ? COLOR.border_confirmed
        : COLOR.border_pending;
      const center_x = pad + block_width / 2;

      const background = ctx.createLinearGradient(
        pad,
        pad,
        pad,
        pad + block_height,
      );
      background.addColorStop(0, COLOR.block_bg_top);
      background.addColorStop(1, COLOR.block_bg_bottom);
      ctx.fillStyle = background;
      ctx.beginPath();
      ctx.roundRect(pad, pad, block_width, block_height, BLOCK_RADIUS);
      ctx.fill();

      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = border;
      ctx.fillRect(pad + 4, pad, block_width - 8, 1);

      ctx.textAlign = "center";
      ctx.fillStyle = COLOR.hash;
      ctx.font = "bold 8px monospace";
      ctx.fillText(block.hash, center_x, pad + 15);

      ctx.fillStyle = COLOR.prev_hash;
      ctx.font = "6px monospace";
      ctx.fillText(`← ${block.prev_hash}`, center_x, pad + 26);

      ctx.fillStyle = COLOR.data_line;
      block.line_widths.forEach((line_width, i) => {
        ctx.fillRect(pad + 8, pad + 32 + i * 7, line_width, 2);
      });

      if (block.confirmed) {
        ctx.fillStyle = COLOR.confirmed_dot;
        ctx.beginPath();
        ctx.arc(pad + block_width - 10, pad + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  );
}

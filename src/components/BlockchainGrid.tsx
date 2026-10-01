import { useEffect, useRef } from "react";
import { start_blockchain_grid } from "./blockchain-grid";

const LAYER_CLASS = "absolute inset-0 w-full h-full";

/**
 * Animated blockchain visualization - blocks, transactions and network nodes
 * Grid is handled by InteractiveBackground component
 */
export function BlockchainGrid() {
  const chain_ref = useRef<HTMLCanvasElement>(null);
  const frame_ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const chain = chain_ref.current;
    const frame = frame_ref.current;
    if (!chain || !frame) return;
    return start_blockchain_grid({ chain, frame });
  }, []);

  return (
    <>
      <canvas ref={chain_ref} aria-hidden="true" className={LAYER_CLASS} />
      <canvas ref={frame_ref} aria-hidden="true" className={LAYER_CLASS} />
    </>
  );
}

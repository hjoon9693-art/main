/**
 * Geometry for the Home tree, ported from `plantArtPainted()` in the design
 * prototype. Everything is in a 240×240 viewBox with the ground at y = 212.
 */
export const VB = 240;
export const X = 120;
export const G = 212;

export type Clump = [cx: number, cy: number, r: number];
export type LeafSpec = { x: number; y: number; len: number; ang: number; wide: number; dur: number; del: number };
export type StemSpec = { d: string; w: number };
export type Glow = { x: number; y: number; r: number; delay: number };
export type Falling = { x: number; y: number; delay: number };
export type Firefly = { x: number; y: number; delay: number };

export type PlantArt = {
  seed: boolean;
  stems: StemSpec[];
  branches: string[];
  trunk: { topY: number; bw: number; lean: number } | null;
  canopy: Clump[];
  leaves: LeafSpec[];
  glows: Glow[];
  falling: Falling[];
  fireflies: Firefly[];
};

/** Growth thresholds (best streak) for stages 1–5. */
export const STAGE_AT = [1, 7, 14, 30, 100];

export function stageFor(streak: number) {
  let stage = 1;
  STAGE_AT.forEach((at, i) => {
    if (streak >= at) stage = i + 1;
  });
  return stage;
}

export function plantArt(stage: number, dormant: boolean): PlantArt {
  const art: PlantArt = {
    seed: false,
    stems: [],
    branches: [],
    trunk: null,
    canopy: [],
    leaves: [],
    glows: [],
    falling: [],
    fireflies: [],
  };
  let n = 0;
  // Each leaf gets its own flutter duration / delay, as in the prototype.
  const leaf = (x: number, y: number, len: number, ang: number, wide = 0.5) => {
    n++;
    art.leaves.push({ x, y, len, ang, wide, dur: 3 + (n % 4) * 0.4, del: (n % 5) * 0.4 });
  };

  if (dormant) {
    art.seed = true;
  } else if (stage === 1) {
    art.stems.push({ d: `M ${X} ${G - 11} Q ${X - 2} ${G - 22} ${X + 1} ${G - 30}`, w: 2.2 });
    leaf(X + 1, G - 30, 15, -160, 0.62);
    leaf(X + 1, G - 30, 14, -25, 0.62);
  } else if (stage === 2) {
    art.stems.push({ d: `M ${X} ${G - 11} Q ${X + 6} ${G - 36} ${X + 1} ${G - 62}`, w: 2.8 });
    leaf(X + 3, G - 28, 15, -168);
    leaf(X + 4, G - 38, 16, -14);
    leaf(X + 2, G - 50, 16, -160);
    leaf(X + 1, G - 62, 19, -130, 0.55);
    leaf(X + 1, G - 62, 18, -48, 0.55);
  } else if (stage === 3) {
    art.branches.push(`M ${X} ${G - 48} Q ${X - 9} ${G - 58} ${X - 15} ${G - 74}`);
    art.trunk = { topY: G - 82, bw: 4.5, lean: 1 };
    art.canopy = [
      [X - 17, G - 86, 15],
      [X + 19, G - 88, 16],
      [X, G - 100, 23],
      [X + 3, G - 120, 15],
    ];
    leaf(X + 3, G - 30, 11, -26);
  } else if (stage === 4) {
    art.branches.push(
      `M ${X} ${G - 56} Q ${X - 18} ${G - 70} ${X - 32} ${G - 94}`,
      `M ${X + 1} ${G - 66} Q ${X + 18} ${G - 78} ${X + 30} ${G - 98}`,
    );
    art.trunk = { topY: G - 104, bw: 8, lean: 2 };
    art.canopy = [
      [X - 44, G - 116, 17],
      [X + 46, G - 118, 17],
      [X - 30, G - 104, 24],
      [X + 32, G - 106, 25],
      [X, G - 124, 34],
      [X - 14, G - 148, 23],
      [X + 18, G - 146, 23],
    ];
    art.falling.push({ x: X + 30, y: G - 100, delay: 1 });
  } else {
    art.branches.push(
      `M ${X} ${G - 62} Q ${X - 24} ${G - 80} ${X - 46} ${G - 110}`,
      `M ${X + 1} ${G - 72} Q ${X + 24} ${G - 88} ${X + 46} ${G - 114}`,
    );
    art.trunk = { topY: G - 118, bw: 11, lean: 2 };
    art.canopy = [
      [X - 60, G - 138, 20],
      [X + 62, G - 140, 20],
      [X - 42, G - 116, 30],
      [X + 43, G - 118, 31],
      [X, G - 140, 43],
      [X - 24, G - 172, 28],
      [X + 26, G - 170, 28],
      [X + 2, G - 192, 19],
    ];
    art.glows = [
      [X - 40, G - 126],
      [X + 36, G - 116],
      [X - 4, G - 152],
      [X + 22, G - 180],
    ].map(([x, y], i) => ({ x, y, r: 2.2, delay: i * 0.6 }));
    art.falling.push({ x: X - 44, y: G - 110, delay: 0 }, { x: X + 40, y: G - 112, delay: 3.4 });
    art.fireflies = [
      { x: X - 74, y: G - 86, delay: 0 },
      { x: X + 78, y: G - 120, delay: 2 },
      { x: X - 60, y: G - 196, delay: 3.6 },
    ];
  }
  return art;
}

export function trunkPaths(topY: number, bw: number, lean: number) {
  const tx = X + lean;
  const mid = (G + topY) / 2;
  return {
    body: `M ${X - bw * 2.1} ${G - 6} Q ${X - bw * 1.1} ${G - 9} ${X - bw * 0.9} ${G - 22} Q ${X - bw * 0.7} ${mid} ${tx - bw * 0.45} ${topY} L ${tx + bw * 0.45} ${topY} Q ${X + bw * 0.8} ${mid} ${X + bw * 0.95} ${G - 22} Q ${X + bw * 1.2} ${G - 9} ${X + bw * 2.2} ${G - 6} Q ${X + bw * 0.6} ${G - 2} ${X} ${G - 5} Q ${X - bw * 0.7} ${G - 2} ${X - bw * 2.1} ${G - 6} Z`,
    lit: `M ${X - bw * 0.9} ${G - 22} Q ${X - bw * 0.7} ${mid} ${tx - bw * 0.45} ${topY} L ${tx + bw * 0.05} ${topY} Q ${X - bw * 0.1} ${mid} ${X - bw * 0.05} ${G - 12} Q ${X - bw * 0.5} ${G - 8} ${X - bw * 1.6} ${G - 6} Q ${X - bw * 1} ${G - 10} ${X - bw * 0.9} ${G - 22} Z`,
    highlight: `M ${X - bw * 0.6} ${G - 26} Q ${X - bw * 0.5} ${mid} ${tx - bw * 0.25} ${topY + 6}`,
    highlightWidth: Math.max(1, bw * 0.22),
  };
}

/** Lowest point of the canopy — the origin it "breathes" from. */
export function canopyBase(clumps: Clump[]) {
  return Math.max(...clumps.map((c) => c[1] + c[2]));
}

/** Leaf outline, rotated by `deg` around (x, y). Runs on the UI thread. */
export function leafPaths(x: number, y: number, len: number, wide: number, deg: number) {
  'worklet';
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const p = (px: number, py: number) => `${x + px * c - py * s} ${y + px * s + py * c}`;
  return {
    base: `M ${p(0, 0)} Q ${p(len * 0.45, -len * wide)} ${p(len, 0)} Q ${p(len * 0.45, len * wide)} ${p(0, 0)} Z`,
    lit: `M ${p(0, 0)} Q ${p(len * 0.45, -len * wide)} ${p(len, 0)} Q ${p(len * 0.5, -len * 0.08)} ${p(0, 0)} Z`,
    vein: `M ${p(len * 0.25, -len * 0.2)} Q ${p(len * 0.5, -len * 0.32)} ${p(len * 0.72, -len * 0.14)}`,
  };
}

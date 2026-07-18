const TINTS = ["#8b6dff", "#5ac8ff", "#ff78b4", "#7fe0a0", "#ffb27a", "#c9b8ff"];

const GRADIENTS = [
  "linear-gradient(150deg,#8b6dff,#b18bff)",
  "linear-gradient(150deg,#5ac8ff,#7ce0d0)",
  "linear-gradient(150deg,#ff78b4,#ff9f58)",
  "linear-gradient(150deg,#7fe0a0,#4bbf7f)",
  "linear-gradient(150deg,#ffb27a,#e0782f)",
  "linear-gradient(150deg,#c9b8ff,#8b6dff)",
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarGradient(seed: string): string {
  return GRADIENTS[hashSeed(seed) % GRADIENTS.length];
}

/** A single solid color matching the same palette/index as getAvatarGradient,
 *  for contexts (SVG fill/stroke) that can't render a CSS gradient value. */
export function getAvatarTint(seed: string): string {
  return TINTS[hashSeed(seed) % TINTS.length];
}

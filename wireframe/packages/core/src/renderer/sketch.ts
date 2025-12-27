/**
 * Sketch utilities for creating hand-drawn style SVG paths
 * Inspired by rough.js but simplified for wireframe use
 */

export interface SketchOptions {
  roughness?: number; // How rough/wobbly the lines are (0-2, default 1)
  bowing?: number; // How much lines bow in the middle (0-2, default 1)
  seed?: number; // Random seed for reproducibility
}

// Simple seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  // Random number between -1 and 1
  offset(): number {
    return this.next() * 2 - 1;
  }
}

/**
 * Create a sketchy line path between two points
 */
export function sketchyLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: SketchOptions = {}
): string {
  const roughness = options.roughness ?? 1;
  const bowing = options.bowing ?? 1;
  const rng = new SeededRandom(options.seed ?? Math.floor(x1 + y1 * 1000 + x2 + y2));

  // Calculate line properties
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // For very short lines, just draw straight
  if (length < 4) {
    return `M${x1} ${y1} L${x2} ${y2}`;
  }

  // Perpendicular offset for wobble
  const perpX = -dy / length;
  const perpY = dx / length;

  // Add bowing in the middle
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const bowOffset = bowing * rng.offset() * Math.min(length / 10, 8);
  const bowX = midX + perpX * bowOffset;
  const bowY = midY + perpY * bowOffset;

  // Add roughness at endpoints and midpoint
  const offset1 = roughness * rng.offset() * 1.5;
  const offset2 = roughness * rng.offset() * 1.5;
  const offsetMid = roughness * rng.offset() * 2;

  const startX = x1 + perpX * offset1;
  const startY = y1 + perpY * offset1;
  const endX = x2 + perpX * offset2;
  const endY = y2 + perpY * offset2;
  const ctrlX = bowX + perpX * offsetMid;
  const ctrlY = bowY + perpY * offsetMid;

  return `M${startX.toFixed(1)} ${startY.toFixed(1)} Q${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

/**
 * Create a sketchy rectangle path
 */
export function sketchyRect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SketchOptions = {}
): string {
  const seed = options.seed ?? Math.floor(x + y * 1000 + width + height);

  // Draw four sides with slight overlap/gaps at corners
  const paths = [
    sketchyLine(x, y, x + width, y, { ...options, seed: seed }),
    sketchyLine(x + width, y, x + width, y + height, { ...options, seed: seed + 1 }),
    sketchyLine(x + width, y + height, x, y + height, { ...options, seed: seed + 2 }),
    sketchyLine(x, y + height, x, y, { ...options, seed: seed + 3 }),
  ];

  return paths.join(' ');
}

/**
 * Create a sketchy rounded rectangle path
 */
export function sketchyRoundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  options: SketchOptions = {}
): string {
  const seed = options.seed ?? Math.floor(x + y * 1000 + width + height);
  const r = Math.min(radius, width / 2, height / 2);

  if (r < 2) {
    return sketchyRect(x, y, width, height, options);
  }

  const roughness = options.roughness ?? 1;
  const rng = new SeededRandom(seed);

  // Corner arcs as quadratic curves with wobble
  const topLeft = `M${x + r} ${y + rng.offset() * roughness}`;
  const topRight = `L${x + width - r + rng.offset() * roughness} ${y + rng.offset() * roughness} Q${x + width + rng.offset() * roughness} ${y + rng.offset() * roughness} ${x + width + rng.offset() * roughness} ${y + r}`;
  const bottomRight = `L${x + width + rng.offset() * roughness} ${y + height - r + rng.offset() * roughness} Q${x + width + rng.offset() * roughness} ${y + height + rng.offset() * roughness} ${x + width - r} ${y + height + rng.offset() * roughness}`;
  const bottomLeft = `L${x + r + rng.offset() * roughness} ${y + height + rng.offset() * roughness} Q${x + rng.offset() * roughness} ${y + height + rng.offset() * roughness} ${x + rng.offset() * roughness} ${y + height - r}`;
  const close = `L${x + rng.offset() * roughness} ${y + r + rng.offset() * roughness} Q${x + rng.offset() * roughness} ${y + rng.offset() * roughness} ${x + r} ${y + rng.offset() * roughness}`;

  return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft} ${close}`;
}

/**
 * Create a sketchy circle path
 */
export function sketchyCircle(
  cx: number,
  cy: number,
  radius: number,
  options: SketchOptions = {}
): string {
  const seed = options.seed ?? Math.floor(cx + cy * 1000 + radius);
  const roughness = options.roughness ?? 1;
  const rng = new SeededRandom(seed);

  // Create circle using multiple cubic bezier curves
  const segments = 8;
  const angleStep = (Math.PI * 2) / segments;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    const wobble = roughness * rng.offset() * 2;
    points.push({
      x: cx + (radius + wobble) * Math.cos(angle),
      y: cy + (radius + wobble) * Math.sin(angle),
    });
  }

  // Build path
  let path = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < segments; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % segments];

    // Control points for smooth curve
    const midAngle = (i + 0.5) * angleStep;
    const ctrlRadius = radius * (4 / 3) * Math.tan(angleStep / 4);
    const wobble1 = roughness * rng.offset();
    const wobble2 = roughness * rng.offset();

    const ctrl1X = p0.x + ctrlRadius * Math.cos(i * angleStep + Math.PI / 2) + wobble1;
    const ctrl1Y = p0.y + ctrlRadius * Math.sin(i * angleStep + Math.PI / 2) + wobble1;
    const ctrl2X = p1.x - ctrlRadius * Math.cos((i + 1) * angleStep + Math.PI / 2) + wobble2;
    const ctrl2Y = p1.y - ctrlRadius * Math.sin((i + 1) * angleStep + Math.PI / 2) + wobble2;

    path += ` C${ctrl1X.toFixed(1)} ${ctrl1Y.toFixed(1)} ${ctrl2X.toFixed(1)} ${ctrl2Y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  return path + ' Z';
}

/**
 * Create a sketchy ellipse path
 */
export function sketchyEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  options: SketchOptions = {}
): string {
  const seed = options.seed ?? Math.floor(cx + cy * 1000 + rx + ry);
  const roughness = options.roughness ?? 1;
  const rng = new SeededRandom(seed);

  const segments = 8;
  const angleStep = (Math.PI * 2) / segments;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    const wobbleX = roughness * rng.offset() * 2;
    const wobbleY = roughness * rng.offset() * 2;
    points.push({
      x: cx + (rx + wobbleX) * Math.cos(angle),
      y: cy + (ry + wobbleY) * Math.sin(angle),
    });
  }

  let path = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < segments; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % segments];
    const nextAngle = (i + 1) * angleStep;

    const ctrl1X = p0.x + roughness * rng.offset();
    const ctrl1Y = p0.y + roughness * rng.offset();
    const ctrl2X = p1.x + roughness * rng.offset();
    const ctrl2Y = p1.y + roughness * rng.offset();

    path += ` C${ctrl1X.toFixed(1)} ${ctrl1Y.toFixed(1)} ${ctrl2X.toFixed(1)} ${ctrl2Y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  return path + ' Z';
}

/**
 * Create SVG path with sketchy stroke style
 */
export function sketchyPath(d: string, options: SketchOptions = {}): string {
  // For now, just return the path - in a more advanced version,
  // we could parse and re-render each segment with wobble
  return d;
}

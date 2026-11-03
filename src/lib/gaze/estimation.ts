export interface Point {
  x: number;
  y: number;
}
export interface Landmark extends Point {
  z?: number;
}
export interface CalibrationSample {
  features: number[];
  point: Point;
}
export interface Mapping {
  mean: number[];
  scale: number[];
  x: number[];
  y: number[];
}

// Iris positions relative to each eye's corner-to-corner axis, independent of camera mirroring.
export function eyeFeatures(landmarks: Landmark[]): number[] | null {
  if (landmarks.length < 478) return null;
  function eye(iris: number, start: number, end: number, upper: number, lower: number) {
    const a = landmarks[start],
      b = landmarks[end],
      p = landmarks[iris];
    const dx = b.x - a.x,
      dy = b.y - a.y,
      width = Math.hypot(dx, dy);
    const aperture = Math.hypot(
      landmarks[upper].x - landmarks[lower].x,
      landmarks[upper].y - landmarks[lower].y,
    );
    if (width < 0.008 || aperture / width < 0.1) return null;
    return [
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (width * width),
      ((p.y - a.y) * dx - (p.x - a.x) * dy) / (width * width),
    ];
  }
  const right = eye(468, 33, 133, 159, 145);
  const left = eye(473, 362, 263, 386, 374);
  if (!right || !left) return null;
  const features = [
    (right[0] + left[0]) / 2,
    (right[1] + left[1]) / 2,
    landmarks[1].x,
    landmarks[1].y,
  ];
  return features.every(Number.isFinite) ? features : null;
}

function solve(matrix: number[][], values: number[]): number[] | null {
  const a = matrix.map((row, i) => [...row, values[i]]);
  for (let col = 0; col < a.length; col++) {
    let pivot = col;
    for (let row = col + 1; row < a.length; row++)
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    if (Math.abs(a[col][col]) < 1e-10) return null;
    const divisor = a[col][col];
    a[col] = a[col].map((value) => value / divisor);
    for (let row = 0; row < a.length; row++)
      if (row !== col) {
        const factor = a[row][col];
        a[row] = a[row].map((value, i) => value - factor * a[col][i]);
      }
  }
  return a.map((row) => row[a.length]);
}

function input(mapping: Pick<Mapping, "mean" | "scale">, features: number[]) {
  return [1, ...features.map((value, i) => (value - mapping.mean[i]) / mapping.scale[i])];
}

export function calibrate(samples: CalibrationSample[]): Mapping | null {
  if (
    samples.length < 60 ||
    samples.some((s) => s.features.length !== 4 || !s.features.every(Number.isFinite))
  )
    return null;
  const mean = samples[0].features.map(
    (_, i) => samples.reduce((sum, sample) => sum + sample.features[i], 0) / samples.length,
  );
  const scale = mean.map((value, i) =>
    Math.sqrt(
      samples.reduce((sum, sample) => sum + (sample.features[i] - value) ** 2, 0) / samples.length,
    ),
  );
  if (scale[0] < 0.002 || scale[1] < 0.002) return null;
  for (let i = 0; i < scale.length; i++) scale[i] = Math.max(scale[i], 0.001);
  const rows = samples.map((sample) => input({ mean, scale }, sample.features));
  const size = rows[0].length;
  const matrix = Array.from({ length: size }, (_, i) =>
    Array.from(
      { length: size },
      (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0) + (i === j && i > 0 ? 0.1 : 0),
    ),
  );
  function weights(axis: "x" | "y") {
    return solve(
      matrix,
      Array.from({ length: size }, (_, i) =>
        rows.reduce((sum, row, n) => sum + row[i] * samples[n].point[axis], 0),
      ),
    );
  }
  const x = weights("x"),
    y = weights("y");
  if (!x || !y) return null;
  const mapping = { mean, scale, x, y };
  const error = Math.sqrt(
    samples.reduce((sum, sample) => {
      const point = estimate(mapping, sample.features);
      return sum + (point.x - sample.point.x) ** 2 + (point.y - sample.point.y) ** 2;
    }, 0) / samples.length,
  );
  return Number.isFinite(error) && error < 0.18 ? mapping : null;
}

export function estimate(mapping: Mapping, features: number[]): Point {
  const row = input(mapping, features);
  const dot = (weights: number[]) => row.reduce((sum, value, i) => sum + value * weights[i], 0);
  return {
    x: Math.min(1, Math.max(0, dot(mapping.x))),
    y: Math.min(1, Math.max(0, dot(mapping.y))),
  };
}

export const easeOut = (k) => 1 - Math.pow(1 - k, 4);
export const average = (a, b) => (a + b) / 2;

export const add = ([ax, ay, ar], [bx, by, br]) => [ax + bx, ay + by, ar + br];
export const sub = ([ax, ay, ar], [bx, by, br]) => [ax - bx, ay - by, ar - br];
export const smul = ([x, y, r], s) => [x * s, y * s, r * s];

export const norm = ([x, y, r]) => {
  const m = Math.sqrt(x ** 2 + y ** 2);
  if (m === 0) return [0, 0, r];
  return [x / m, y / m, r];
};

export const rot = ([x, y, r], rad) => [
  Math.cos(rad) * x - Math.sin(rad) * y,
  Math.sin(rad) * x + Math.cos(rad) * y,
  r,
];

export const plerp = (a, b, t) => add(a, smul(sub(b, a), t));

export const angle = (p, p1, p2) =>
  Math.atan2(p2[1] - p[1], p2[0] - p[0]) -
  Math.atan2(p1[1] - p[1], p1[0] - p[0]);

export const normAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const mag = ([x, y]) => Math.sqrt(x ** 2 + y ** 2);
export const dist = ([ax, ay], [bx, by]) => Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);

export const runLength = (points) => {
  if (points.length < 2) return 0;

  let len = 0;
  for (let i = 1; i <= points.length - 1; i++) {
    len += dist(points[i - 1], points[i]);
  }

  len += dist(points[points.length - 2], points[points.length - 1]);
  return len;
};

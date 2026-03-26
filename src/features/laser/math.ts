type Point3 = [number, number, number];
type Point2 = [number, number];

export const easeOut = (k: number): number => 1 - Math.pow(1 - k, 4);
export const average = (a: number, b: number): number => (a + b) / 2;

export const add = ([ax, ay, ar]: Point3, [bx, by, br]: Point3): Point3 => [ax + bx, ay + by, ar + br];
export const sub = ([ax, ay, ar]: Point3, [bx, by, br]: Point3): Point3 => [ax - bx, ay - by, ar - br];
export const smul = ([x, y, r]: Point3, scalar: number): Point3 => [x * scalar, y * scalar, r * scalar];

export const norm = ([x, y, r]: Point3): Point3 => {
  const magnitude = Math.sqrt(x ** 2 + y ** 2);
  if (magnitude === 0) return [0, 0, r];
  return [x / magnitude, y / magnitude, r];
};

export const rot = ([x, y, r]: Point3, rad: number): Point3 => [
  Math.cos(rad) * x - Math.sin(rad) * y,
  Math.sin(rad) * x + Math.cos(rad) * y,
  r,
];

export const plerp = (a: Point3, b: Point3, t: number): Point3 => add(a, smul(sub(b, a), t));

export const angle = (p: Point3, p1: Point3, p2: Point3): number =>
  Math.atan2(p2[1] - p[1], p2[0] - p[0]) - Math.atan2(p1[1] - p[1], p1[0] - p[0]);

export const normAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
export const mag = ([x, y]: Point2 | Point3): number => Math.sqrt(x ** 2 + y ** 2);
export const dist = ([ax, ay]: Point2 | Point3, [bx, by]: Point2 | Point3): number =>
  Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);

export const runLength = (points: Point3[]): number => {
  if (points.length < 2) return 0;

  let length = 0;
  for (let index = 1; index <= points.length - 1; index += 1) {
    length += dist(points[index - 1], points[index]);
  }

  length += dist(points[points.length - 2], points[points.length - 1]);
  return length;
};

export type { Point2, Point3 };
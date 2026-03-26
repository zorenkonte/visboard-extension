import { average, type Point3 } from './math';

export function getSvgPathFromStroke(points: Point3[], closed = true): string {
  const length = points.length;
  if (length < 4) {
    return '';
  }

  let pointA = points[0];
  let pointB = points[1];
  const pointC = points[2];

  let result = `M${pointA[0].toFixed(2)},${pointA[1].toFixed(2)} Q${pointB[0].toFixed(2)},${pointB[1].toFixed(2)} ${average(pointB[0], pointC[0]).toFixed(2)},${average(pointB[1], pointC[1]).toFixed(2)} T`;

  for (let index = 2, max = length - 1; index < max; index += 1) {
    pointA = points[index];
    pointB = points[index + 1];
    result += `${average(pointA[0], pointB[0]).toFixed(2)},${average(pointA[1], pointB[1]).toFixed(2)} `;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}
export class SvgUtils {}

SvgUtils.polygon = function (sides, padding) {
  let degreesToRadians = function (angleInDegrees) {
    return (Math.PI * angleInDegrees) / 180.0;
  };

  let points = function (count, radius, offset) {
    let angle = (Math.PI * 2.0) / count;
    let p = [];
    for (let i = 0; i < count; i++) {
      p.push({
        theta: offset + angle * i,
        r: radius,
      });
    }
    return p;
  };

  let toCartesian = function (center, p) {
    return {
      x: center.x + p.r * Math.cos(p.theta),
      y: center.y + p.r * Math.sin(p.theta),
    };
  };

  let size = 1000.0;

  if (padding === undefined) {
    padding = 0;
  }
  padding = padding * size;

  let radius = size / 2.0 - padding;
  let offset = Math.PI / sides;
  let center = {
    x: size / 2.0,
    y: size / 2.0,
  };

  let content =
    '<svg viewBox="0,0 ' + size + "," + size + '"><polygon points="';
  for (let p of points(sides, radius, offset)) {
    p = toCartesian(center, p);
    if (content !== null) {
      content += " ";
    }
    content += p.x + "," + p.y;
  }
  content += '"></svg>';

  return content;
};

"use strict"

class SvgUtils {
}

SvgUtils.polygon = function(sides, padding) {
	var degreesToRadians = function(angleInDegrees) {
		return (Math.PI * angleInDegrees) / 180.0;
	}

	var points = function(count, radius, offset) {
		var angle = (Math.PI * 2.0) / count;
		var p = [];
		Utils.loop(0, count, 1, function(i) {
			p.push({
				theta: offset + (angle * i),
				r: radius
			});
		});
		return p;
	}

	var toCartesian = function(center, p) {
		return {
			x: center.x + (p.r * Math.cos(p.theta)),
			y: center.y + (p.r * Math.sin(p.theta))
		};
	};

	var size = 1000.0;

	if (padding === undefined) {
		padding = 0;
	}
	padding = padding * size;

	var radius = (size / 2.0) - padding;
	var offset = Math.PI / sides;
	var center = {
		x: size / 2.0,
		y: size / 2.0
	};

	var content = "<svg viewBox=\"0,0 " + size + "," + size + "\"><polygon points=\"";
	Utils.each(points(sides, radius, offset), function(p) {
		p = toCartesian(center, p);
		if (content !== null) {
			content += " ";
		}
		content += p.x + "," + p.y;
	});
	content += "\"></svg>";

	return content;
};

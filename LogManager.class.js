"use strict"

class LogManager {
	constructor(rootLayout) {
		var logLayout = rootLayout.overlay(); //.layout().north().vertical();
		
		var logContainer = null;
		var lines = [];

		this._log = function(m) {
			var logMousePosition = UserInteraction.get().mouse();
			if (logMousePosition === null) {
				return;
			}

			if (logContainer === null) {
				logContainer = new Layout();
				logLayout.$.append(logContainer.$.addClass("logContainer"));
			}
			var p = rootLayout.mouse(logMousePosition);
			logContainer.$.css({
				top: p.y + "px",
				left: p.x + "px"
			});

			while (lines.length > 3) {
				lines.shift().destroy();
			}

			Utils.each(lines, function(l) {
				l.discard();
			});

			var line = {};

			line.div = logContainer.vertical().predd().$;
			line.div.addClass("log").html(m);

			var remove = function() {
				line.div.off();
				clearTimeout(line.timeoutId);
				line.timeoutId = null;
				line.div.fadeOut(800, line.destroy);
			};
			line.timeoutId = setTimeout(remove, 3000);
			UserInteraction.get().click(line.div, remove);
			line.discard = function() {
				if (line.timeoutId !== null) {
					line.div.css({ opacity: 0.4 });
				}
			};

			line.destroy = function() {
				line.div.off();
				clearTimeout(line.timeoutId);
				line.div.remove();
				Utils.remove(lines, line);
				if (lines.length === 0) {
					logContainer.$.remove();
					logContainer = null;
				}
			};

			lines.push(line);
		};
	}

	log(m) {
		this._log(m);
	}
}

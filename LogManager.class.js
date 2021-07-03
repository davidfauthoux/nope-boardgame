import { UserInteraction } from "../UserInteraction.class.js";
import { Layout } from "../Layout.class.js";

export class LogManager {
  /**
   * creates a new (unique) LogManager for a Layout
   * @param rootLayout
   */
  constructor(rootLayout) {
    let logLayout = rootLayout.overlay(); //.layout().north().vertical();

    let logContainer = null;
    let lines = [];

    this._log = function (m) {
      let logMousePosition = UserInteraction.get().mouse();
      if (logMousePosition === null) {
        return;
      }

      if (logContainer === null) {
        logContainer = new Layout();
        logLayout.$.append(logContainer.$.addClass("logContainer"));
      }
      let p = rootLayout.mouse(logMousePosition);
      logContainer.$.css({
        top: p.y + "px",
        left: p.x + "px",
      });

      while (lines.length > 3) {
        lines.shift().destroy();
      }

      for (const l of lines) {
        l.discard();
      }

      let line = {};

      line.div = logContainer.vertical().predd().$;
      line.div.addClass("log").html(m);

      let remove = function () {
        line.div.off();
        clearTimeout(line.timeoutId);
        line.timeoutId = null;
        line.div.fadeOut(800, line.destroy);
      };
      line.timeoutId = setTimeout(remove, 3000);
      UserInteraction.get().click(line.div, remove);
      line.discard = function () {
        if (line.timeoutId !== null) {
          line.div.css({ opacity: 0.4 });
        }
      };

      line.destroy = function () {
        line.div.off();
        clearTimeout(line.timeoutId);
        line.div.remove();
        delete lines[line]
        if (lines.length === 0) {
          logContainer.$.remove();
          logContainer = null;
        }
      };

      lines.push(line);
    };
  }

  /**
   * logs all informations that is happening in the layout
   * @param m
   */
  log(m) {
    this._log(m);
  }
}

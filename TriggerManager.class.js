import { Multimap } from "../Multimap.class.js";
import { GeneralReference } from "./GeneralReference.class.js";
import { ExecutionContext } from "./ExecutionContext.class.js";

export class TriggerManager {
  /**
   * creates a new (unique) TriggerManager for a given Game
   * @param {Game} game
   */
  constructor(game) {
    let that = this;

    this._keyTriggers = new Multimap.Array();
    this._instantTriggers = new Multimap.Array();
    this._dropTriggers = new Multimap.Array();
    this._passiveTriggers = new Multimap.Array();
    this._dropinTriggers = new Multimap.Array();
    this._newsTriggers = new Multimap.Array();
    this._watchdogTriggers = new Multimap.Array();
    this._currentHoverSpot = null;
    this._currentHoverItem = null;

    this._runScriptsInSpot = function (from, spot, item, runScripts) {
      let exec = [];
      if (spot !== null) {
        let foundItemInstance;
        if (item !== null) {
          foundItemInstance = spot.getItemInstance(item.kind);
          console.log(
            "Checking if should run script for: " +
              item.kind +
              " in: " +
              spot.location
          );
          let checkAndExec = function (k) {
            that._dropTriggers.get(k).each(function (f) {
              console.log(
                "Drop script triggered (" +
                  item.kind +
                  " in " +
                  spot.location +
                  ")"
              );
              exec.push(f(from, foundItemInstance, spot, null));
            });
          };
          checkAndExec(item.kind);
          for (const generalKind of GeneralReference.getGeneralKinds(item.kind)) {
            checkAndExec(generalKind.kind);
          }

        } else {
          foundItemInstance = null;
        }

        console.log("Checking if should run script in: " + spot.location);
        for (const key in spot._itemInstances){
          let i = spot._itemInstances[key];
          that._instantTriggers.get(i.item.kind).each(function (f) {
            //TODO Remove instant triggers if useless
            console.log(
                "Instant script triggered (" +
                i.item.kind +
                " in " +
                spot.location +
                ")"
            );
            exec.push(f(from, i, spot, null));
          });

          if (foundItemInstance !== null) {
            that._dropinTriggers.get(i.item.kind).each(function (f) {
              console.log(
                  "Dropin script triggered (" +
                  i.item.kind +
                  " in " +
                  spot.location +
                  ")"
              );
              exec.push(f(from, foundItemInstance, spot, null));
            });
          }
        }

        console.log(exec.length + " scripts to run in: " + spot.location);
      }
      that._passiveTriggers.each(function (scripts) {
        for (const f of scripts) {
          console.log("Passive script triggered");
          exec.push(f(from, null, spot, null));
        }
      });
      runScripts(exec);
    };

    /*
		let pressing = [];
		let specialKeys = [ "Meta", "Control" ]; // Not Alt and Shift because they alter the characters
		$("body").on("keydown", function(e) {
			let c = e.key;
			if (Utils.contains(specialKeys, c)) {
				if (!Utils.contains(pressing, c)) {
					pressing.push(c);
				}
			}
		});
		$("body").on("keyup", function(e) {
			let c = e.key;
			if (Utils.contains(specialKeys, c)) {
				Utils.remove(pressing, c);
			}
		});
		*/
    $("body").on("keydown", function (e) {
      let focused = $(document.activeElement);
      if (focused.length > 0) {
        let tag = focused.prop("tagName").toLowerCase();
        if (tag === "input" || tag === "textarea") {
          return;
        }
      }

      let c = e.key;
      if (c === " ") {
        c = "Space";
      }
      if (c === "Meta" || c === "Control") {
        return;
      }
      if (e.metaKey) {
        c = "Meta+" + c;
      }
      if (e.ctrlKey) {
        c = "Control+" + c;
      }
      /*
			if (Utils.contains(specialKeys, c)) {
				return;
			}
			Utils.each(pressing, function(p) {
				c = p + "+" + c;
			});
			*/

      console.log("[" + c + "]");

      let scripts = that._keyTriggers.get(c);
      if (!scripts.empty()) {
        console.log("Trigger [" + c + "] " + scripts.size() + " scripts");
        /*%%%%%%%%%%%%
				let currentOverItemInstance = null;
				let currentOverSpot = null;
				let id = that._currentHoverId;
				if (id !== null) {
					let s = id.split(/\:/g);
					if (s[0] === "item") {
						let location = s[1];
						let kind = s[2];
						currentOverSpot = game.spotManager.getSpot(location);
						if (currentOverSpot !== null) {
							currentOverItemInstance = currentOverSpot.getItemInstance(kind);
						}
					} else if (s[0] === "spot") {
						let location = s[1];
						currentOverSpot = game.spotManager.getSpot(location);
					}
				}
				*/

        let currentOverItemInstance = null;
        let currentOverSpot = null;
        if (that._currentHoverSpot !== null) {
          currentOverSpot = that._currentHoverSpot;
        } else if (that._currentHoverItem !== null) {
          currentOverItemInstance = that._currentHoverItem;
          currentOverSpot = currentOverItemInstance.spot;
        }

        let exec = [];
        scripts.each(function (f) {
          exec.push(f(null, currentOverItemInstance, currentOverSpot, null));
        });
        ExecutionContext.runScripts(game, exec);

        e.preventDefault();
      }
    });

    this._runNewsScriptsInSpot = function (action, newsContext) {
      let exec = [];
      that._newsTriggers.get(action).each(function (f) {
        exec.push(f(null, null, null, newsContext));
      });
      ExecutionContext.runDoNothingScripts(game, exec);
    };

    this._runWatchdogScriptsInSpot = function (
      action,
      spot,
      itemInstance,
      to,
      context
    ) {
      if (itemInstance === null) {
        return true;
      }
      context = {...context};
      context.action = action;
      let ok = true;
      let checkAndExec = function (k) {
        that._watchdogTriggers.get(k).each(function (f) {
          if (!ok) {
            return;
          }
          console.log(
            "Watchdog script triggered (" +
              itemInstance.item.kind +
              " as " +
              k +
              " in " +
              spot.location +
              ")"
          );
          try {
            ExecutionContext.runScripts(game, [
              f(spot, itemInstance, to, context),
            ]);
          } catch (exception) {
            console.log("Watchdog! " + exception);
            ok = false;
          }
        });
      };
      checkAndExec(itemInstance.item.kind);
      if (ok) {
        for (const generalKind of GeneralReference.getGeneralKinds(itemInstance.item.kind)) {
          if (!ok) {
            return;
          }
          checkAndExec(generalKind.kind);
        }
      }
      return ok;
    };
  }

  /*
		keys: [ "k", "Meta+c" ]
		instant: kind
		passive: kind
		drops: [] kinds
		dropin: kind
		news: [] actions (drop, move...)
		watchdogs: [] kind
	*/
  /**
   * links all the given triggers to their scripts
   * @param triggers
   * @param scriptAsFunction
   */
  link(triggers, scriptAsFunction) {
    let that = this;
    for (const e of triggers) {
      if (e.keys !== undefined) {
        for (const k of e.keys) {
          that._keyTriggers.get(k).add(scriptAsFunction);
        }
      } else if (e.instant !== undefined) {
        that._instantTriggers.get(e.instant).add(scriptAsFunction);
      } else if (e.passive !== undefined) {
        that._passiveTriggers.get(e.passive).add(scriptAsFunction);
      } else if (e.dropin !== undefined) {
        that._dropinTriggers.get(e.dropin).add(scriptAsFunction);
      } else if (e.drops !== undefined) {
        for (const k of e.drops) {
          that._dropTriggers.get(k).add(scriptAsFunction);
        }
      } else if (e.news !== undefined) {
        for (const k of e.news) {
          that._newsTriggers.get(k).add(scriptAsFunction);
        }
      } else if (e.watchdogs !== undefined) {
        for (const k of e.watchdogs) {
          that._watchdogTriggers.get(k).add(scriptAsFunction);
        }
      }
    }
  }

  //
  /**
   * affects the currently hovered Spot
   * @param {Spot} spot
   */
  hoverOnSpot(spot) {
    this._currentHoverSpot = spot;
  }

  /**
   * affects the currently hovered Item
   * @param itemInstance
   */
  hoverOnItem(itemInstance) {
    this._currentHoverItem = itemInstance;
  }

  /**
   * removes currently hovered Item or Spot
   */
  hoverOff() {
    this._currentHoverSpot = null;
    this._currentHoverItem = null;
  }

  //
  /**
   * Runs scripts for Spot modified by Item
   * @param from
   * @param {Spot} spot
   * @param item
   * @param runScripts
   */
  spotModified(from, spot, item, runScripts) {
    this._runScriptsInSpot(from, spot, item, runScripts);
  }

  /**
   * Runs scripts for Spot
   * @param {Spot} spot
   * @param runScripts
   */
  scriptRun(spot, runScripts) {
    this._runScriptsInSpot(null, spot, null, runScripts);
  }

  //

  addingNews(action, newsContext) {
    this._runNewsScriptsInSpot(action, newsContext);
  }

  //

  watchdog(action, spot, itemInstance, to, context) {
    return this._runWatchdogScriptsInSpot(
      action,
      spot,
      itemInstance,
      to,
      context
    );
  }
}

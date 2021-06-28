import { Utils } from "../Utils.class.js";
import { Multimap } from "../Multimap.class.js";
import { GeneralReference } from "./GeneralReference.class.js";
import { ExecutionContext } from "./ExecutionContext.class.js";

export class TriggerManager {
  constructor(game) {
    var that = this;

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
      var exec = [];
      if (spot !== null) {
        var foundItemInstance;
        if (item !== null) {
          foundItemInstance = spot.getItemInstance(item.kind);
          console.log(
            "Checking if should run script for: " +
              item.kind +
              " in: " +
              spot.location
          );
          var checkAndExec = function (k) {
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
          Utils.each(
            GeneralReference.getGeneralKinds(item.kind),
            function (generalKind) {
              checkAndExec(generalKind.kind);
            }
          );
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
        Utils.each(scripts, function (f) {
          console.log("Passive script triggered");
          exec.push(f(from, null, spot, null));
        });
      });
      runScripts(exec);
    };

    /*
		var pressing = [];
		var specialKeys = [ "Meta", "Control" ]; // Not Alt and Shift because they alter the characters
		$("body").on("keydown", function(e) {
			var c = e.key;
			if (Utils.contains(specialKeys, c)) {
				if (!Utils.contains(pressing, c)) {
					pressing.push(c);
				}
			}
		});
		$("body").on("keyup", function(e) {
			var c = e.key;
			if (Utils.contains(specialKeys, c)) {
				Utils.remove(pressing, c);
			}
		});
		*/
    $("body").on("keydown", function (e) {
      var focused = $(document.activeElement);
      if (focused.length > 0) {
        var tag = focused.prop("tagName").toLowerCase();
        if (tag === "input" || tag === "textarea") {
          return;
        }
      }

      var c = e.key;
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

      var scripts = that._keyTriggers.get(c);
      if (!scripts.empty()) {
        console.log("Trigger [" + c + "] " + scripts.size() + " scripts");
        /*%%%%%%%%%%%%
				var currentOverItemInstance = null;
				var currentOverSpot = null;
				var id = that._currentHoverId;
				if (id !== null) {
					var s = id.split(/\:/g);
					if (s[0] === "item") {
						var location = s[1];
						var kind = s[2];
						currentOverSpot = game.spotManager.getSpot(location);
						if (currentOverSpot !== null) {
							currentOverItemInstance = currentOverSpot.getItemInstance(kind);
						}
					} else if (s[0] === "spot") {
						var location = s[1];
						currentOverSpot = game.spotManager.getSpot(location);
					}
				}
				*/

        var currentOverItemInstance = null;
        var currentOverSpot = null;
        if (that._currentHoverSpot !== null) {
          currentOverSpot = that._currentHoverSpot;
        } else if (that._currentHoverItem !== null) {
          currentOverItemInstance = that._currentHoverItem;
          currentOverSpot = currentOverItemInstance.spot;
        }

        var exec = [];
        scripts.each(function (f) {
          exec.push(f(null, currentOverItemInstance, currentOverSpot, null));
        });
        ExecutionContext.runScripts(game, exec);

        e.preventDefault();
      }
    });

    this._runNewsScriptsInSpot = function (action, newsContext) {
      var exec = [];
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
      context = Utils.clone(context); // TODO how to remove clone ?
      context.action = action;
      var ok = true;
      var checkAndExec = function (k) {
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
        Utils.each(
          GeneralReference.getGeneralKinds(itemInstance.item.kind),
          function (generalKind) {
            if (!ok) {
              return;
            }
            checkAndExec(generalKind.kind);
          }
        );
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
  link(triggers, scriptAsFunction) {
    var that = this;
    Utils.each(triggers, function (e) {
      if (e.keys !== undefined) {
        Utils.each(e.keys, function (k) {
          that._keyTriggers.get(k).add(scriptAsFunction);
        });
      } else if (e.instant !== undefined) {
        that._instantTriggers.get(e.instant).add(scriptAsFunction);
      } else if (e.passive !== undefined) {
        that._passiveTriggers.get(e.passive).add(scriptAsFunction);
      } else if (e.dropin !== undefined) {
        that._dropinTriggers.get(e.dropin).add(scriptAsFunction);
      } else if (e.drops !== undefined) {
        Utils.each(e.drops, function (k) {
          that._dropTriggers.get(k).add(scriptAsFunction);
        });
      } else if (e.news !== undefined) {
        Utils.each(e.news, function (k) {
          that._newsTriggers.get(k).add(scriptAsFunction);
        });
      } else if (e.watchdogs !== undefined) {
        Utils.each(e.watchdogs, function (k) {
          that._watchdogTriggers.get(k).add(scriptAsFunction);
        });
      }
    });
  }

  //

  hoverOnSpot(spot) {
    this._currentHoverSpot = spot;
  }
  hoverOnItem(itemInstance) {
    this._currentHoverItem = itemInstance;
  }
  hoverOff() {
    this._currentHoverSpot = null;
    this._currentHoverItem = null;
  }

  //

  spotModified(from, spot, item, runScripts) {
    this._runScriptsInSpot(from, spot, item, runScripts);
  }
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

import { Server } from "../Server.class.js";
import { FilteringServer } from "../FilteringServer.class.js";
import { Heap, while_, false_, try_, sequence_, block_} from "../Async.class.js";
import { Layout } from "../Layout.class.js";


export class EventManager {
  /**
   * creates a new (unique) EventManager for a Game
   * @param layout
   * @param game
   */
  constructor(layout, game) {
    let that = this;

    let stackActivated = false;
    let launchInit;
    let finishInit;
    let launchReadEvent;
    let stopReadEvent;
    let gameInit = null;

    let savingDiv = $("<div>").text("Saving...").addClass("saving").hide();
    let errorDiv = $("<div>").text("Connection error").addClass("error").hide();
    let horizontal = layout.layout().north().layout().west().horizontal();
    horizontal.add().set(savingDiv);
    horizontal.add().set(errorDiv);

    let showSavingCount = 0;
    let showSavingTimeoutId = undefined;
    let showSaving = function () {
      if (showSavingCount === 0) {
        clearTimeout(showSavingTimeoutId);
        showSavingTimeoutId = setTimeout(function () {
          savingDiv.show();
        }, 500);
      }
      showSavingCount++;
    };
    let hideSaving = function (err) {
      showSavingCount--;
      if (showSavingCount === 0) {
        clearTimeout(showSavingTimeoutId);
        savingDiv.hide();
      }

      if (err !== undefined) {
        console.log("Error on network: " + err);
        errorDiv.show();
        setTimeout(function () {
          errorDiv.hide();
        }, 2000);
      }
    };

    let parseEvent = function (event, received, doIt) {
      if (event.action === "multiple") {
        let ok = true;
        for (const e of event.events) {
          e.live = event.live;
          if (!parseEvent(e, received, doIt)) {
            ok = false;
          }
        }
        return ok;
      }

      // console.log("Parsing event: " + JSON.stringify(event));

      if (doIt) {
        game.newsManager.handle(event, received);
      }

      if (event.action === "reset") {
        if (doIt) {
          launchInit();
        }
        return true;
      }
      if (
        event.action === "back" ||
        event.action === "forward" ||
        event.action === "seek" ||
        event.action === "clear"
      ) {
        if (doIt) {
          stopReadEvent();
          launchInit();
          launchReadEvent();
        }
        return true;
      }

      if (event.action === "ready") {
        if (doIt) {
          finishInit();
        }
        return;
      }

      if (event.action === "pool") {
        if (doIt) {
          game.gameManager.newPool(
            event.layout,
            event.name,
            event.properties,
            event.floating
          );
        }
        return true;
      }

      if (event.action === "paint") {
        let spot = game.spotManager.getSpot(event.location);
        if (spot !== null) {
          if (doIt) {
            spot.setItemState(event.kind, event.key, event.value);
          } else {
            let itemInstance = spot.getItemInstance(event.kind);
            return game.triggerManager.watchdog(
              "paint",
              spot,
              itemInstance,
              null,
              { key: event.key, value: event.value }
            );
          }
          return true;
        } else {
          return false;
        }
      }

      if (event.action === "drop") {
        let spot = game.spotManager.getSpot(event.location);
        if (spot !== null) {
          //%% if ((event.count === undefined) || (event.count > 0)) {
          //%% let itemInstance = spot.getItemInstance(event.kind);
          //%% if ((itemInstance === null) || !itemInstance.infinite || (event.kind === "live")) {
          if (doIt) {
            spot.addItem(event.kind, event.count, event.live);
          } else {
            let itemInstance = spot.getItemInstance(event.kind);
            return game.triggerManager.watchdog(
              "drop",
              spot,
              itemInstance,
              null,
              { item: game.itemManager.getItem(event.kind), count: event.count }
            );
          }
          //%% }
          //%% }
          return true;
        } else {
          return false;
        }
      }

      if (event.action === "destroy") {
        let spot = game.spotManager.getSpot(event.location);
        if (spot !== null) {
          //%% let itemInstance = spot.getItemInstance(event.kind);
          //%% if (itemInstance !== null) {
          //%% if (itemInstance.infinite || (event.count === undefined) || (itemInstance.count >= event.count)) {
          if (doIt) {
            spot.destroyItem(event.kind, event.count);
          } else {
            let itemInstance = spot.getItemInstance(event.kind);
            return game.triggerManager.watchdog(
              "destroy",
              spot,
              itemInstance,
              null,
              { count: event.count }
            );
          }
          //%% }
          //%% }
          return true;
        } else {
          return false;
        }
      }

      if (event.action === "move") {
        if (event.location === event.to) {
          let spot = game.spotManager.getSpot(event.location);
          if (spot !== null) {
            if (doIt) {
              spot.updateItem(event.kind, event.live);
            } else {
              let itemInstance = spot.getItemInstance(event.kind);
              return game.triggerManager.watchdog(
                "move",
                spot,
                itemInstance,
                spot,
                {}
              );
            }
            return true;
          } else {
            return false;
          }
        }

        let spot = game.spotManager.getSpot(event.location);
        if (spot !== null) {
          let itemInstance = spot.getItemInstance(event.kind);
          if (itemInstance !== null) {
            let to = game.spotManager.getSpot(event.to);
            if (to !== null) {
              if (doIt) {
                let state = itemInstance.state;
                spot.destroyItem(event.kind, event.count);
                if (state.count === undefined) {
                  to.addItem(event.kind, event.count, event.live);
                  for (const key in state) {
                    if (key.startsWith("auto_")) {
                      return;
                    }
                    to.setItemState(event.kind, key, state[key]);
                  }
                }
              } else {
                return game.triggerManager.watchdog(
                  "move",
                  spot,
                  itemInstance,
                  to,
                  { count: event.count }
                );
              }
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      if (event.action === "news") {
        if (doIt) {
          game.newsManager.appendLine(
            event.id,
            event.live,
            event.texts,
            event.reverse,
            event.reverseback
          );
        }
        return true;
      }
      if (event.action === "unnews") {
        if (doIt) {
          game.newsManager.lineReversed(event.id);
        }
        return true;
      }

      if (event.action === "play") {
        if (doIt && stackActivated) {
          let s = game.generalReference.getSound(event.sound);
          if (s !== null) {
            s.play();
          }
        }
        return true;
      }

      if (event.action === "log") {
        if (doIt) {
          game.logManager.log(event.message);
        }
        return true;
      }

      return true;
    };

    /*%%%
		let toRun = [];
		let toRunFinished = false;
		let requestToRunFinished = false;
		setInterval(function() {
			if (toRun.length > 0) {
				let f = toRun.shift();
				f();
			} else {
				if (requestToRunFinished) {
					toRunFinished = true;
				}
			}
		}, 50);
		let appendToRun = function(f) {
			if (toRunFinished) {
				f();
				return;
			}
			console.log("Delaying event");
			toRun.push(f);
		};

		toRunFinished = true; // Deactivate to replay in slow motion when reload
		*/

    let server = new FilteringServer(new Server("/" + Server.location().id));
    let hasEvents = false;

    launchInit = function () {
      hasEvents = false;
      stackActivated = false;
      game.loading(true);

      game.newsManager.clear();
      for (const key in game.spotManager._spots) {
        let s = game.spotManager._spots[key];
        for (const key2 in s._itemInstances) {
          s.destroyItem(s._itemInstances[key2].item.kind);
        }
      }
      game.gameManager.clear();
      game.chatManager.discardFriendMice();
      Layout.fit();
    };

    finishInit = function () {
      stackActivated = true;
      game.loading(false);

      Layout.fit();
    };

    let currentStopHeap = null;
    stopReadEvent = function () {
      if (currentStopHeap !== null) {
        currentStopHeap.set(true);
        currentStopHeap = null;
      }
    };
    launchReadEvent = function () {
      stopReadEvent();
      let stopHeap = new Heap(false);
      currentStopHeap = stopHeap;
      let eventHeap = new Heap();
      while_(false_(stopHeap))
        .do_(
          try_(
            sequence_(
              Server.fullHistory(server, eventHeap),
              // sleep_(0.1),
              block_(function () {
                let event = eventHeap.get();
                if (event.old !== undefined) {
                  if (event.old.length === 0) {
                    that._reset();
                  } else {
                    hasEvents = true;
                    for (let e of event.old) {
                      parseEvent(e, true, true);
                    }
                  }
                  Layout.fit();
                } else {
                  // if (event.action === "clear") {
                  // 	if (!hasEvents) {
                  // 		that._reset();
                  // 	}
                  // 	return;
                  // }
                  //TODO Do it better with FilteringServer and Server.fullHistory
                  if (
                    event.action === "back" ||
                    event.action === "forward" ||
                    event.action === "seek" ||
                    event.action === "clear"
                  ) {
                    stopReadEvent();
                    launchInit();
                    launchReadEvent();
                    return;
                  }

                  hasEvents = true;
                  parseEvent(event, true, true);
                  Layout.fit();
                }
              })
            )
          ).catch_(function (err) {
            showSaving();
            hideSaving(err);
          })
        )
        .run();
    };

    this._launch = function (init) {
      game.loading(true);

      gameInit = init;

      launchReadEvent();

      /*%%
			server.history().res(function(event) {
				// console.log("Received: " + JSON.stringify(event));

				// setTimeout(function() {
				if (event === null) {
					if (!hasEvents) {
						that._reset();
					}
					return;
				}

				hasEvents = true;
				parseEvent(event, true, true);
				Layout.fit();
				// }, 0);
			}).err(function(err) {
				showSaving();
				hideSaving(err);
			}).run();
			*/
    };

    let stack = function (event) {
      if (!stackActivated) {
        console.log(
          "Not possible to save any event during the configuration script"
        );
        return;
      }

      showSaving();

      if (event.live === undefined) {
        debugger;
      }
      server
        .stack(new Heap(event))
        .res(function () {
          hideSaving();
        })
        .err(function (err) {
          hideSaving(err);
        })
        .run();
    };

    this._stack = function (event, liveId) {
      if (liveId !== null) {
        event = {...event};
        event.live = liveId === undefined ? game.thisLiveId : liveId;
      }
      stack(event);
    };
    this._parse = function (event, liveId) {
      if (liveId !== null) {
        event = {...event};
        event.live = liveId === undefined ? game.thisLiveId : liveId;
      }
      parseEvent(event, false, true);
    };
    this._canParse = function (event) {
      return parseEvent(event, false, false);
    };

    this._reset = function () {
      let stackAndParse = function (e) {
        that._parse(e);
        stackActivated = true;
        that._stack(e);
      };

      stackAndParse({ action: "reset" });
      setTimeout(function () {
        if (gameInit !== null) {
          stackActivated = true;
          gameInit();
        }
        stackAndParse({ action: "ready" });
        stackAndParse({ action: "mark", mark: Server.uuid() });
      }, 100);
    };
    /*%%
		let that = this;
		this._reset = function() {
			let event = { action: "snapshot", live: game.thisLiveId };
			game.newsManager.handleAdmin(event);
			that.stack(event);
			clear();
			if (launchInit !== null) {
				launchInit();
			}
			Layout.fit();
		};
		this._mark = function() {
			let event = { action: "mark", live: game.thisLiveId };
			game.newsManager.handleAdmin(event);
			that.stack(event);
		};
		this._back = function() {
			let event = { action: "back", live: game.thisLiveId };
			game.newsManager.handleAdmin(event);
			that.stack(event);
		};
		this._forward = function() {
			let event = { action: "forward", live: game.thisLiveId };
			game.newsManager.handleAdmin(event);
			that.stack(event);
		};
		%%*/
  }

  /**
   * launches the Game's initialization
   * @param init
   */
  launch(init) {
    this._launch(init);
  }

  /**
   * reset's the Game
   */
  reset() {
    this._reset();
  }

  /*%%
	reset() {
		this._reset();
	}
	mark() {
		this._mark();
	}
	back() {
		this._back();
	}
	forward() {
		this._forward();
	}
%%*/
  /**
   * adds an event to the stack
   * @param event
   * @param liveId
   */
  stack(event, liveId) {
    console.log("Stacking: " + JSON.stringify(event));
    this._stack(event, liveId);
  }

  /**
   * parse given event
   * @param event
   * @param liveId
   */
  parse(event, liveId) {
    console.log("Parsing: " + JSON.stringify(event));
    this._parse(event, liveId);
  }

  /**
   * checks if parsing is possible for this event
   * @param event
   * @returns {boolean|boolean|*}
   */
  canParse(event) {
    return this._canParse(event);
  }
}

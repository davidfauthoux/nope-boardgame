import { UserInteraction } from "../UserInteraction.class.js";
import { Utils } from "../Utils.class.js";
import { Throttle } from "./Throttle.class.js";
import { ExecutionContext } from "./ExecutionContext.class.js";


export class DragAndDropManager {
  constructor(game) {
    this._game = game;

    var selectedItemInstance = null;
    var draggingItemInstance = null;
    var draggingDiv = null;

    var setAllSpotsHoverable = function () {
      for (const key in game.spotManager._spots) {
        let spot = game.spotManager._spots[key]
        spot.$.addClass("hoverable");
        for (const key2 in spot._itemInstances) {
          spot._itemInstances[key2].$.removeClass("hoverable");
        }
      }
    };
    var setAllItemsHoverable = function () {
      for (const key in game.spotManager._spots) {
        let spot = game.spotManager._spots[key]
        spot.$.removeClass("hoverable");
        for (const key2 in spot._itemInstances){
          let item = spot._itemInstances[key2];
          if (item.item.properties.steady === undefined) {
            item.$.addClass("hoverable");
          }
        }
      }
    };

    var unselect = function () {
      if (selectedItemInstance !== null) {
        selectedItemInstance.$.removeClass("selected");
        selectedItemInstance = null;
        game.chatManager.sendChat({
          type: "select",
        });
      }
      setAllItemsHoverable();
    };

    var selectItem = function (itemInstance) {
      console.log(
        "Item selected: " +
          itemInstance.item.kind +
          " in: " +
          itemInstance.spot.location
      );
      unselect();
      selectedItemInstance = itemInstance.spot.getItemInstance(
        itemInstance.item.kind
      );
      if (selectedItemInstance !== null) {
        selectedItemInstance.$.addClass("selected");
        setAllSpotsHoverable();

        game.chatManager.sendChat({
          type: "select",
          kind: selectedItemInstance.item.kind,
          spot: selectedItemInstance.spot.location,
        });
      }
    };

    var selectSpot = function (spot) {
      console.log("Spot selected: " + spot.location);
      if (selectedItemInstance === null && draggingItemInstance !== null) {
        selectItem(draggingItemInstance);
      }
      if (selectedItemInstance !== null) {
        var itemInstance = selectedItemInstance.spot.getItemInstance(
          selectedItemInstance.item.kind
        );

        var checkIfContains = function (instanceToCheck, ifContainsSpot) {
          var contains = false;
          Utils.each(instanceToCheck._extraSpots, function (iiExtraSpot) {
            if (contains) {
              return true;
            }
            if (iiExtraSpot.location === ifContainsSpot.location) {
              contains = true;
            }
            if (contains) {
              return;
            }
            for (const key in iiExtraSpot._itemInstances){
              if (contains) {
                return;
              }
              if (checkIfContains(iiExtraSpot._itemInstances[key], ifContainsSpot)) {
                contains = true;
              }
            }
          });
          return contains;
        };
        if (checkIfContains(itemInstance, spot)) {
          itemInstance = null;
        }

        if (itemInstance !== null) {
          if (itemInstance.infinite) {
            console.log(
              "Item dropped: " +
                selectedItemInstance.item.kind +
                " to: " +
                spot.location
            );
            ExecutionContext.stackAndTrigger(
              game,
              {
                action: "drop",
                kind: selectedItemInstance.item.kind,
                location: spot.location,
                count: 1,
              },
              null,
              spot,
              selectedItemInstance.item
            );
          } else {
            // if (selectedItemInstance.spot.location !== spot.location) {
            console.log(
              "Item moved: " +
                selectedItemInstance.item.kind +
                " from: " +
                selectedItemInstance.spot.location +
                " to: " +
                spot.location
            );
            ExecutionContext.stackAndTrigger(
              game,
              {
                action: "move",
                kind: selectedItemInstance.item.kind,
                location: selectedItemInstance.spot.location,
                to: spot.location,
                count: 1,
              },
              selectedItemInstance.spot,
              spot,
              selectedItemInstance.item
            );
          }
        }
      }

      unselect();
    };

    var createDragging = function (position, itemInstance) {
      unselect();

      if (itemInstance.item.properties.random !== undefined) {
        var items = [];
        for (const key in itemInstance._itemInstances){
          let itemInSpot = itemInstance._itemInstances[key]
          if (
              itemInSpot.item.properties.random !== undefined ||
              itemInSpot.item.properties.script !== undefined ||
              itemInSpot.item.infinite ||
              itemInSpot.item.properties.hidden !== undefined
          ) {
            return;
          }
          Utils.loop(0, itemInSpot.count, 1, function () {
            items.push(itemInSpot);
          });
        }
        if (items.length === 0) {
          // If spot empty, we can drag the "random" item
        } else {
          itemInstance = items[Utils.random(items.length)];
        }
      }

      var overlayLayout = game.overlay.overlay();
      draggingItemInstance = itemInstance.item.createInstance(
        overlayLayout.packed(),
        false,
        null
      );
      draggingItemInstance.spot = itemInstance.spot;
      draggingDiv = overlayLayout.$.addClass("drag");

      selectItem(draggingItemInstance);

      game.chatManager.sendChat({
        type: "drag",
        kind: draggingItemInstance.item.kind,
      });
    };

    var updateDragging = function (position, itemInstance) {
      if (draggingDiv !== null) {
        var mousePoint = game.overlay.mouse(position);
        // console.log("Dragging " + mousePoint.x + ", " + mousePoint.y);
        draggingDiv.css({
          top: mousePoint.y,
          left: mousePoint.x,
        });
      }
    };

    var destroyDragging = function () {
      if (draggingItemInstance !== null) {
        draggingDiv.remove();
        game.chatManager.sendChat({
          type: "drag",
        });
      }
      draggingDiv = null;
      draggingItemInstance = null;
    };

    /*%%%%%%%%
		var body = $("body");

		var sendChatThrottle = new Throttle();
		var sendChat = function(m) {
			sendChatThrottle.execute(function() {
				game.chatManager.sendChat(m);
			});
		};

		this._currentlyHover = null;
		var currentlyHoverId = null;
		this._currentlyHoverLocation = undefined;

		var detectMoveDiv = null;
		var detectMovePosition = null;

		this._catchingTouch = false;
		this._touchstartTimeoutId = null;

		var detectMoveThrottle = new Throttle();

		this._mousemoveHandler = function(position, target) {
			var mousePoint = game.overlay.mouse(position);
			if (draggingItemInstance !== null) {
				if ((draggingMousePoint === null) || ((Math.abs(draggingMousePoint.x - mousePoint.x) + Math.abs(draggingMousePoint.y - mousePoint.y)) > 10)) {
					if (draggingMousePoint !== null) {
						startDragging();
						draggingDiv.show();
					}

					draggingDiv.css({
						top: mousePoint.y,
						left: mousePoint.x
					});
				}
			}

			detectMoveDiv = target;
			detectMovePosition = mousePoint;
			detectMoveThrottle.execute(function() {
				//%% game.chatManager.checkHover(detectMovePosition);

				var hoveringDiv = detectMoveDiv;

				if (that._catchingTouch) {
					var hoveringLocation = hoveringDiv.attr("data-location");
					if (hoveringLocation === undefined) {
						hoveringLocation = hoveringDiv.closest("[data-location]").attr("data-location");
					}
					that._currentlyHoverLocation = hoveringLocation;
				} else {
					that._currentlyHoverLocation = undefined;
				}

				var hoveringDivId = hoveringDiv.attr("data-id");
				if (hoveringDivId === undefined) {
					hoveringDiv = hoveringDiv.closest(".hoverable");
					hoveringDivId = hoveringDiv.attr("data-id");
				}
				if ((hoveringDivId !== undefined) && !hoveringDiv.hasClass("destroyed") && (hoveringDivId !== currentlyHoverId)) {
					if (that._catchingTouch) {
						if (that._currentlyHover !== null) {
							that._currentlyHover.removeClass("hover");
						}
					}
					that._currentlyHover = hoveringDiv;
					currentlyHoverId = hoveringDivId;

					if (that._catchingTouch) {
						that._currentlyHover.addClass("hover");
					}
				}

				if (that._currentlyHover !== null) {
					var p = game.overlay.offset(that._currentlyHover);
					if (p) {
						sendChat({
							type: "move",
							x: Math.round(detectMovePosition.x - p.x),
							y: Math.round(detectMovePosition.y - p.y),
							ref: currentlyHoverId
						});
					}
				}

				detectMoveDiv = null;
				detectMovePosition = null;
			});
		};
		body.mousemove(function(e) {
			that._mousemoveHandler({ pageX: e.pageX, pageY: e.pageY }, $(e.target));
		});

		var cancelDragging;
		var cancelDraggingTimeoutId = null;
		var clearDelayCancelDragging = function() {
			if (cancelDraggingTimeoutId !== null) {
				clearTimeout(cancelDraggingTimeoutId);
				cancelDraggingTimeoutId = null;
			}
		};
		var delayCancelDragging = function() {
			clearDelayCancelDragging();
			cancelDraggingTimeoutId = setTimeout(cancelDragging, 250);
		};
		cancelDragging = function() {
			clearDelayCancelDragging();
			that._currentlyHoverLocation = undefined;
			that._destroyDragging();
			unselect();
		};
		this._bodyMouseupHandler = function() {
			if (selectedItemInstance !== null) {
				return;
			}
			cancelDragging();
		};
		this._unconfigureBodyMouseup = function() {
			body.off("mouseup", that._bodyMouseupHandler);
		};
		this._reconfigureBodyMouseup = function() {
			body.mouseup(that._bodyMouseupHandler);
		};
		this._mouseupHandler = function(spot) {
			clearDelayCancelDragging();
			that._selectSpot(spot);
			that._destroyDragging();
		};
		this._mousedownHandler = function(position, itemInstance, instantDrag) {

			// After a user interaction, all of this can be unmuted
			VideoIcon.unmute();
			Sound.unmute();

			clearDelayCancelDragging();
			cancelDragging();
			that._createDragging(position, itemInstance);
			if (instantDrag) {
				var mousePoint = game.overlay.mouse(position);
				startDragging();
				draggingDiv.css({
					top: mousePoint.y,
					left: mousePoint.x
				}).show();
			}
		};

		var findClosestHoverable = function(event, excludeCurrent) {
			var d = $(event.target);
			if (excludeCurrent) {
				d = d.parent();
			}
			while (true) {
				if (d.length === 0) {
					return null;
				}
				var id = d.attr("data-id");
				if (id && d.hasClass("hoverable") && !d.hasClass("destroyed")) {
					return id;
				}
				d = d.closest(".hoverable");
			}
		}

		var toSendHover = null;
		var lastSendHover = null;
		var sendHoverThrottle = new Throttle();
		var sendHoverToChatAndTrigger = function() {
			game.triggerManager.hover(toSendHover);
			sendHoverThrottle.execute(function() {
				if (toSendHover !== lastSendHover) {
					game.chatManager.sendChat({
						type: "over",
						ref: (toSendHover === null) ? undefined : toSendHover
					});
					lastSendHover = toSendHover;
				}
			});
		};
		this._onOverOut = function(out) {
			return function(event) {
				// Fix Safari :(
				if (out) {
					$(event.target).removeClass("hover");
				} else {
					$(event.target).addClass("hover");
				}

				if (out) {
					toSendHover = null;
					sendHoverToChatAndTrigger();
					return;
				}

				var hoveringDivId = findClosestHoverable(event, false);
				if (hoveringDivId !== null) {
					toSendHover = hoveringDivId;
					sendHoverToChatAndTrigger();
					return;
				}

				if (that._sendHover !== null) {
					toSendHover = null;
					sendHoverToChatAndTrigger();
				}
			};
		};

		body.mousedown(delayCancelDragging);
		body[0].addEventListener("touchstart", delayCancelDragging);
		this._reconfigureBodyMouseup();
%%%%%%%%%%%%%*/
    //

    var sendChatThrottle = new Throttle();
    var sendMousePositionToChat = function (position, d) {
      sendChatThrottle.execute(function () {
        var mousePoint = game.overlay.mouse(position);
        var offset = game.overlay.offset(d);
        var id = d.attr("data-id");
        game.chatManager.sendChat({
          type: "move",
          x: Math.round(mousePoint.x - offset.x),
          y: Math.round(mousePoint.y - offset.y),
          ref: id,
        });
      });
    };

    var sendHoverToChat = function (d) {
      if (d === undefined || !d.hasClass("hoverable")) {
        game.chatManager.sendChat({
          type: "over",
        });
        return;
      }

      var id = d.attr("data-id");
      game.chatManager.sendChat({
        type: "over",
        ref: id,
      });
    };

    var cancelDragging = function () {
      destroyDragging();
      unselect();
    };

    this._spotReleased = function (spot) {
      selectSpot(spot);
      destroyDragging();
    };
    this._spotHoverOn = function (position, spot) {
      sendHoverToChat(spot.$);
      game.triggerManager.hoverOnSpot(spot);
    };
    this._spotHoverOff = function (spot) {
      sendHoverToChat();
      game.triggerManager.hoverOff();
    };
    this._spotHoverMove = function (position, spot) {
      sendMousePositionToChat(position, spot.$);
    };
    this._itemPressed = function (position, itemInstance) {
      cancelDragging();
      createDragging(position, itemInstance);
      updateDragging(position, itemInstance);
    };
    this._itemMoved = function (position, itemInstance) {
      updateDragging(position, itemInstance);
    };
    this._itemReleased = function (itemInstance) {
      cancelDragging();
    };
    this._itemClicked = function (itemInstance) {
      selectItem(itemInstance);
      selectSpot(itemInstance.spot);
    };
    this._itemHoverOn = function (position, itemInstance) {
      sendHoverToChat(itemInstance.$);
      game.triggerManager.hoverOnItem(itemInstance);
    };
    this._itemHoverOff = function (itemInstance) {
      sendHoverToChat();
      game.triggerManager.hoverOff();
    };
    this._itemHoverMove = function (position, itemInstance) {
      sendMousePositionToChat(position, itemInstance.$);
    };
  }

  configureSpot(spot) {
    var that = this;
    /*%%%%%%%%%%%%%%%%%%%%%%%%%
		var div = spot.$;
		// div.off();

		this._unconfigureBodyMouseup(); // To reorder the handlers
		div.mouseup(function(e) {
			if (e.which !== 1) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			that._mouseupHandler(spot);
		});
		this._reconfigureBodyMouseup(); // To reorder the handlers

		div
			.mouseover(this._onOverOut(false)).mouseout(this._onOverOut(true))
			.mouseenter(this._onOverOut(false)).mouseleave(this._onOverOut(true))
		;
		*/

    UserInteraction.get().release(spot.$, function () {
      console.log("Spot released: " + spot.location);
      that._spotReleased(spot);
    });

    UserInteraction.get().hover(
      spot.$,
      function (e) {
        that._spotHoverOn(e, spot);
      },
      function () {
        that._spotHoverOff(spot);
      },
      function (e) {
        that._spotHoverMove(e, spot);
      }
    );
  }
  unconfigureSpot(spot) {
    UserInteraction.get().off(spot.$);
  }

  configureItemInstance(itemInstance) {
    var that = this;
    itemInstance.$.addClass("hoverable");

    /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
		var div = itemInstance.$;
		//%% if (itemInstance.item.properties.steady === undefined) {

		div.mousedown(function(e) {
			if (e.which !== 1) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			that._mousedownHandler({ pageX: e.pageX, pageY: e.pageY }, itemInstance, false);
		});

		div[0].addEventListener("touchstart", function(e) {
			if (that._catchingTouch) {
				return;
			}
			if (e.touches.length === 0) {
				return;
			}
			if (e.touches.length > 1) {
				return;
			}
			if (that._touchstartTimeoutId !== null) {
				return;
			}
			var t = e.touches[0];
			var position = { pageX: t.pageX, pageY: t.pageY };
			that._touchstartTimeoutId = setTimeout(function() {
				that._catchingTouch = true;
				that._currentlyHoverLocation = undefined;
				that._mousedownHandler(position, itemInstance, true);
			}, 200);
		}, { passive: false });

		var touchEnd = function() {
			if (that._touchstartTimeoutId !== null) {
				clearTimeout(that._touchstartTimeoutId);
				that._touchstartTimeoutId = null;
			}

			if (that._catchingTouch) {
				if (that._currentlyHoverLocation !== undefined) {
					var spot = that._game.spotManager.getSpot(that._currentlyHoverLocation);
					if (spot !== null) {
						that._mouseupHandler(spot);
					}
				}
				that._catchingTouch = false;
				if (that._currentlyHover !== null) {
					that._currentlyHover.removeClass("hover");
				}
			}

			that._bodyMouseupHandler();
		};
		div[0].addEventListener("touchend", touchEnd, { passive: false });
		div[0].addEventListener("touchcancel", touchEnd, { passive: false });

		div[0].addEventListener("touchmove", function(e) {
			if (that._touchstartTimeoutId !== null) {
				clearTimeout(that._touchstartTimeoutId);
				that._touchstartTimeoutId = null;
			}
			if (!that._catchingTouch) {
				return;
			}
			if (e.touches.length === 0) {
				return;
			}
			var t = e.touches[0];
			that._mousemoveHandler({ pageX: t.pageX, pageY: t.pageY }, $(document.elementFromPoint(t.clientX, t.clientY)));
			e.preventDefault();
			e.stopPropagation();
		}, { passive: false });

		//%% }
		div
			.mouseover(this._onOverOut(false)).mouseout(this._onOverOut(true))
			.mouseenter(this._onOverOut(false)).mouseleave(this._onOverOut(true))
		;
		*/

    UserInteraction.get().drag(
      itemInstance.$,
      function (e) {
        that._itemPressed(e, itemInstance);
      },
      function (e) {
        that._itemMoved(e, itemInstance);
      },
      function () {
        that._itemReleased(itemInstance);
      }
    );

    UserInteraction.get().click(itemInstance.$, function () {
      console.log("Item clicked: " + itemInstance.item.kind);
      that._itemClicked(itemInstance);
    });

    UserInteraction.get().hover(
      itemInstance.$,
      function (e) {
        that._itemHoverOn(e, itemInstance);
      },
      function () {
        that._itemHoverOff(itemInstance);
      },
      function (e) {
        that._itemHoverMove(e, itemInstance);
      }
    );
  }
  unconfigureItemInstance(itemInstance) {
    UserInteraction.get().off(itemInstance.$);
  }
}

"use strict"

class Spot {
	constructor(layout, game, location, properties, underlay) {
		var that = this;

		this.location = location;

		this.properties = properties;
		this.state = {};
		this._itemInstances = {};

		var div = layout;

		var itemLayout;
		var updateItemPositions;
		var removeItem;
		if (properties.layout === "stack") {
			var itemsLayout = div.packed().overlay();
			itemsLayout.$.addClass("stack");
			itemLayout = function() {
				return itemsLayout.overlay().packed();
			};
			updateItemPositions = function() {
				var widthToDivide = 0.3; // 30%
				var children = [];
				var randomFound = null;
				Utils.each(that._itemInstances, function(i) {
					if ((i.item.properties.hidden === undefined) && (i.item.properties.invisible === undefined)) {
						children.push(i);
					}
					if (i.item.properties.random !== undefined) {
						randomFound = i;
					}
				});
				if (randomFound !== null) {
					var filtered = [];
					Utils.each(children, function(i) {
						if (i.infinite || (i === randomFound)) {
							filtered.push(i);
						}
					});
					children = filtered;
				}
				var n = children.length;
				if (n === 0) {
					return;
				}
				if (n === 1) {
					children[0].$.parent().css({
						left: 0,
						top: 0
					});
					return;
				}
				Utils.each(children, function(i, k) {
					var angle = (Math.PI / 2) + ((Math.PI * 2.0 / n) * k);
					i.$.parent().css({
						left: Math.round((Math.cos(angle) * 100 * widthToDivide)) + "%",
						top: Math.round((Math.sin(angle) * 100 * widthToDivide)) + "%"
					});
				});
			};
			removeItem = function(i) {
				i.$.parent().remove(); //TODO Upgrade Layout class to handle remove/addClass/removeClass/attr on set()
				updateItemPositions();
			};
		} else {
			var cellLayout;
			if (properties.layout === "vertical") {
				cellLayout = div.vertical();
			} else {
				cellLayout = div.horizontal();
			}
			itemLayout = function() {
				return cellLayout.add();
			};
			updateItemPositions = function() {
				var stackableItems = [];
				Utils.each(that._itemInstances, function(i) {
					if (i.item.properties.stackable !== undefined) {
						stackableItems.push(i);
					}
				});
				Utils.each(stackableItems, function(i, ii) {
					if (ii < (stackableItems.length - 1)) {
						i.$.addClass("stacking");
					} else {
						i.$.removeClass("stacking");
					}
				});
			};
			removeItem = function(i) {
				i.$.remove();
				updateItemPositions();
			};
		}

		div.$.addClass("spot").attr("data-location", location).attr("data-id", "spot:" + location);
		Utils.each(properties, function(_, k) {
			if (k !== "layout") {
				div.$.addClass("property-" + k);
			}
		});

		var overlayDiv = layout.underlay();
		overlayDiv.$.addClass("overlay");

		if (underlay !== undefined) {
			var underlayDiv = layout.underlay();
			underlayDiv.set(underlay);
			underlayDiv.$.addClass("underlay");
		}

		this.$ = div.$;

		var updateRandom = function() {
			var randomFound = null;
			var total = 0;
			Utils.each(that._itemInstances, function(i) {
				if ((i.item.properties.random !== undefined) && !i.infinite) {
					randomFound = i;
				} else if ((i.item.properties.hidden === undefined) && !i.infinite) {
					total += i.count;
				}
			});
			div.$.removeClass("random");
			if (randomFound !== null) {
				div.$.addClass("random");
				randomFound.setState("auto_flag", "" + total);
			}
		};

		var destroy = function(instance) {
			if (instance.faceIcon !== null) {
				instance.faceIcon.destroy();
				game.friendFaces.remove(instance.faceIcon);
			}

			instance.spot = null;
			//%% instance.$.addClass("destroyed"); // In case it is cached somewhere
			game.dragAndDropManager.unconfigureItemInstance(instance);
			removeItem(instance);
		};

		var updateOverlays = function() {
			var overlayFound = new Multimap.Array();
			Utils.each(that._itemInstances, function(i) {
				if (i.item.properties.overlay !== undefined) {
					var consideredKind;
					var generalKinds = GeneralReference.getGeneralKinds(i.item.kind);
					if (generalKinds.length === 0) {
						consideredKind = i.item.kind;
					} else {
						consideredKind = generalKinds[generalKinds.length - 1].kind;
					}
					overlayFound.get(consideredKind).add(i);
					i.$.removeClass("overlayed");
				}
			});
			overlayDiv.$.empty();
			overlayFound.each(function(overlayFoundPerKind, k) {
				// console.log("Found overlay [" + k + "] " + overlayFoundPerKind[0].item.kind + " (" + overlayFoundPerKind[0].count + ")");
				if (overlayFoundPerKind.length === 1) {
					var onlyOverlayFoundPerKind = overlayFoundPerKind[0];
					if (
						((properties.overlayable !== undefined) && (onlyOverlayFoundPerKind.count === 1))
						||
						((onlyOverlayFoundPerKind.item.properties.invisible !== undefined) && onlyOverlayFoundPerKind.infinite)
					) {
						onlyOverlayFoundPerKind.item.createInstance(overlayDiv.overlay(), false, onlyOverlayFoundPerKind.liveId);
						onlyOverlayFoundPerKind.$.addClass("overlayed");
					}
				}
			});
		};

		var updateModifiers = function() {
			var modifierFound = new Multimap.Array();
			Utils.each(that._itemInstances, function(i) {
				if (i.infinite) {
					return;
				}
				if (i.count !== 1) {
					return;
				}
				Utils.each(i.item.modifiers, function(v, k) {
					modifierFound.get(k).add(v);
				});
			});
			that.state = {};
			modifierFound.each(function(a, k) {
				var s = null;
				Utils.each(a, function(v) {
					s = v;
				});
				that.state[k] = s; // Let's keep only the last one
			});
			DomUtils.eachClass(div.$, function(c) {
				if (c.startsWith("state-")) {
					div.$.removeClass(c);
				}
			});
			Utils.each(that.state, function(v, k) {
				div.$.addClass("state-" + k + "-" + v);
			});
		};

		this._destroyItem = function(kind, count) {
			// console.log("Destroying " + kind + " from " + location + " (" + count + ")");
			if (kind === undefined) {
				Utils.each(that._itemInstances, function(i) {
					destroy(i);
				});
				that._itemInstances = {};
				updateOverlays();
				updateRandom();
				updateModifiers();
			} else {
				var existingItemInstance = that._itemInstances[kind];
				if (existingItemInstance === undefined) {
					return;
				}
				if (count === undefined) {
					delete that._itemInstances[kind];
					destroy(existingItemInstance);
				} else {
					if (!existingItemInstance.infinite) {
						existingItemInstance.inc(-count);
						if (!Utils.contains(existingItemInstance.state, "count") && (existingItemInstance.count === 0)) {
							delete that._itemInstances[existingItemInstance.item.kind];
							destroy(existingItemInstance);
						}
					}
				}
				if (existingItemInstance.item.properties.overlay !== undefined) {
					updateOverlays();
				}
				if (!Utils.empty(existingItemInstance.item.modifiers)) {
					updateModifiers();
				}
				//if (existingItemInstance.item.properties.random !== undefined) {
				updateRandom();
				//}
			}
		};

		this._setItemState = function(kind, key, value) {
			var existingItemInstance = that._itemInstances[kind];
			if (existingItemInstance === undefined) {
				return;
			}
			existingItemInstance.setState(key, value);
		};

		this._addItem = function(kind, count, liveId) {
			// console.log("Adding " + kind + " to " + location + " (" + count + ") " + liveId);

			var existingItemInstance = that._itemInstances[kind];
			if ((existingItemInstance !== undefined) && (existingItemInstance.faceIcon !== null)) {
				existingItemInstance.faceIcon.update(null, liveId);
				game.friendFaces.remove(existingItemInstance.faceIcon);
				if (existingItemInstance.liveId !== liveId) {
					existingItemInstance.setLiveId(liveId);
					game.friendFaces.add(existingItemInstance.faceIcon);
				} else {
					existingItemInstance.setLiveId();
				}
				/*
				if (existingItemInstance.infinite) {
					count = undefined;
				}
				delete that._itemInstances[kind];
				destroy(existingItemInstance);
				existingItemInstance = undefined;
				*/
			}

			if (existingItemInstance === undefined) {
				var item = game.itemManager.getItem(kind);

				if (item !== null) {
					if ((item.properties.unique !== undefined) && (count !== undefined)) {
						Utils.each(that._itemInstances, function(i) {
							if ((i.item.properties.unique === item.properties.unique) && !i.infinite) {
								delete that._itemInstances[i.item.kind];
								destroy(i);
							}
						});
					}

					existingItemInstance = item.createInstance(itemLayout(), true, liveId);
					existingItemInstance.spot = that;
					that._itemInstances[kind] = existingItemInstance;
					existingItemInstance.$.attr("data-location", location).attr("data-id", "item:" + location + ":" + kind);
					if (item.properties.steady === undefined) {
						//%% existingItemInstance.$.addClass("hoverable");
						game.dragAndDropManager.configureItemInstance(existingItemInstance);
					}

					if (existingItemInstance.faceIcon !== null) {
						existingItemInstance.setLiveId(); // Initialized deactivated
						// game.friendFaces.add(existingItemInstance.faceIcon);
					}
					updateItemPositions();
				} else {
					existingItemInstance = null;
				}
			}
			if (existingItemInstance !== null) {
				if (count === undefined) {
					existingItemInstance.setInfinite();
				} else {
					existingItemInstance.inc(count);
				}

				if (existingItemInstance.item.properties.overlay !== undefined) {
					updateOverlays();
				}
				if (!Utils.empty(existingItemInstance.item.modifiers)) {
					updateModifiers();
				}
				//if (existingItemInstance.item.properties.random !== undefined) {
				updateRandom();
				//}
			}
		};

		this._updateItem = function(kind, liveId) {
			var existingItemInstance = that._itemInstances[kind];
			if ((existingItemInstance === undefined) || (existingItemInstance.faceIcon === null)) {
				return;
			}
			if (existingItemInstance.liveId !== undefined) {
				game.friendFaces.remove(existingItemInstance.faceIcon);
			}
			existingItemInstance.faceIcon.update(null, liveId);
			if (existingItemInstance.liveId !== liveId) {
				existingItemInstance.setLiveId(liveId);
				game.friendFaces.add(existingItemInstance.faceIcon);
			} else {
				existingItemInstance.setLiveId();
			}
		};

		this._destroy = function() {
			//%% that.$.addClass("destroyed");
			that.$.remove();
		};
	}

	setItemState(kind, key, value) {
		this._setItemState(kind, key, value);
	}

	addItem(kind, count, liveId) {
		this._addItem(kind, count, liveId);
	}

	updateItem(kind, liveId) {
		this._updateItem(kind, liveId);
	}

	destroyItem(kind, count) {
		this._destroyItem(kind, count);
	}

	getItemInstance(kind) {
		return this._itemInstances[kind] || null;
	}

	eachItemInstances(callback) {
		Utils.each(this._itemInstances, callback);
	}

	empty() {
		return Utils.empty(this._itemInstances);
	}

	destroy() {
		this._destroy();
	}
}

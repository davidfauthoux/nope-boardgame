import { Utils } from "../Utils.class.js";
import { GeneralReference } from "./GeneralReference.class.js";
import { Multimap } from "../Multimap.class.js";
import { DomUtils } from "../DomUtils.class.js";

export class Spot {
  /**
   * creates a new Spot (location,properties,underlay) from a Layout in a given Game
   * @param layout
   * @param game
   * @param location
   * @param properties
   * @param underlay
   */
  constructor(layout, game, location, properties, underlay) {
    let that = this;

    this.location = location;

    this.properties = properties;
    this.state = {};
    this._itemInstances = {};

    let div = layout;

    let itemLayout;
    let updateItemPositions;
    let removeItem;
    if (properties.layout === "stack") {
      let itemsLayout = div.packed().overlay();
      itemsLayout.$.addClass("stack");
      itemLayout = function () {
        return itemsLayout.overlay().packed();
      };
      updateItemPositions = function () {
        let widthToDivide = 0.3; // 30%
        let children = [];
        let randomFound = null;
        for (const key in that._itemInstances) {
          let i = that._itemInstances[key];
          if (
              i.item.properties.hidden === undefined &&
              i.item.properties.invisible === undefined
          ) {
            children.push(i);
          }
          if (i.item.properties.random !== undefined) {
            randomFound = i;
          }
        }
        if (randomFound !== null) {
          let filtered = [];
          for (const i of children) {
            if (i.infinite || i === randomFound) {
              filtered.push(i);
            }
          }
          children = filtered;
        }
        let n = children.length;
        if (n === 0) {
          return;
        }
        if (n === 1) {
          children[0].$.parent().css({
            left: 0,
            top: 0,
          });
          return;
        }
        for (const key in children) {
          let angle = Math.PI / 2 + ((Math.PI * 2.0) / n) * key;
          children[key].$.parent().css({
            left: Math.round(Math.cos(angle) * 100 * widthToDivide) + "%",
            top: Math.round(Math.sin(angle) * 100 * widthToDivide) + "%",
          });
        }
      };
      removeItem = function (i) {
        i.$.parent().remove(); //TODO Upgrade Layout class to handle remove/addClass/removeClass/attr on set()
        updateItemPositions();
      };
    } else {
      let cellLayout;
      if (properties.layout === "vertical") {
        cellLayout = div.vertical();
      } else {
        cellLayout = div.horizontal();
      }
      itemLayout = function () {
        return cellLayout.add();
      };
      updateItemPositions = function () {
        let stackableItems = [];
        for (const key in that._itemInstances) {
          if (that._itemInstances[key].item.properties.stackable !== undefined) {
            stackableItems.push(that._itemInstances[key]);
          }
        }
        for (const key in stackableItems) {
          if (key < stackableItems.length - 1) {
            stackableItems[key].$.addClass("stacking");
          } else {
            stackableItems[key].$.removeClass("stacking");
          }
        }
      };
      removeItem = function (i) {
        i.$.remove();
        updateItemPositions();
      };
    }

    div.$.addClass("spot")
      .attr("data-location", location)
      .attr("data-id", "spot:" + location);
    for (const key in properties) {
      if (key !== "layout") {
        div.$.addClass("property-" + key);
      }
    }

    let overlayDiv = layout.underlay();
    overlayDiv.$.addClass("overlay");

    if (underlay !== undefined) {
      let underlayDiv = layout.underlay();
      underlayDiv.set(underlay);
      underlayDiv.$.addClass("underlay");
    }

    this.$ = div.$;

    let updateRandom = function () {
      let randomFound = null;
      let total = 0;
      for (const key in that._itemInstances) {
        let i = that._itemInstances[key];
        if (i.item.properties.random !== undefined && !i.infinite) {
          randomFound = i;
        } else if (i.item.properties.hidden === undefined && !i.infinite) {
          total += i.count;
        }
      }
      div.$.removeClass("random");
      if (randomFound !== null) {
        div.$.addClass("random");
        randomFound.setState("auto_flag", "" + total);
      }
    };
    /**
     * destroys the infos in the given instance
     * @param instance
     */
    let destroy = function (instance) {
      if (instance.faceIcon !== null) {
        instance.faceIcon.destroy();
        game.friendFaces.remove(instance.faceIcon);
      }

      instance.spot = null;
      //%% instance.$.addClass("destroyed"); // In case it is cached somewhere
      game.dragAndDropManager.unconfigureItemInstance(instance);
      removeItem(instance);
    };
    /**
     * update the spot Overlays
     */
    let updateOverlays = function () {
      let overlayFound = new Multimap.Array();
      for (const key in that._itemInstances) {
        let i = that._itemInstances[key];
        if (i.item.properties.overlay !== undefined) {
          let consideredKind;
          let generalKinds = GeneralReference.getGeneralKinds(i.item.kind);
          if (generalKinds.length === 0) {
            consideredKind = i.item.kind;
          } else {
            consideredKind = generalKinds[generalKinds.length - 1].kind;
          }
          overlayFound.get(consideredKind).add(i);
          i.$.removeClass("overlayed");
        }
      }
      overlayDiv.$.empty();
      overlayFound.each(function (overlayFoundPerKind, k) {
        // console.log("Found overlay [" + k + "] " + overlayFoundPerKind[0].item.kind + " (" + overlayFoundPerKind[0].count + ")");
        if (overlayFoundPerKind.length === 1) {
          let onlyOverlayFoundPerKind = overlayFoundPerKind[0];
          if (
            (properties.overlayable !== undefined &&
              onlyOverlayFoundPerKind.count === 1) ||
            (onlyOverlayFoundPerKind.item.properties.invisible !== undefined &&
              onlyOverlayFoundPerKind.infinite)
          ) {
            onlyOverlayFoundPerKind.item.createInstance(
              overlayDiv.overlay(),
              false,
              onlyOverlayFoundPerKind.liveId
            );
            onlyOverlayFoundPerKind.$.addClass("overlayed");
          }
        }
      });
    };
    /**
     * update the spots modifiers
     */
    let updateModifiers = function () {
      let modifierFound = new Multimap.Array();
      for (const key in that._itemInstances) {
        let i = that._itemInstances[key];
        if (i.infinite) {
          return;
        }
        if (i.count !== 1) {
          return;
        }
        for (const key in i.item.modifiers) {
          modifierFound.get(key).add(i.item.modifiers[key]);
        }
      }
      that.state = {};
      modifierFound.each(function (a, k) {
        let s = null;
        for (const v of a) {
          s = v;
        }
        that.state[k] = s; // Let's keep only the last one
      });
      DomUtils.eachClass(div.$, function (c) {
        if (c.startsWith("state-")) {
          div.$.removeClass(c);
        }
      });
      for (const key in that.state) {
        div.$.addClass("state-" + key + "-" + that.state[key]);
      }
    };

    this._destroyItem = function (kind, count) {
      // console.log("Destroying " + kind + " from " + location + " (" + count + ")");
      if (kind === undefined) {
        for (const i of that._itemInstances) {
          destroy(i)
        }
        that._itemInstances = {};
        updateOverlays();
        updateRandom();
        updateModifiers();
      } else {
        let existingItemInstance = that._itemInstances[kind];
        if (existingItemInstance === undefined) {
          return;
        }
        if (count === undefined) {
          delete that._itemInstances[kind];
          destroy(existingItemInstance);
        } else {
          if (!existingItemInstance.infinite) {
            existingItemInstance.inc(-count);
            if (!("count" in existingItemInstance.state) &&
              existingItemInstance.count === 0
            ) {
              delete that._itemInstances[existingItemInstance.item.kind];
              destroy(existingItemInstance);
            }
          }
        }
        if (existingItemInstance.item.properties.overlay !== undefined) {
          updateOverlays();
        }
        if ($.isEmptyObject(existingItemInstance.item.modifiers)) {
          updateModifiers();
        }
        //if (existingItemInstance.item.properties.random !== undefined) {
        updateRandom();
        //}
      }
    };

    this._setItemState = function (kind, key, value) {
      let existingItemInstance = that._itemInstances[kind];
      if (existingItemInstance === undefined) {
        return;
      }
      existingItemInstance.setState(key, value);
    };

    this._addItem = function (kind, count, liveId) {
      // console.log("Adding " + kind + " to " + location + " (" + count + ") " + liveId);

      let existingItemInstance = that._itemInstances[kind];
      if (
        existingItemInstance !== undefined &&
        existingItemInstance.faceIcon !== null
      ) {
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
        let item = game.itemManager.getItem(kind);

        if (item !== null) {
          if (item.properties.unique !== undefined && count !== undefined) {
            for (const i of that._itemInstances) {
              if (
                  i.item.properties.unique === item.properties.unique &&
                  !i.infinite
              ) {
                delete that._itemInstances[i.item.kind];
                destroy(i);
              }
            }
          }

          existingItemInstance = item.createInstance(
            itemLayout(),
            true,
            liveId
          );
          existingItemInstance.spot = that;
          that._itemInstances[kind] = existingItemInstance;
          existingItemInstance.$.attr("data-location", location).attr(
            "data-id",
            "item:" + location + ":" + kind
          );
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
        if ($.isEmptyObject(existingItemInstance.item.modifiers)) {
          updateModifiers();
        }
        //if (existingItemInstance.item.properties.random !== undefined) {
        updateRandom();
        //}
      }
    };

    this._updateItem = function (kind, liveId) {
      let existingItemInstance = that._itemInstances[kind];
      if (
        existingItemInstance === undefined ||
        existingItemInstance.faceIcon === null
      ) {
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

    this._destroy = function () {
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
    return $.isEmptyObject(this._itemInstances);
  }

  destroy() {
    this._destroy();
  }
}

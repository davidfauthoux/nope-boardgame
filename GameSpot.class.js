import { GameItem } from "./GameItem.class.js";
import { Utils } from "../Utils.class.js";

export class GameSpot {
  constructor(stack, game, spot) {
    this._stack = stack;
    this._game = game;
    this._spot = spot;
    this.location = spot === null ? undefined : spot.location;
  }

  exists() {
    return !(this._spot === null);
  }

  drop(kind, count) {
    if (this._spot === null) {
      return new GameItem(this._stack, this._game, null);
    }
    if (kind === undefined) {
      return new GameItem(this._stack, this._game, null);
    }
    var that = this;
    this._stack({
      action: "drop",
      kind: kind,
      location: that._spot.location,
      count: count,
    });
    var itemInstance = this._spot.getItemInstance(kind);
    return new GameItem(this._stack, this._game, itemInstance);
  }

  move(kind, count, to) {
    if (this._spot === null) {
      return new GameItem(this._stack, this._game, null);
    }
    if (to._spot === null) {
      return new GameItem(this._stack, this._game, null);
    }
    if (kind === undefined) {
      return new GameItem(this._stack, this._game, null);
    }
    var that = this;
    this._stack({
      action: "move",
      kind: kind,
      location: that._spot.location,
      to: to._spot.location,
      count: count,
    });
    var itemInstance = to._spot.getItemInstance(kind);
    return new GameItem(this._stack, this._game, itemInstance);
  }

  destroy(kind, count) {
    if (this._spot === null) {
      return;
    }
    var that = this;
    this._stack({
      action: "destroy",
      kind: kind,
      location: that._spot.location,
      count: count,
    });
  }

  items() {
    var that = this;
    var a = [];
    if (this._spot !== null) {
      for (const key in this._spot._itemInstances){
        var item = new GameItem(that._stack, that._game, this._spot._itemInstances[key]);
        a.push(item);
      }
    }
    a.each = function (callback) {
      Utils.each(a, callback);
    };
    return a;
  }

  empty() {
    if (this._spot === null) {
      return true;
    }
    return this._spot.empty();
  }

  count(kind) {
    if (this._spot === null) {
      return 0;
    }
    if (kind === undefined) {
      return 0;
    }
    var itemInstance = this._spot.getItemInstance(kind);
    if (itemInstance === null) {
      return 0;
    }
    return itemInstance.count;
  }

  find(kind) {
    if (this._spot === null) {
      return new GameItem(this._stack, this._game, null);
    }
    if (kind === undefined) {
      return new GameItem(this._stack, this._game, null);
    }
    var itemInstance = this._spot.getItemInstance(kind);
    return new GameItem(this._stack, this._game, itemInstance);
  }

  live() {
    if (this._spot === null) {
      return false;
    }
    return this.find("live").live();
  }

  living() {
    if (this._spot === null) {
      return false;
    }
    return this.find("live").living();
  }

  is(prefix) {
    if (this._spot === null) {
      return undefined;
    }
    if (prefix === undefined) {
      return undefined;
    }
    if (this.location.startsWith(prefix + "-")) {
      return this.location.substring((prefix + "-").length);
    }
    return undefined;
  }
}

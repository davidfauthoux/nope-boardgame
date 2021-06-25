import { GameItem } from "./GameItem.class.js";
import {Utils} from "../Utils.class.js";

export class GameSpot {
  /**
   * Connects a given Spot to a given Game
   * @param stack
   * @param {Game} game
   * @param {Spot} spot
   */
  constructor(stack, game, spot) {
    this._stack = stack;
    this._game = game;
    this._spot = spot;
    this.location = spot === null ? undefined : spot.location;
  }

  /**
   * checks if there is a Spot
   * @returns {boolean}
   */
  exists() {
    return !(this._spot === null);
  }

  /**
   * Drop item (kind) on the spot
   * @param {string} kind
   * @param {number} count
   * @returns {GameItem}
   */
  drop(kind, count) {
    if (this._spot === null) {
      return new GameItem(this._stack, this._game, null);
    }
    if (kind === undefined) {
      return new GameItem(this._stack, this._game, null);
    }
    this._stack({
      action: "drop",
      kind: kind,
      location: this._spot.location,
      count: count,
    });
    let itemInstance = this._spot.getItemInstance(kind);
    return new GameItem(this._stack, this._game, itemInstance);
  }

  /**
   * move Item(s) of a certain kind in this Spot to another Spot
   * @param {string} kind
   * @param {number} count
   * @param {GameSpot} to
   * @returns {GameItem}
   */
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
    this._stack({
      action: "move",
      kind: kind,
      location: this._spot.location,
      to: to._spot.location,
      count: count,
    });
    let itemInstance = to._spot.getItemInstance(kind);
    return new GameItem(this._stack, this._game, itemInstance);
  }

  /**
   * destroy Item(s) of a certain kind
   * @param {string} kind
   * @param {number} count
   */
  destroy(kind, count) {
    if (this._spot === null) {
      return;
    }

    this._stack({
      action: "destroy",
      kind: kind,
      location: this._spot.location,
      count: count,
    });
  }

  /**
   * get all Items on the Spot
   * @returns {*[]}
   */
  items() {

    let a = [];
    if (this._spot !== null) {
      this._spot.eachItemInstances(function (i) {
        let item = new GameItem(this._stack, this._game, i);
        a.push(item);
      });
    }
    a.each = function (callback) {
      // for (const item of a) {
      //   callback();
      // }
      Utils.each(a, callback);
    };
    return a;
  }

  /**
   * checks if the Spot is empty
   * @returns {boolean}
   */
  empty() {
    if (this._spot === null) {
      return true;
    }
    return this._spot.empty();
  }

  /**
   * count number of Items of a certain kind on this GameSpot
   * @param {string} kind
   * @returns {number|*}
   */
  count(kind) {
    if (this._spot === null) {
      return 0;
    }
    if (kind === undefined) {
      return 0;
    }
    let itemInstance = this._spot.getItemInstance(kind);
    if (itemInstance === null) {
      return 0;
    }
    return itemInstance.count;
  }

  /**
   * returns the GameItem of a certain kind, if founded
   * @param {string} kind
   * @returns {GameItem}
   */
  find(kind) {
    if (this._spot === null) {
      return new GameItem(this._stack, this._game, null);
    }
    if (kind === undefined) {
      return new GameItem(this._stack, this._game, null);
    }
    let itemInstance = this._spot.getItemInstance(kind);
    return new GameItem(this._stack, this._game, itemInstance);
  }

  /**
   * check if there is a "live" Item here
   * @returns {boolean}
   */
  live() {
    if (this._spot === null) {
      return false;
    }
    return this.find("live").live();
  }

  /**
   * check if we're living ?
   * @returns {boolean|null|*}
   */
  living() {
    if (this._spot === null) {
      return false;
    }
    return this.find("live").living();
  }

  /**
   * returns the properties of the spot location
   * @param {string} prefix
   * @returns {string|undefined}
   */
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

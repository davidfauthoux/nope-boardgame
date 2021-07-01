import {GameSpot} from "./GameSpot.class.js";

export class GameItem {
  /**
   * creates a new item from a game
   * @param stack
   * @param game
   * @param itemInstance
   */
  constructor(stack, game, itemInstance) {
    this._stack = stack;
    this._game = game;
    this._itemInstance = itemInstance;
    this.kind = itemInstance === null ? undefined : itemInstance.item.kind;
  }

  /**
   * checks if instance exists
   * @returns {boolean}
   */
  exists() {
    return !(this._itemInstance === null);
  }

  /**
   * counts the number of items in instance
   * @returns {undefined|*}
   */
  count() {
    if (this._itemInstance === null) {
      return undefined;
    }
    return this._itemInstance.count;
  }

  /**
   * checks if an item is from a specified kind
   * @param prefix (kind of item
   * @returns {string|undefined}
   */
  is(prefix) {
    if (this._itemInstance === null) {
      return undefined;
    }
    if (prefix === undefined) {
      return undefined;
    }
    if (this.kind.startsWith(prefix + "-")) {
      return this.kind.substring((prefix + "-").length);
    }
    return undefined;
  }

  /**
   * paints the item
   * @param stateKey
   * @param stateValue
   */
  paint(stateKey, stateValue) {
    if (this._itemInstance === null) {
      return;
    }
    this._stack({
      action: "paint",
      key: stateKey,
      value: stateValue,
      kind: this._itemInstance.item.kind,
      location: this._itemInstance.spot.location,
    });
  }

  /**
   * Search what does the item looks like ?
   * @param stateKey
   * @returns {undefined|*}
   */
  look(stateKey) {
    if (this._itemInstance === null) {
      return undefined;
    }
    return this._itemInstance.state[stateKey];
  }

  /**
   * Destroys items from instance
   * @param count (how many items to destroy)
   */
  destroy(count) {
    if (this._itemInstance === null) {
      return;
    }
    this._stack({
      action: "destroy",
      kind: this._itemInstance.item.kind,
      location: this._itemInstance.spot.location,
      count: count,
    });
  }

  /**
   * checks if item's liveId is same than game's one
   * @returns {boolean}
   */
  live() {
    if (this._itemInstance === null) {
      return false;
    }
    return this._itemInstance.liveId === this._game.thisLiveId;
  }

  /**
   * returns the liveId of this item
   * @returns {null|*|boolean}
   */
  living() {
    if (this._itemInstance === null) {
      return false;
    }
    return this._itemInstance.liveId;
  }

  /**
   * Give a new spot for this item at a given location
   * @param location
   * @returns {GameSpot}
   */
  spot(location) {
    if (this._itemInstance === null) {
      return new GameSpot(this._stack, this._game, null);
    }
    return new GameSpot(
      this._stack,
      this._game,
      this._game.spotManager.getSpot(location)
    );
  }
}

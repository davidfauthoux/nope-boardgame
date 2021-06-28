import { Item } from "./Item.class.js";

export class ItemManager {
  /**
   * creates a (unique) ItemManager for a given Game
   * @param {Game} game
   */
  constructor(game) {
    this._game = game;
    this._items = {};
  }

  /**
   * gets an Item of a certain kind from the list of Items
   * @param {string} kind
   * @returns {Item}
   */
  getItem(kind) {
    let i = this._items[kind];
    if (i === undefined) {
      i = new Item(this._game, kind);
      this._items[kind] = i;
    }
    return i;
  }

  /**
   * clears all Items of the list
   */
  clear() {
    this._items = {};
  }
}
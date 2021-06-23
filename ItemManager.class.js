import { Item } from "./Item.class.js";

export class ItemManager {
  constructor(game) {
    this._game = game;
    this._items = {};
  }

  getItem(kind) {
    var i = this._items[kind];
    if (i === undefined) {
      i = new Item(this._game, kind);
      this._items[kind] = i;
    }
    return i;
  }

  clear() {
    this._items = {};
  }
}

"use strict";

class GamePool {
  constructor(stack, game, pool) {
    this._stack = stack;
    this._game = game;
    this._pool = pool;
    this.name = pool === null ? undefined : pool.name;
  }

  spot() {
    return new GameSpot(
      this._stack,
      this._game,
      this._pool === null ? null : this._pool.spot.spot
    );
  }
}

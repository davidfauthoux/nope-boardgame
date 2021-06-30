import { GameSpot } from "./GameSpot.class.js";

export class GamePool {
  /**
   * connects a given Pool to a given Game
   * @param stack
   * @param {Game} game
   * @param {Pool} pool
   */
  constructor(stack, game, pool) {
    this._stack = stack;
    this._game = game;
    this._pool = pool;
    this.name = pool === null ? undefined : pool.name;
  }

  /**
   * creates GameSpots from Pool's spots
   * @returns {GameSpot}
   */
  spot() {
    return new GameSpot(
      this._stack,
      this._game,
      this._pool === null ? null : this._pool.spot.spot
    );
  }
}

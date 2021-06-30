
import { Pool } from "./Pool.class.js";
import { Grid } from "./Grid.class.js";
import { Track } from "./Track.class.js";

export class GameManager {
  /**
    * construct the GameManager for a given game (unique)
    * @param game
   */
  constructor(game) {
    this._game = game;
    this.pools = {};
    this.tracks = {};
    this.grids = {};
    this.layouts = undefined;

    this._newedPools = {};
  }

  /**
   * Creates a Pool from a given layout, with its name and properties
   * @param {Layout} intoLayout
   * @param {string} name
   * @param properties
   */
  createPool(intoLayout, name, properties) {
    this.pools[name] = new Pool(intoLayout, this._game, name, properties);
  }

  /**
   * Creates a Track from a given layout, with it's name and properties
   * @param {Layout} intoLayout
   * @param {string} name
   * @param title
   * @param size
   * @param vertical
   * @param start
   * @param step
   * @param limit
   * @param reversed
   */
  createTrack(
    intoLayout,
    name,
    title,
    size,
    vertical,
    start,
    step,
    limit,
    reversed
  ) {
    this.tracks[name] = new Track(
      intoLayout,
      this._game,
      name,
      title,
      size,
      vertical,
      start,
      step,
      limit,
      reversed
    );
  }

  /**
   * Creates a Grid from a given layout, with its name and properties
   * @param {Layout} intoLayout
   * @param {string} name
   * @param {number} type (number of sides of the grid)
   * @param {boolean} auto (auto sized grid ?)
   * @param {number} width
   * @param {number} height
   */
  createGrid(intoLayout, name, type, auto, width, height) {
    this.grids[name] = new Grid(
      intoLayout,
      this._game,
      name,
      type,
      auto,
      width,
      height
    );
  }

  //TODO In the future, do the same for track and grid
  /**
   * Initialize a new Layout with a name, with a Pool (name+properties) inside
   * @param {string} layoutName
   * @param {string} name
   * @param properties
   * @param {boolean} floating
   */
  newPool(layoutName, name, properties, floating) {
    const layout = this.layouts[layoutName].add();
    //%% layout.$.addClass("panel-" + layoutName);
    this._newedPools[name] = {
      layout: layout,
      floating: floating,
    };
    this.createPool(
      floating === true ? layout.floating() : layout,
      name,
      properties
    );
  }

  /**
   * Clears all newedPools and resets all Grids
   */
  clear() {
    let that=this;
    for (let name in this._newedPools) {
      let p=this._newedPools[name]
      let pool = that.pools[name];
      delete that.pools[name];
      if (p.floating === true) {
        pool.$.parent().parent().parent().remove();
      } else {
        pool.$.remove();
      }
      p.layout.$.remove();
      pool.destroy();
    }
    this._newedPools = {};

    //TODO Do the same for tracks and pools (reset)
    for (let name in this.grids) {
      this.grids[name].reset();
    }
  }
}

import { Spot } from "./Spot.class.js";

export class Pool {
  /**
   * creates new Pool (name,properties) from a Layout in a given Game
   * @param {Layout} layout
   * @param {Game} game
   * @param {string} name
   * @param properties
   */
  constructor(layout, game, name, properties) {
    this._game = game;
    this.name = name;
    this.properties = properties;

    layout.$.addClass("pool").addClass("pool-" + name);

    let i = name.indexOf("-");
    if (i >= 0) {
      layout.$.addClass("pool-" + name.substring(0, i) + "-_");
    }

    layout.$.addClass("pool-" + properties.layout);

    this.$ = layout.$;

    this.spot = {
      spot: new Spot(
        layout.layout().inside(),
        game,
        "pool-" + name,
        properties
      ),
    };
    game.spotManager.registerSpot(this.spot.spot);
  }

  /**
   * destroys this Pool
   */
  destroy() {
    this._game.spotManager.unregisterSpot(this.spot.spot);
  }
}

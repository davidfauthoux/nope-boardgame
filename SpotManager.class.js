
import { Utils } from "../Utils.class.js";

export class SpotManager {
  /**
   * creates a (unique) SpotManager for a given Game
   * @param {Game} game
   */
  constructor(game) {
    this._spots = {};
    this._generateFunctions = {};
    this._game = game;
  }

  /**
   * affects a generation function to a location (prefix form)
   * @param {string} locationPrefix
   * @param generationFunction
   */
  registerGenerate(locationPrefix, generationFunction) {
    this._generateFunctions[locationPrefix] = generationFunction;
  }

  /**
   * configure the given Spot to the SpotManager
   * @param {Spot} spot
   */
  registerSpot(spot) {
    //console.log("Spot registered: " + spot.location);
    if (this._spots[spot.location] !== undefined) {
      this._game.dragAndDropManager.unconfigureSpot(spot);
    }
    this._spots[spot.location] = spot;
    this._game.dragAndDropManager.configureSpot(spot);
  }

  /**
   * remove given Spot from this SpotManager
   * @param spot
   */
  unregisterSpot(spot) {
    //console.log("Spot unregistered: " + spot.location);
    if (this._spots[spot.location] !== undefined) {
      delete this._spots[spot.location];
      this._game.dragAndDropManager.unconfigureSpot(spot);
    }
  }

  /**
   * get the Spot associated to the given location
   * @param location
   * @returns {null}
   */
  getSpot(location) {
    for (const key in this._generateFunctions){
      let generationFunction = this._generateFunctions[key];
      if (location.startsWith(key)) {
        //console.log("Generating spot: " + location);
        generationFunction(location.substring(key.length));
      }
    }
    return this._spots[location] || null;
  }

  /**
   * clears the associated Spots and generation functions
   */
  clear() {
    for (const spot of this._spots) {
      this._game.dragAndDropManager.unconfigureSpot(spot);
    }
    this._spots = {};
    this._generateFunctions = {};
  }
}

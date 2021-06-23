
import { Utils } from "../Utils.class.js";

export class SpotManager {
  constructor(game) {
    this._spots = {};
    this._generateFunctions = {};
    this._game = game;
  }

  registerGenerate(locationPrefix, generationFunction) {
    this._generateFunctions[locationPrefix] = generationFunction;
  }

  registerSpot(spot) {
    //console.log("Spot registered: " + spot.location);
    if (this._spots[spot.location] !== undefined) {
      this._game.dragAndDropManager.unconfigureSpot(spot);
    }
    this._spots[spot.location] = spot;
    this._game.dragAndDropManager.configureSpot(spot);
  }

  unregisterSpot(spot) {
    //console.log("Spot unregistered: " + spot.location);
    if (this._spots[spot.location] !== undefined) {
      delete this._spots[spot.location];
      this._game.dragAndDropManager.unconfigureSpot(spot);
    }
  }

  getSpot(location) {
    Utils.each(
      this._generateFunctions,
      function (generationFunction, locationPrefix) {
        if (location.startsWith(locationPrefix)) {
          //console.log("Generating spot: " + location);
          generationFunction(location.substring(locationPrefix.length));
        }
      }
    );
    return this._spots[location] || null;
  }

  each(callback) {
    Utils.each(this._spots, callback);
  }

  clear() {
    Utils.each(this._spots, function (spot) {
      this._game.dragAndDropManager.unconfigureSpot(spot);
    });
    this._spots = {};
    this._generateFunctions = {};
  }
}

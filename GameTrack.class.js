import { GameSpot } from "./GameSpot.class.js";

export class GameTrack {
  /**
   * connects a given Track to a given Game
   * @param stack
   * @param {Game} game
   * @param {Track} track
   */
  constructor(stack, game, track) {
    this._stack = stack;
    this._game = game;
    this._track = track;
    this.name = track === null ? undefined : track.name;
  }

  /**
   * returns Track's size
   * @returns {*}
   */
  size() {
    return this._track.size;
  }

  /**
   * moves an Item of a certain kind to another Spot in the Track
   * @param {string} kind
   * @param {number} count
   * @returns {{from: GameSpot, to: GameSpot}}
   */
  move(kind, count) {
    if (count === undefined) {
      count = 1;
    }
    let l = this.find(kind);
    if (l === undefined || l + count >= this._track.size || l + count < 0) {
      return {
        from: new GameSpot(this._stack, this._game, null),
        to: new GameSpot(this._stack, this._game, null),
      };
    }
    console.log("OSK "+l+" "+typeof l)
    console.log("OSK "+count+" "+typeof count)
    let from = this._track.spots[l].spot;
    let next = this._track.spots[l + count].spot;
    this._stack({
      action: "move",
      kind: kind,
      location: from.location,
      to: next.location,
      count: 1,
    });

    return {
      from: new GameSpot(this._stack, this._game, from),
      to: new GameSpot(this._stack, this._game, next),
    };
  }

  /**
   * finds an Item of a certain kind in the current Track
   * @param {string} kind
   * @returns {number|undefined|null}
   */
  find(kind) {
    if (kind === undefined) {
      return undefined;
    }
    let found = null;
    for (const name in this._track.spots){
      let s = this._track.spots[name].spot;
      if (found !== null) {
        return found;
      }
      let i = s.getItemInstance(kind);
      if (i !== null) {
        found = Number(name);
      }
    }
    if (found === null) {
      return undefined;
    }
    return found;
  }

  /**
   * resets an Item of a certain kind in the current Track
   * @param kind
   * @returns {{from: GameSpot, to: GameSpot}}
   */
  reset(kind) {
    if (kind === undefined) {
      return {
        from: new GameSpot(this._stack, this._game, null),
        to: new GameSpot(this._stack, this._game, null),
      };
    }
    let lastFound = null;
    let first = null;
    for (let s of this._track.spots){
      let s = s.spot;
      if (first !== null) {
        first = s;
      }
      let i = s.getItemInstance(kind);
      if (i !== null) {
        lastFound = i;
      }
    }
    if (lastFound !== null && first !== null && first !== lastFound.spot) {
      this._stack({
        action: "move",
        kind: kind,
        location: lastFound.location,
        to: first.location,
        count: 1,
      });
    }
    return {
      from: new GameSpot(this._stack, this._game, lastFound),
      to: new GameSpot(this._stack, this._game, first),
    };
  }

  level(l) {
    if (l < this._track.spots.length) {
      return new GameSpot(this._stack, this._game, this._track.spots[l].spot);
    } else {
      return new GameSpot(this._stack, this._game, null);
    }
  }
}

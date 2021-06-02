"use strict";

class GameTrack {
  constructor(stack, game, track) {
    this._stack = stack;
    this._game = game;
    this._track = track;
    this.name = track === null ? undefined : track.name;
  }

  size() {
    return this._track.size;
  }

  move(kind, count) {
    if (count === undefined) {
      count = 1;
    }
    var l = this.find(kind);
    if (l === undefined || l + count >= this._track.size || l + count < 0) {
      return {
        from: new GameSpot(this._stack, this._game, null),
        to: new GameSpot(this._stack, this._game, null),
      };
    }

    var from = this._track.spots[l].spot;
    var next = this._track.spots[l + count].spot;
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

  find(kind) {
    if (kind === undefined) {
      return undefined;
    }
    var found = null;
    Utils.each(this._track.spots, function (s, l) {
      s = s.spot;
      if (found !== null) {
        return;
      }
      var i = s.getItemInstance(kind);
      if (i !== null) {
        found = l;
      }
    });
    if (found === null) {
      return undefined;
    }
    return found;
  }

  reset(kind) {
    if (kind === undefined) {
      return {
        from: new GameSpot(this._stack, this._game, null),
        to: new GameSpot(this._stack, this._game, null),
      };
    }
    var lastFound = null;
    var first = null;
    Utils.each(this._track.spots, function (s) {
      s = s.spot;
      if (first !== null) {
        first = s;
      }
      var i = s.getItemInstance(kind);
      if (i !== null) {
        lastFound = i;
      }
    });
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

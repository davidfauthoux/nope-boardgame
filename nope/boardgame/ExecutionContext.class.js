"use strict";

class ExecutionContext {
  constructor(game) {
    var toStack = [];
    var stack = function (nopping, liveId) {
      return function (event) {
        if (nopping.nop) {
          console.log("Will nop: " + JSON.stringify(event));
          game.eventManager.parse(event, liveId);
        } else {
          if (!game.eventManager.canParse(event)) {
            return;
          }
          game.eventManager.parse(event, liveId);
          toStack.push(event);
        }
      };
    };

    var newContext = function (liveId) {
      var caughtSpots = [];
      var _catchSpot = function (s) {
        if (s !== null && !Utils.contains(s)) {
          console.log("Spot MODIFIED: " + s.location);
          caughtSpots.push(s);
        }
      };
      var _catch = function (spot) {
        _catchSpot(spot._spot);
      };
      var _catchingItem = function (item) {
        var _paint = item.paint;
        item.paint = function () {
          if (item._itemInstance !== null) {
            _catchSpot(item._itemInstance.spot);
          }
          _paint.apply(this, arguments);
        };
        var _destroy = item.destroy;
        item.destroy = function () {
          if (item._itemInstance !== null) {
            _catchSpot(item._itemInstance.spot);
          }
          _destroy.apply(this, arguments);
        };
        return item;
      };
      var _catchingSpot = function (spot) {
        var _drop = spot.drop;
        spot.drop = function () {
          _catch(spot);
          var item = _drop.apply(this, arguments);
          return _catchingItem(item);
        };
        var _destroy = spot.destroy;
        spot.destroy = function () {
          _catch(spot);
          _destroy.apply(this, arguments);
        };
        var _items = spot.items;
        spot.items = function () {
          var a = _items.apply(this, arguments);
          Utils.each(a, function (item, i) {
            a[i] = _catchingItem(item);
          });
          return a;
        };
        var _find = spot.find;
        spot.find = function () {
          return _catchingItem(_find.apply(this, arguments));
        };
        return spot;
      };

      var buildPool = function (nopping, pool) {
        var gamePool = new GamePool(stack(nopping, liveId), game, pool);
        var _spot = gamePool.spot;
        gamePool.spot = function () {
          return _catchingSpot(_spot.apply(this, arguments));
        };
        return gamePool;
      };
      var buildTrack = function (nopping, track) {
        var gameTrack = new GameTrack(stack(nopping, liveId), game, track);
        var _move = gameTrack.move;
        var _reset = gameTrack.reset;
        var _level = gameTrack.level;
        gameTrack.move = function () {
          var m = _move.apply(this, arguments);
          _catch(m.from);
          _catch(m.to);
          return {
            from: _catchingSpot(m.from),
            to: _catchingSpot(m.to),
          };
        };
        gameTrack.reset = function () {
          var m = _reset.apply(this, arguments);
          _catch(m.from);
          _catch(m.to);
          return {
            from: _catchingSpot(m.from),
            to: _catchingSpot(m.to),
          };
        };
        gameTrack.level = function () {
          return _catchingSpot(_level.apply(this, arguments));
        };
        return gameTrack;
      };
      var buildGrid = function (nopping, grid) {
        var gameGrid = new GameGrid(stack(nopping, liveId), game, grid);
        var _cell = gameGrid.cell;
        gameGrid.cell = function () {
          return _catchingSpot(_cell.apply(this, arguments));
        };
        return gameGrid;
      };
      var buildSpot = function (nopping, spot) {
        return _catchingSpot(new GameSpot(stack(nopping, liveId), game, spot));
      };
      var buildItem = function (nopping, item) {
        return _catchingItem(new GameItem(stack(nopping, liveId), game, item));
      };

      return {
        buildPool: buildPool,
        buildTrack: buildTrack,
        buildGrid: buildGrid,
        buildSpot: buildSpot,
        buildItem: buildItem,
        caughtSpots: caughtSpots,
      };
    };

    var _finish = function (liveId) {
      if (toStack.length > 0) {
        // Split around "mark" events
        var s = [];
        var ee = [];
        var stackAndClear = function () {
          if (ee.length > 0) {
            if (ee.length === 1) {
              s.push(ee[0]);
            } else {
              s.push({
                action: "multiple",
                events: ee,
              });
            }
          }
          ee = [];
        };
        Utils.each(toStack, function (e) {
          if (e.action === "mark") {
            stackAndClear();
            s.push(e);
          } else {
            ee.push(e);
          }
        });
        stackAndClear();

        Utils.each(s, function (e) {
          game.eventManager.stack(e, liveId);
        });
        Layout.fit();
      }
    };

    var _runScripts = function (overflowCount, scripts, liveId) {
      if (overflowCount === 10) {
        console.log("Execution overflow (" + overflowCount + ")");
        throw "overflow";
      }
      var scriptContext = newContext(liveId);
      Utils.each(scripts, function (script) {
        script(
          stack(false, liveId),
          scriptContext.buildPool,
          scriptContext.buildTrack,
          scriptContext.buildGrid,
          scriptContext.buildSpot,
          scriptContext.buildItem
        );
        console.log(
          "Finishing script (" +
            scriptContext.caughtSpots.length +
            " spots modified)"
        );

        Utils.each(scriptContext.caughtSpots, function (spot) {
          game.triggerManager.scriptRun(spot, function (scripts) {
            _runScripts(overflowCount + 1, scripts, liveId);
          });
        });
      });
    };

    var newDoNothingContext = function (liveId) {
      var _catch = function (spot) {};
      var _catchingItem = function (item) {
        item.paint = function () {};
        item.destroy = function () {};
        return item;
      };
      var _catchingSpot = function (spot) {
        var _drop = spot.drop;
        spot.drop = function () {
          return _drop();
        };
        spot.destroy = function () {};
        var _items = spot.items;
        spot.items = function () {
          var a = _items.apply(this, arguments);
          Utils.each(a, function (item, i) {
            a[i] = _catchingItem(item);
          });
          return a;
        };
        var _find = spot.find;
        spot.find = function () {
          return _catchingItem(_find.apply(this, arguments));
        };
        return spot;
      };

      var buildPool = function (nopping, pool) {
        var gamePool = new GamePool(stack(nopping, liveId), game, pool);
        var _spot = gamePool.spot;
        gamePool.spot = function () {
          return _catchingSpot(_spot.apply(this, arguments));
        };
        return gamePool;
      };
      var buildTrack = function (nopping, track) {
        var gameTrack = new GameTrack(stack(nopping, liveId), game, track);
        var _move = gameTrack.move;
        var _reset = gameTrack.reset;
        var _level = gameTrack.level;
        gameTrack.move = function () {
          var m = _move.apply(this, arguments);
          _catch(m.from);
          _catch(m.to);
          return {
            from: _catchingSpot(m.from),
            to: _catchingSpot(m.to),
          };
        };
        gameTrack.reset = function () {
          var m = _reset.apply(this, arguments);
          _catch(m.from);
          _catch(m.to);
          return {
            from: _catchingSpot(m.from),
            to: _catchingSpot(m.to),
          };
        };
        gameTrack.level = function () {
          return _catchingSpot(_level.apply(this, arguments));
        };
        return gameTrack;
      };
      var buildGrid = function (nopping, grid) {
        var gameGrid = new GameGrid(stack(nopping, liveId), game, grid);
        var _cell = gameGrid.cell;
        gameGrid.cell = function () {
          return _catchingSpot(_cell.apply(this, arguments));
        };
        return gameGrid;
      };
      var buildSpot = function (nopping, spot) {
        return _catchingSpot(new GameSpot(stack(nopping, liveId), game, spot));
      };
      var buildItem = function (nopping, item) {
        return _catchingItem(new GameItem(stack(nopping, liveId), game, item));
      };

      return {
        buildPool: buildPool,
        buildTrack: buildTrack,
        buildGrid: buildGrid,
        buildSpot: buildSpot,
        buildItem: buildItem,
      };
    };

    this._runDoNothingScripts = function (scripts, liveId) {
      var scriptContext = newDoNothingContext(liveId);
      Utils.each(scripts, function (script) {
        script(
          stack(false, liveId),
          scriptContext.buildPool,
          scriptContext.buildTrack,
          scriptContext.buildGrid,
          scriptContext.buildSpot,
          scriptContext.buildItem
        );
      });
    };

    // Called by drag&drop and other interactive things
    this._stackAndTrigger = function (event, from, spot, item, liveId) {
      stack(false)(event, liveId);
      game.triggerManager.spotModified(from, spot, item, function (scripts) {
        _runScripts(0, scripts);
      });
      _finish(liveId);
    };

    this._runScripts = function (scripts, liveId) {
      _runScripts(0, scripts, liveId);
      _finish(liveId);
    };
  }
}

ExecutionContext.stackAndTrigger = function (
  game,
  event,
  from,
  spot,
  item,
  liveId
) {
  new ExecutionContext(game)._stackAndTrigger(event, from, spot, item, liveId);
};

ExecutionContext.runScripts = function (game, scripts, liveId) {
  return new ExecutionContext(game)._runScripts(scripts, liveId);
};

ExecutionContext.runDoNothingScripts = function (game, scripts, liveId) {
  return new ExecutionContext(game)._runDoNothingScripts(scripts, liveId);
};

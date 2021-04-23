"use strict"

class GameGrid {
	constructor(stack, game, grid) {
		this._stack = stack;
		this._game = game;
		this._grid = grid;
		this.name = (grid === null) ? undefined : grid.name;
	}

	width() {
		return this._grid.width;
	}
	height() {
		return this._grid.height;
	}

	_cell(i, j, valid) {
		var a;
		if (!valid) {
			a = new GameSpot(this._stack, this._game, null);
		} else {
			a = new GameSpot(this._stack, this._game, this._grid.spot(i, j));
		}
		var that = this;
		a.up = function() {
			return that._cell(i, j - 1, valid && (that._grid.type === 4));
		};
		a.down = function() {
			return that._cell(i, j + 1, valid && (that._grid.type === 4));
		};
		a.left = function() {
			return that._cell(i - 1, j, valid);
		};
		a.right = function() {
			return that._cell(i + 1, j, valid);
		};
		a.upLeft = function() {
			return that._cell(i - (Math.abs(j) % 2), j - 1, valid);
		};
		a.upRight = function() {
			return that._cell(i - (Math.abs(j) % 2) + 1, j - 1, valid);
		};
		a.downLeft = function() {
			return that._cell(i - (Math.abs(j) % 2), j + 1, valid);
		};
		a.downRight = function() {
			return that._cell(i - (Math.abs(j) % 2) + 1, j + 1, valid);
		};
		a.around = function() {
			var ar;
			if (that._grid.type === 6) {
				ar = [
					a.left(),
					a.upLeft(),
					a.upRight(),
					a.right(),
					a.downLeft(),
					a.downRight()
				];
			} else {
				ar = [
					a.left(),
					a.upLeft(),
					a.up(),
					a.upRight(),
					a.right(),
					a.downLeft(),
					a.down(),
					a.downRight()
				];
			}
			ar.each = function(callback) {
				Utils.each(ar, callback);
			};
			return ar;
		};
		a.i = i;
		a.j = j;

/*%
		if (this._grid.auto) {
			var _drop = a.drop;
			a.drop = function(kind, count) { // Auto grow possible only on drop (not on move - too complicated because may move from different grids, pools...)
				that._grid.grow(i, j);
				var r;
				if (a._spot === null) {
					r = that.cell(i, j).drop(kind, count);
				} else {
					r = _drop.apply(a, arguments);
				}
				return r;
			};
			var _destroy = a.destroy;
			a.destroy = function() {
				_destroy.apply(a, arguments);
				that._grid.ungrow();
			};
			var _move = a.move;
			a.move = function() {
				var r = _move.apply(a, arguments);
				that._grid.ungrow();
				return r;
			};
		}
*/

		return a;
	}

	cell(i, j) {
		return this._cell(i, j, true);
	}

/*%
	ungrow() {
		this._grid.ungrow();
	}
*/

	grow(ii, jj) {
		this._grid.grow(ii, jj);
	}
}
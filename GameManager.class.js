"use strict"

class GameManager {
	constructor(game) {
		this._game = game;
		this.pools = {};
		this.tracks = {};
		this.grids = {};
		this.layouts = undefined;

		this._newedPools = {};
	}

	createPool(intoLayout, name, properties) {
		this.pools[name] = new Pool(intoLayout, this._game, name, properties);
	}

	createTrack(intoLayout, name, title, size, vertical, start, step, limit, reversed) {
		this.tracks[name] = new Track(intoLayout, this._game, name, title, size, vertical, start, step, limit, reversed);
	}

	createGrid(intoLayout, name, type, auto, width, height) {
		this.grids[name] = new Grid(intoLayout, this._game, name, type, auto, width, height);
	}

	//TODO In the future, do the same for track and grid
	newPool(layoutName, name, properties, floating) {
		var layout = this.layouts[layoutName].add();
		//%% layout.$.addClass("panel-" + layoutName);
		this._newedPools[name] = {
			layout: layout,
			floating: floating
		};
		this.createPool((floating === true) ? layout.floating() : layout, name, properties);
	}

	clear() {
		var that = this;
		Utils.each(this._newedPools, function(p, name) {
			var pool = that.pools[name];
			delete that.pools[name];
			if (p.floating === true) {
				pool.$.parent().parent().parent().remove();
			} else {
				pool.$.remove();
			}
			p.layout.$.remove();
			pool.destroy();
		});
		this._newedPools = {};

		//TODO Do the same for tracks and pools (reset)
		Utils.each(this.grids, function(grid) {
			grid.reset();
		});
	}
}


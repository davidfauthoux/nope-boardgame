"use strict"

class GameItem {
	constructor(stack, game, itemInstance) {
		this._stack = stack;
		this._game = game;
		this._itemInstance = itemInstance;
		this.kind = (itemInstance === null) ? undefined : itemInstance.item.kind;
	}

	exists() {
		return !(this._itemInstance === null);
	}

	count() {
		if (this._itemInstance === null) {
			return undefined;
		}
		return this._itemInstance.count;
	}

	is(prefix) {
		if (this._itemInstance === null) {
			return undefined;
		}
		if (prefix === undefined) {
			return undefined;
		}
		if (this.kind.startsWith(prefix + "-")) {
			return this.kind.substring((prefix + "-").length);
		}
		return undefined;
	}

	paint(stateKey, stateValue) {
		if (this._itemInstance === null) {
			return;
		}
		var that = this;
		this._stack({
			action: "paint",
			key: stateKey,
			value: stateValue,
			kind: that._itemInstance.item.kind,
			location: that._itemInstance.spot.location
		});
	}

	look(stateKey) {
		if (this._itemInstance === null) {
			return undefined;
		}
		return this._itemInstance.state[stateKey];
	}

	destroy(count) {
		if (this._itemInstance === null) {
			return;
		}
		var that = this;
		this._stack({
			action: "destroy",
			kind: that._itemInstance.item.kind,
			location: that._itemInstance.spot.location,
			count: count
		});
	}

	live() {
		if (this._itemInstance === null) {
			return false;
		}
		return (this._itemInstance.liveId === this._game.thisLiveId);
	}
	living() {
		if (this._itemInstance === null) {
			return false;
		}
		return this._itemInstance.liveId;
	}

	spot(location) {
		if (this._itemInstance === null) {
			return new GameSpot(this._stack, this._game, null);
		}
		return new GameSpot(this._stack, this._game, this._game.spotManager.getSpot(location));
	}
}

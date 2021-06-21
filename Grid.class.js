import { SvgUtils } from "./SvgUtils.class.js";
import { Utils } from "../Utils.class.js";

export class Grid {
  constructor(layout, game, name, type, auto, width, height) {
    this._game = game;
    this.name = name;
    this.type = type;
    this.auto = auto;
    this.width = width;
    this.height = height;

    this.left = 0;
    this.top = 0;
    this.minWidth = width;
    this.minHeight = height;

    this._cellContent = $(SvgUtils.polygon(type, 0.01)).addClass(
      "gridCellContent"
    );
    this._willUngrowTimeoutId = null;

    layout.$.addClass("grid")
      .addClass("grid-type-" + type)
      .addClass("grid-" + name);

    this.$ = layout.$;
    this._layout = layout;
    this.spots = [];

    if (this.auto) {
      var that = this;
      this._game.spotManager.registerGenerate(
        "grid-" + this.name + "-",
        function (suffix) {
          var ij = that.parseSpotLocation(suffix);
          //that.grow(ij.i, ij.j);
          that.grow(ij.i - 1, ij.j - 1);
          that.grow(ij.i + 1, ij.j + 1);
        }
      );
    }

    this.reset();
  }

  parseSpotLocation(l) {
    var s = l.split(/\-/g);
    var ii = s[0];
    var i;
    if (ii.length > 1 && ii.startsWith("0")) {
      i = -parseInt(ii.substring(1));
    } else {
      i = parseInt(ii);
    }
    var jj = s[1];
    var j;
    if (jj.length > 1 && jj.startsWith("0")) {
      j = -parseInt(jj.substring(1));
    } else {
      j = parseInt(jj);
    }
    return {
      i: i,
      j: j,
    };
  }

  _spotLocation(i, j) {
    return (i < 0 ? "0" + -i : i) + "-" + (j < 0 ? "0" + -j : j);
  }

  rowWidth(j) {
    return this.width - (this.type === 6 ? 1 - (Math.abs(j) % 2) : 0);
  }

  reset() {
    var that = this;

    Utils.each(this.spots, function (row) {
      row.layout.$.remove();
      Utils.each(row.row, function (spot) {
        that._game.spotManager.unregisterSpot(spot.spot);
      });
    });

    this.spots = [];

    this.left = 0;
    this.top = 0;
    this.width = this.minWidth;
    this.height = this.minHeight;

    Utils.loop(0, this.height, 1, function (j) {
      var rowLayout = that._layout.vertical().add();
      var row = [];
      that.spots.push({
        layout: rowLayout,
        row: row,
      });
      var w = that.rowWidth(j);
      Utils.loop(0, w, 1, function (i) {
        var spot = new Spot(
          rowLayout.horizontal().add(),
          that._game,
          "grid-" + that.name + "-" + that._spotLocation(i, j),
          { overlayable: true, layout: "stack" },
          that._cellContent.clone()
        );
        that._game.spotManager.registerSpot(spot);
        row.push({
          spot: spot,
        });
      });
    });
  }

  /*%
	_ungrow() {
		var that = this;
		var previousEmpty = true;
		var minWidth = this.minWidth;
		var minHeight = this.minHeight;
		Utils.loop(0, this.height, -1, function(j) {
			var r = that.spots[j];
			var row = r.row;
			var w = that.width - ((that.type === 6) ? (1 - (j % 2)) : 0);
			var empty = true;
			Utils.loop(0, w, -1, function(i) {
				if (!empty) {
					return;
				}
				if (!row[i].spot.empty()) {
					if ((i + 1) > minWidth) {
						minWidth = (i + 1);
					}
					empty = false;
				}
			});
			if (previousEmpty && (j >= minHeight) && empty) {
				Utils.each(row, function(s) {
					s = s.spot;
					s.$.remove();
					that._game.spotManager.unregisterSpot(s);
				});
				minHeight = j;
			} else {
				if ((j + 1) > minHeight) {
					minHeight = (j + 1);
				}
				previousEmpty = false;
			}
		});
		this.spots = this.spots.slice(0, minHeight);

		Utils.each(that.spots, function(r) {
			var row = r.row;
			var w = that.width - ((that.type === 6) ? (1 - (j % 2)) : 0);
			Utils.loop(minWidth, w, -1, function(i) {
				var s = row[i].spot;
				s.$.remove();
				that._game.spotManager.unregisterSpot(s);
			});
			r.row = r.row.slice(0, minWidth);
		});

		if ((this.width !== minWidth) || (this.height !== this.spots.length)) {
			console.log("Ungrow: " + minWidth + " x " + this.spots.length);

			this.width = minWidth;
			this.height = this.spots.length;
		}
	}

	_willUngrow() {
		if (this._willUngrowTimeoutId == null) {
			var that = this;
			this._willUngrowTimeoutId = setTimeout(function() {
				that._willUngrowTimeoutId = null;
				that._ungrow();
			}, 0);
		}
	}

	ungrow() {
		this._willUngrow();
	}

	grow(ii, jj) {
		var height = jj + 1;
		var width = ii + 1 + ((this.type === 6) ? (1 - (jj % 2)) : 0);

		if ((height <= this.height) && (width <= this.width)) {
			return;
		}

		if (height < this.height) {
			height = this.height;
		}
		if (width < this.width) {
			width = this.width;
		}

		console.log("Growing grid from: " + this.width + "x" + this.height + "/" + this.spots.length + " to " + width + "x" + height);

		this.width = width;
		this.height = height;

		var locationPrefix = "grid-" + this.name + "-";

		var that = this;
		Utils.loop(0, height, 1, function(j) {
			var row;
			var rowLayout;
			if (j >= that.spots.length) {
				rowLayout = that._layout.vertical().add();
				row = [];
				that.spots.push({
					layout: rowLayout,
					row: row
				});
			} else {
				var r = that.spots[j];
				rowLayout = r.layout;
				row = r.row;
			}
			var w = width - ((that.type === 6) ? (1 - (j % 2)) : 0);
			Utils.loop(0, w, 1, function(i) {
				if (i >= row.length) {
					var spot = new Spot(rowLayout.horizontal().add(), that._game, locationPrefix + i + "-" + j, { overlayable: true, layout: "stack" }, that._cellContent.clone());
					that._game.spotManager.registerSpot(spot);
					that._game.dragAndDropManager.configureSpot(spot);
					row.push({
						spot: spot
					});
				}
			});
		});

		this._willUngrow();
	}
*/

  growDown() {
    this.height++;

    var that = this;
    var rowLayout = this._layout.vertical().add();
    var row = [];
    this.spots.push({
      layout: rowLayout,
      row: row,
    });
    var j = this.height - 1 + this.top;
    var w = this.rowWidth(j);
    Utils.loop(this.left, w + this.left, 1, function (i) {
      var spot = new Spot(
        rowLayout.horizontal().add(),
        that._game,
        "grid-" + that.name + "-" + that._spotLocation(i, j),
        { overlayable: true, layout: "stack" },
        that._cellContent.clone()
      );
      that._game.spotManager.registerSpot(spot);
      row.push({
        spot: spot,
      });
    });
  }
  growUp() {
    this.top--;
    this.height++;

    var that = this;
    var rowLayout = this._layout.vertical().predd();
    var row = [];
    this.spots.splice(0, 0, {
      layout: rowLayout,
      row: row,
    });
    var j = this.top;
    var w = this.rowWidth(j);
    Utils.loop(this.left, w + this.left, 1, function (i) {
      var spot = new Spot(
        rowLayout.horizontal().add(),
        that._game,
        "grid-" + that.name + "-" + that._spotLocation(i, j),
        { overlayable: true, layout: "stack" },
        that._cellContent.clone()
      );
      that._game.spotManager.registerSpot(spot);
      row.push({
        spot: spot,
      });
    });
  }

  growRight() {
    this.width++;

    var that = this;
    Utils.loop(this.top, this.height + this.top, 1, function (j) {
      var r = that.spots[j - that.top];
      var rowLayout = r.layout;
      var row = r.row;
      var w = that.rowWidth(j);
      var i = w - 1 + that.left;
      var spot = new Spot(
        rowLayout.horizontal().add(),
        that._game,
        "grid-" + that.name + "-" + that._spotLocation(i, j),
        { overlayable: true, layout: "stack" },
        that._cellContent.clone()
      );
      that._game.spotManager.registerSpot(spot);
      row.push({
        spot: spot,
      });
    });
  }
  growLeft() {
    this.left--;
    this.width++;

    var that = this;
    Utils.loop(this.top, this.height + this.top, 1, function (j) {
      var r = that.spots[j - that.top];
      var rowLayout = r.layout;
      var row = r.row;
      var i = that.left;
      var spot = new Spot(
        rowLayout.horizontal().predd(),
        that._game,
        "grid-" + that.name + "-" + that._spotLocation(i, j),
        { overlayable: true, layout: "stack" },
        that._cellContent.clone()
      );
      that._game.spotManager.registerSpot(spot);
      row.splice(0, 0, {
        spot: spot,
      });
    });
  }

  grow(i, j) {
    while (j >= this.height + this.top) {
      this.growDown();
    }
    while (j < this.top) {
      this.growUp();
    }
    while (i >= this.rowWidth(j) + this.left) {
      this.growRight();
    }
    while (i < this.left) {
      this.growLeft();
    }
  }

  spot(i, j) {
    if (this.auto) {
      this.grow(i, j);
    }

    if (j >= this.top && j < this.height - -this.top) {
      if (i >= this.left && i < this.rowWidth(j) - -this.left) {
        return this.spots[j + -this.top].row[i + -this.left].spot;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
}

import { SvgUtils } from "./SvgUtils.class.js";
import { Spot } from "./Spot.class.js";

export class Grid {
  /**
   * Constructs a new Grid in the layout of a game, with it's name, type and size.
   * @param {Layout} layout
   * @param game
   * @param {string} name
   * @param {number} type (number of sides for the grid)
   * @param {boolean} auto (grid auto sized)
   * @param {number} width
   * @param {number} height
   */
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
      const that = this;
      this._game.spotManager.registerGenerate(
        "grid-" + this.name + "-",
        function (suffix) {
          let ij = that.parseSpotLocation(suffix);
          //that.grow(ij.i, ij.j);
          that.grow(ij.i - 1, ij.j - 1);
          that.grow(ij.i + 1, ij.j + 1);
        }
      );
    }

    this.reset();
  }

  /**
   * Parse spot location from string parameters
   * @param {string} l (parameters of the grid)
   * @returns {{i: number, j: number}}
   */
  parseSpotLocation(l) {
    let s = l.split(/\-/g);
    let ii = s[0];
    let i;
    if (ii.length > 1 && ii.startsWith("0")) {
      i = -parseInt(ii.substring(1));
    } else {
      i = parseInt(ii);
    }
    let jj = s[1];
    let j;
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

  /**
   * Returns formated spot location
   * @param {number} i (distance of grid from left)
   * @param {number} j (distance of grid from top)
   * @returns {string} ( X-X )
   */
  _spotLocation(i, j) {
    return (i < 0 ? "0" + -i : i) + "-" + (j < 0 ? "0" + -j : j);
  }

  /**
   * Return the width of a row
   * @param {number} j (distance of grid from top)
   * @returns {number}
   */
  rowWidth(j) {
    return this.width - (this.type === 6 ? 1 - (Math.abs(j) % 2) : 0);
  }

  /**
   * Resets the position of the grid in top left
   */
  reset() {

    for (const row of this.spots) {
      row.layout.$.remove();
      for (const spot of row.row) {
        this._game.spotManager.unregisterSpot(spot.spot);
      }
    }

    this.spots = [];

    this.left = 0;
    this.top = 0;
    this.width = this.minWidth;
    this.height = this.minHeight;

    for (let j = 0; j < this.height; j++) {
      let rowLayout = this._layout.vertical().add();
      let row = [];
      this.spots.push({
        layout: rowLayout,
        row: row,
      });
      let w = this.rowWidth(j);
      for (let i = 0; i < w; i++) {
        this.createSpot(i, j, row, rowLayout);
      }
    }
  }

  /**
   * Creates a spot from distance (top-left) and row from the grid
   * @param {number} i (distance of grid from left)
   * @param {number} j (distance of grid from top)
   * @param row
   * @param rowLayout (layout of the row added - vertical/horizontal)
   */

  createSpot(i, j, row, rowLayout) {
    let spot = new Spot(
      rowLayout.horizontal().add(),
      this._game,
      "grid-" + this.name + "-" + this._spotLocation(i, j),
      { overlayable: true, layout: "stack" },
      this._cellContent.clone()
    );
    this._game.spotManager.registerSpot(spot);
    row.push({
      spot: spot,
    });
  }

  /**
   * Grow the grid of 1 down
   */
  growDown() {
    this.height++;

    let rowLayout = this._layout.vertical().add();
    let row = [];
    this.spots.push({
      layout: rowLayout,
      row: row,
    });
    let j = this.height - 1 + this.top;
    let w = this.rowWidth(j);
    for (let i = this.left; i < w + this.left; i++) {
      this.createSpot(i, j, row, rowLayout);
    }
  }

  /**
   * Grow the grid of 1 up
   */
  growUp() {
    this.top--;
    this.height++;

    let rowLayout = this._layout.vertical().predd();
    let row = [];
    this.spots.splice(0, 0, {
      layout: rowLayout,
      row: row,
    });
    let j = this.top;
    let w = this.rowWidth(j);
    for (let i = this.left; i < w + this.left; i++) {
      this.createSpot(i, j, row, rowLayout);
    }
  }

  /**
   * Grow the grid of 1 to the right
   */
  growRight() {
    this.width++;

    for (let j = this.top; j < this.height + this.top; j++) {
      let r = this.spots[j - this.top];
      let rowLayout = r.layout;
      let row = r.row;
      let w = this.rowWidth(j);
      let i = w - 1 + this.left;
      this.createSpot(i, j, row, rowLayout);
    }
  }

  /**
   * Grow the grid of 1 to the left
   */
  growLeft() {
    this.left--;
    this.width++;

    for (let j = this.top; j < this.height + this.top; j++) {
      let r = this.spots[j - this.top];
      let rowLayout = r.layout;
      let row = r.row;
      let i = this.left;
      let spot = new Spot(
        rowLayout.horizontal().predd(),
        this._game,
        "grid-" + this.name + "-" + this._spotLocation(i, j),
        { overlayable: true, layout: "stack" },
        this._cellContent.clone()
      );
      this._game.spotManager.registerSpot(spot);
      row.splice(0, 0, {
        spot: spot,
      });
    }
  }

  /**
   * Grow the grid to a size i(left),j(top)
   */
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

  /**
   * Get a spot i,j on the grid
   */
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
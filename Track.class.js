import { Spot } from "./Spot.class.js";

export class Track {
  /**
   * creates a new Track (name,title,size,vertical,start,step,limit,reversed) from a Layout in a given Game
   * @param {Layout} layout
   * @param {Game} game
   * @param {string} name
   * @param {string|null} title
   * @param {number} size
   * @param {boolean} vertical
   * @param {number} start
   * @param {number} step
   * @param {number|null} limit
   * @param {boolean} reversed
   */
  constructor(
    layout,
    game,
    name,
    title,
    size,
    vertical,
    start,
    step,
    limit,
    reversed
  ) {
    this._game = game;
    this.name = name;
    this.title = title;
    this.size = size;
    this.vertical = vertical;
    this.start = start;
    this.step = step;
    this.limit = limit;
    this.reversed = reversed;

    this.minSize = size;

    layout.$.addClass("track")
      .addClass("track-" + (vertical ? "vertical" : "horizontal"))
      .addClass("track-" + name);

    this.$ = layout.$;

    let locationPrefix = "track-" + name + "-";

    this.spots = [];
    let that = this;
    let level = 0;
    if (vertical) {
      let currentContainedLayout;
      if (limit !== null) {
        currentContainedLayout = layout.horizontal().add().vertical();
      } else {
        currentContainedLayout = layout.vertical();
      }

      if (title !== null) {
        let levelLayout = currentContainedLayout.add();
        levelLayout
          .layout()
          .inside()
          .set($("<div>").addClass("title").addClass("mainTitle").text(title));
        levelLayout.layout().west().set($("<div>").addClass("title").text(""));
      }
      for (let i = start; i < start + size * step; i = i + step) {
        if (currentContainedLayout === null) {
          currentContainedLayout = layout.horizontal().add().vertical();
        }
        let levelLayout = reversed
          ? currentContainedLayout.predd()
          : currentContainedLayout.add();
        let spot = new Spot(
          levelLayout.layout().inside(),
          game,
          locationPrefix + level,
          { overlayable: true }
        );
        game.spotManager.registerSpot(spot);
        levelLayout
          .layout()
          .west()
          .set(
            $("<div>")
              .addClass("title")
              .text("" + i)
          );
        that.spots.push({
          layout: levelLayout,
          spot: spot,
        });

        level++;

        if (limit !== null && level % limit === 0) {
          currentContainedLayout = null;
        }
      }
    } else {
      let currentContainedLayout;
      if (limit !== null) {
        currentContainedLayout = layout.vertical().add().horizontal();
      } else {
        currentContainedLayout = layout.horizontal();
      }
      for (let i = start; i < start + size * step; i = i + step) {
        if (currentContainedLayout === null) {
          currentContainedLayout = layout.vertical().add().horizontal();
        }
        let levelLayout = currentContainedLayout.add();
        let spot = new Spot(
          levelLayout.layout().inside(),
          game,
          locationPrefix + level,
          { overlayable: true, layout: "vertical" }
        );
        game.spotManager.registerSpot(spot);
        let t = $("<div>").addClass("title");
        if (level === 0 && title !== null) {
          t.addClass("mainTitle").text(title);
        } else {
          t.text("" + i);
        }
        levelLayout.layout().north().set(t);
        that.spots.push({
          layout: levelLayout,
          spot: spot,
        });

        level++;

        if (limit !== null && level % limit === 0) {
          currentContainedLayout = null;
        }
      }
    }
  }
}

"use strict";

class Track {
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

    var locationPrefix = "track-" + name + "-";

    this.spots = [];
    var that = this;
    var level = 0;
    if (vertical) {
      var currentContainedLayout;
      if (limit !== null) {
        currentContainedLayout = layout.horizontal().add().vertical();
      } else {
        currentContainedLayout = layout.vertical();
      }

      if (title !== null) {
        var levelLayout = currentContainedLayout.add();
        levelLayout
          .layout()
          .inside()
          .set($("<div>").addClass("title").addClass("mainTitle").text(title));
        levelLayout.layout().west().set($("<div>").addClass("title").text(""));
      }
      Utils.loop(start, start + size * step, step, function (i) {
        if (currentContainedLayout === null) {
          currentContainedLayout = layout.horizontal().add().vertical();
        }
        var levelLayout = reversed
          ? currentContainedLayout.predd()
          : currentContainedLayout.add();
        var spot = new Spot(
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
      });
    } else {
      var currentContainedLayout;
      if (limit !== null) {
        currentContainedLayout = layout.vertical().add().horizontal();
      } else {
        currentContainedLayout = layout.horizontal();
      }

      Utils.loop(start, start + size * step, step, function (i) {
        if (currentContainedLayout === null) {
          currentContainedLayout = layout.vertical().add().horizontal();
        }
        var levelLayout = currentContainedLayout.add();
        var spot = new Spot(
          levelLayout.layout().inside(),
          game,
          locationPrefix + level,
          { overlayable: true, layout: "vertical" }
        );
        game.spotManager.registerSpot(spot);
        var t = $("<div>").addClass("title");
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
      });
    }
  }
}

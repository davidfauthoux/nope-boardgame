import { Utils } from "../Utils.class.js";
import { Layout } from "../Layout.class.js";
import { FaceIcon } from "./FaceIcon.class.js";

export class FriendMouse {
  constructor(game) {
    //, number) {
    var that = this;

    this._game = game;
    // this._number = number;

    var layout = new Layout();
    game.overlay.$.append(layout.$.addClass("friendMouse"));

    var faceLayout = layout.overlay();
    this.faceIcon = new FaceIcon(faceLayout, game);
    faceLayout.$.addClass("faceContainer");

    var mouse = $(
      '<svg style="filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5)); fill: white; stroke: black; stroke-width: 28; stroke-linecap: round; stroke-linejoin: round; stroke-miterlimit: 10;" width="20px" height="20px" viewBox="0 0 385 462"><polygon points="17,18 359,212 245,257 361,372 279,437 189,297 120,393"/></svg>'
    );

    layout.overlay().set(mouse);
    this._dragLayout = layout.underlay();
    this._dragLayout.$.addClass("dragContainer");

    this._mouseDiv = layout.$.hide();

    // this._hoverNumberDiv = $("<div>").addClass("friendNumber").text("" + number).hide();
    // this._selectNumberDiv = $("<div>").addClass("friendNumber").text("" + number).hide();

    this._currentSelect = null;
    this._currentHover = null;
    this._currentRef = null;
    this._currentRefId = null;
    this._visible = false;

    this._clearOver = function () {
      if (that._currentHover !== null) {
        // that._currentHover.removeClass("friendHover-" + that._number);
        var otherFriendHovering = false;
        var classes = that._currentHover.attr("class");
        if (classes) {
          Utils.each(classes.split(/s+/), function (c) {
            if (c.startsWith("friendHover-")) {
              otherFriendHovering = true;
            }
          });
        }
        if (!otherFriendHovering) {
          that._currentHover.removeClass("friendHover");
        }
        that._currentHover = null;
        // that._hoverNumberDiv.hide();
      }
    };

    this._clearSelect = function () {
      if (that._currentSelect !== null) {
        // that._currentSelect.removeClass("friendSelected-" + that._number);
        var otherFriendHovering = false;
        var classes = that._currentSelect.attr("class");
        if (classes) {
          Utils.each(classes.split(/s+/), function (c) {
            if (c.startsWith("friendSelected-")) {
              otherFriendHovering = true;
            }
          });
        }
        if (!otherFriendHovering) {
          that._currentSelect.removeClass("friendSelected");
        }
        that._currentSelect = null;
        // that._selectNumberDiv.hide();
      }
    };

    this._mouseDivHovered = false;
  }

  destroy() {
    this.faceIcon.destroy();
    this._mouseDiv.remove();
    // this._hoverNumberDiv.remove();
    // this._selectNumberDiv.remove();
    this._clearSelect();
    this._clearOver();
  }

  move(ref, x, y) {
    if (this._currentRef !== null) {
      if (this._currentRefId !== ref) {
        this._currentRef = null;
        this._currentRefId = null;
      }
    }

    /*%%%%%
		if (this._currentRef !== null) {
			if (this._currentRef.hasClass("destroyed")) {
				this._currentRef = null;
				this._currentRefId = null;
			}
		}
*/

    if (this._currentRef === null) {
      this._currentRef = $('[data-id="' + ref + '"');
      if (this._currentRef.length === 0) {
        this._currentRef = null;
        this._currentRefId = null;
      } else {
        this._currentRefId = ref;
      }
    }
    if (this._currentRef !== null) {
      var p = this._game.overlay.offset(this._currentRef);
      if (p) {
        var xx = x + p.x;
        var yy = y + p.y;
        if (!this._visible) {
          this._mouseDiv.show();
          this._visible = true;
          this._mouseDiv.stop().css({ top: yy, left: xx });
        } else {
          this._mouseDiv
            .stop()
            .animate({ top: yy, left: xx }, (0.15 / 2) * 1000); // Based on the default throttle (should not be too slow or the cursor will jump)
        }
      }
    }
  }

  discard() {
    this._mouseDiv.hide();
    this._visible = false;
    this._currentRef = null;
    this._currentRefId = null;
  }

  drag(kind) {
    this._dragLayout.reset();
    if (kind !== undefined) {
      var item = this._game.itemManager.getItem(kind);
      if (item === null) {
        return;
      }
      item.createInstance(this._dragLayout.overlay().packed(), false, null);
    }
  }

  select(spot, kind) {
    this._clearSelect();
    if (spot !== undefined && kind !== undefined) {
      var s = this._game.spotManager.getSpot(spot);
      if (s !== null) {
        var i = s.getItemInstance(kind);
        if (i !== null) {
          this._currentSelect = i.$;
          if (this._currentSelect.length > 0) {
            this._currentSelect.addClass("friendSelected");
            // this._currentSelect.addClass("friendSelected-" + this._number).append(this._selectNumberDiv);
            // this._selectNumberDiv.show();
          }
        }
      }
    }
  }

  over(ref) {
    this._clearOver();
    if (ref !== undefined) {
      this._currentHover = $('[data-id="' + ref + '"');
      if (this._currentHover.length === 0) {
        this._currentHover = null;
      } else {
        this._currentHover.addClass("friendHover");
        // this._currentHover.addClass("friendHover-" + this._number).append(this._hoverNumberDiv);
        // this._hoverNumberDiv.show();
      }
    }
  }
}

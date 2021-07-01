import { UserInteraction } from "../UserInteraction.class.js";
import { Administration } from "./Administration.class.js";
import { Layout } from "../Layout.class.js";
import { FaceIcon } from "./FaceIcon.class.js";
import { Server } from "../Server.class.js";

export class NewsManager {
  /**
   * creates a new (unique) NewManager for a given Game
   * @param {Layout} layout
   * @param game
   */
  constructor(layout, game) {
    let that = this;

    this._game = game;

    this._delete = $(
      '<svg viewBox="0 0 512 512"><path d="M437,75C388.7,26.6,324.4,0,256,0S123.3,26.6,75,75S0,187.6,0,256c0,68.4,26.6,132.7,75,181s112.6,75,181,75 s132.7-26.6,181-75s75-112.6,75-181C512,187.6,485.4,123.3,437,75z M366.7,331.4c9.8,9.8,9.8,25.6,0,35.4 c-4.9,4.9-11.3,7.3-17.7,7.3s-12.8-2.4-17.7-7.3L256,291.4l-75.4,75.4c-4.9,4.9-11.3,7.3-17.7,7.3s-12.8-2.4-17.7-7.3 c-9.8-9.8-9.8-25.6,0-35.4l75.4-75.4l-75.4-75.4c-9.8-9.8-9.8-25.6,0-35.4c9.8-9.8,25.6-9.8,35.4,0l75.4,75.4l75.4-75.4 c9.8-9.8,25.6-9.8,35.4,0c9.8,9.8,9.8,25.6,0,35.4L291.4,256L366.7,331.4z"/></svg>'
    );

    this._marks = [];
    this._countEvents = 0;
    this._seek = false;

    layout.layout().north().$.addClass("newsHeader");
    UserInteraction.get().click(
      layout
        .layout()
        .north()
        .horizontal()
        .add()
        .$.addClass("historyButton")
        .addClass("markButton"),
      function () {
        let event = { action: "mark", mark: Server.uuid() };
        game.eventManager.stack(event);
        game.eventManager.parse(event);
      }
    );
    this._backButton = layout.layout().north().horizontal().add().$;
    UserInteraction.get().click(
      this._backButton.addClass("historyButton").addClass("backButton"),
      function () {
        let to;
        if (that._countEvents > 0) {
          if (that._marks.length < 1) {
            to = null;
          } else {
            to = that._marks[that._marks.length - 1];
          }
        } else {
          if (that._marks.length < 2) {
            to = null;
          } else {
            to = that._marks[that._marks.length - 2];
          }
        }
        if (to !== null) {
          game.loading(true);
          setTimeout(function () {
            let event = { action: "seek", to: to };
            game.eventManager.stack(event);
            game.eventManager.parse(event);
          }, 100);
        }
      }
    );
    this._forwardButton = layout.layout().north().horizontal().add().$;
    UserInteraction.get().click(
      this._forwardButton.addClass("historyButton").addClass("forwardButton"),
      function () {
        if (that._seek) {
          game.loading(true);
          setTimeout(function () {
            let event = { action: "back" };
            game.eventManager.stack(event);
            game.eventManager.parse(event);
          }, 100);
        }
      }
    );
    UserInteraction.get().click(
      layout
        .layout()
        .north()
        .horizontal()
        .add()
        .$.text("Reset")
        .addClass("historyButton"),
      function () {
        game.loading(true);
        setTimeout(function () {
          game.eventManager.reset();
        }, 100);
      }
    );

    this._rootLayout = layout.layout().$;
    layout.layout().inside().$.addClass("news");
    this._layout = layout.layout().inside().overlay();
    this._lines = [];

    this._currentContext = {};
    this._timeoutId = null;
    this._mergedContext = {
      texts: [],
      reverse: [],
      reverseback: [],
    };

    this._lineHighlight = null;
    this._spotHighlights = [];

    this._confirmDiv = null;
    this._confirmTimeoutId = null;

    let storeKey = Administration.storeKey("news");
    if (game.store.get(storeKey) === "active") {
      this._active = true;
      this._rootLayout.show();
    } else {
      this._active = false;
      this._rootLayout.hide();
    }

    this._updateButtons = function () {
      if (that._marks.length > 0) {
        that._backButton.removeClass("inactive");
        if (that._countEvents === 0) {
          that._backButton.addClass("longBack");
        } else {
          that._backButton.removeClass("longBack");
        }
      } else {
        that._backButton.addClass("inactive");
        that._backButton.addClass("longBack");
      }

      if (that._seek) {
        that._forwardButton.removeClass("inactive");
      } else {
        that._forwardButton.addClass("inactive");
      }
    };
    this._updateButtons();
  }

  _clear() {
    this._lineHighlight = null;
    this._spotHighlights = [];
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this._layout.$.empty();
    this._lines = [];

    if (this._confirmTimeoutId !== null) {
      this._confirmDiv.remove();
      clearTimeout(this._confirmTimeoutId);
      this._confirmTimeoutId = null;
    }
  }

  /**
   * checks if Manager is active
   * @returns {boolean|*}
   */
  isActive() {
    return this._active;
  }

  /**
   * activates (true) or deactivates (false) the Manager
   * @param {boolean} flag
   */
  activate(flag) {
    let storeKey = Administration.storeKey("news");
    this._game.store.set(storeKey, flag ? "active" : null);
    if (flag) {
      this._rootLayout.show();
    } else {
      this._rootLayout.hide();
      this._clear();
    }

    this._active = flag;
    Layout.fit();
  }

  /**
   * clears everything from the Manager
   */
  clear() {
    this._marks = [];
    this._countEvents = 0;
    this._seek = false;
    this._updateButtons();
    this._currentContext = {};
    this._mergedContext = {
      texts: [],
      reverse: [],
      reverseback: [],
    };
    this._clear();
  }

  _clearConfirm() {
    if (this._confirmTimeoutId !== null) {
      this._confirmDiv.remove();
      clearTimeout(this._confirmTimeoutId);
      this._confirmTimeoutId = null;
    }
  }

  /**
   * add or remove class reversed to the connected div
   * @param {number} id
   */
  lineReversed(id) {
    this._clearConfirm();

    let div = $("#newsLine-" + id);
    if (!div.hasClass("reversed")) {
      div.addClass("reversed");
    } else {
      div.removeClass("reversed");
    }
  }

  /**
   * Adds a line to the associated news (id)
   * @param id
   * @param liveId
   * @param texts
   * @param reverse
   * @param reverseback
   */
  appendLine(id, liveId, texts, reverse, reverseback) {
    if (!this._active) {
      return;
    }

    this._clearConfirm();

    let outside = function (container, div) {
      return div.position().top >= container.height();
    };

    let that = this;

    let l = new Layout();
    this._layout.$.prepend(l.$);
    l.$.addClass("newsLine").attr("id", "newsLine-" + id);

    let faceIcon = new FaceIcon(l.layout().west(), this._game);
    faceIcon.update(null, liveId);
    console.log("Adding face icon: " + liveId);
    this._game.friendFaces.add(faceIcon);

    this._lines.splice(0, 0, {
      face: faceIcon,
      div: l.$,
    });
    for (const t of texts) {
      let text = t.text;
      if (text === undefined) {
        return;
      }

      let locations = t.locations;
      let d = l.layout().inside().vertical().add().$.addClass("newsText");
      d.text(text);

      if (locations !== undefined) {
        UserInteraction.get().click(
            d.addClass("newsTextWithLocations"),
            function () {
              if (that._lineHighlight !== null) {
                that._lineHighlight.removeClass("highlight");
              }
              for (const d of that._spotHighlights) {
                d.removeClass("highlight");
              }
              that._spotHighlights = [];
              if (that._lineHighlight === d) {
                that._lineHighlight = null;
                return;
              }
              that._lineHighlight = d;
              for (const location of locations) {
                let spot = that._game.spotManager.getSpot(location);
                if (spot !== null) {
                  that._spotHighlights.push(spot.$);
                  spot.$.addClass("highlight");
                }
              }
              that._lineHighlight.addClass("highlight");
            }
        );
      }
    }

    if (reverse !== undefined) {
      UserInteraction.get().click(
        l.layout().east().set(this._delete.clone()).$.addClass("newsDelete"),
        function () {
          if (that._lineHighlight !== null) {
            that._lineHighlight.removeClass("highlight");
            that._lineHighlight = null;
          }
          for (const d of that._spotHighlights) {
            d.removeClass("highlight");
          }
          that._spotHighlights = [];

          let confirm = l.overlay();
          confirm.$.addClass("newsConfirm");
          let button = confirm
            .layout()
            .north()
            .packed()
            .$.addClass("newsConfirmButton");

          let buttonText;
          let buttonAction;
          if (l.$.hasClass("reversed")) {
            buttonText = "Confirm back?";
            buttonAction = function () {
              if (reverseback !== undefined) {
                let event = {
                  action: "multiple",
                  events: reverseback,
                };
                that._game.eventManager.stack(event);
                that._game.eventManager.parse(event);
                Layout.fit();
              }
            };
          } else {
            buttonText = "Confirm reversal?";
            buttonAction = function () {
              let event = {
                action: "multiple",
                events: reverse,
              };
              that._game.eventManager.stack(event);
              that._game.eventManager.parse(event);
              Layout.fit();
            };
          }

          button.text(buttonText);
          UserInteraction.get().click(button, function () {
            that._clearConfirm();
            buttonAction();
          });

          that._clearConfirm();
          that._confirmDiv = confirm.$;
          that._confirmTimeoutId = setTimeout(function () {
            that._confirmDiv.remove();
            that._confirmTimeoutId = null;
          }, 2000);
        }
      );
    }

    let firstLineOutside = null;
    for (const lineIndex in this._lines) {
      let line = this._lines[lineIndex];
      if (firstLineOutside !== null || outside(that._layout.$, line.div)) {
        console.log("Removing outside news line: " + lineIndex);
        if (line.div === that._lineHighlight) {
          that._lineHighlight.removeClass("highlight");
          that._lineHighlight = null;
          for (const d of that._spotHighlights) {
            d.removeClass("highlight");
          }
          that._spotHighlights = [];
        }
        line.div.remove();
        line.face.destroy();
        that._game.friendFaces.remove(line.face);
        if (firstLineOutside === null) {
          firstLineOutside = lineIndex;
        }
      }
    }
    if (firstLineOutside !== null) {
      this._lines = this._lines.slice(0, firstLineOutside);
    }
  }

  /**
   * handle an event with its answer
   * @param event
   * @param received
   * @returns {*}
   */
  handle(event, received) {
    let that = this;

    if (event.action === "mark") {
      this._marks.push(event.mark);
      this._seek = false;
      this._countEvents = 0;
      //TODO Accelerate the news publish before the mark event???
    } else if (event.action === "seek") {
      this._seek = true;
    } else {
      this._seek = false;
      this._countEvents++;
    }
    // console.log("Current events (" + this._countEvents + "/" + this._seek + ") and marks = " + JSON.stringify(this._marks));
    this._updateButtons();

    if (event.action === "mark" || event.action === "seek") {
      return;
    }
    if (received) {
      return;
    }

    let simplifyKind = function (kind) {
      let i = kind.indexOf("-");
      if (i < 0) {
        return kind;
      }
      return (
        kind.substring(0, i) +
        " '" +
        kind.substring(i + 1).replace(/\_/g, " ") +
        "'"
      );
    };
    let simplifyLocation = function (location) {
      let i = location.indexOf("-");
      if (i < 0) {
        return location;
      }
      location = location.substring(i + 1);
      i = location.indexOf("-");
      let suffix;
      if (i < 0) {
        suffix = "";
      } else {
        suffix = "#" + location.substring(i + 1);
        location = location.substring(0, i);
      }
      return location + suffix;
    };
    let buildText = function (context, defaultTitle) {
      let t = context.title === undefined ? defaultTitle : context.title;

      let count = 0;

      if (context.states !== undefined) {
        for (const k in context.states) {
          let stateElements = context.states[k];
          if (count === 0) {
            t += ": ";
          } else {
            t += ", ";
          }
          t += simplifyKind(k);
          for (const stateKey in stateElements) {
            let stateValue = stateElements[stateKey];
            t +=
                " " +
                stateKey +
                (stateValue.value === undefined
                    ? ""
                    : " (" + stateValue.value + ")");
          }
          count++;
        }
      }

      if (context.kinds !== undefined) {
        for (let k in context.kinds) {
          let n = context.kinds[k];
          if (context.map !== undefined) {
            let m = context.map[k];
            if (m !== undefined) {
              k = m;
            }
          }
          if (k !== null) {
            if (count === 0) {
              t += ": ";
            } else {
              t += ", ";
            }
            t += simplifyKind(k) + (n === 1 ? "" : " (" + n + ")");
            count++;
          }
        }
      }
      if (context.title === undefined && count === 0) {
        return null;
      }
      if (t.length > 200) {
        t = t.substring(0, 200 - " [...]".length) + " [...]";
      }
      return t;
    };

    let interpretDrop = function (context, location, kind, count) {
      let newsTrigger = {
        location: location,
        kind: kind,
      };
      that._game.triggerManager.addingNews("drop", newsTrigger);
      if (newsTrigger.location === undefined) {
        return context;
      }

      //

      if (count === undefined) {
        context = {
          action: "drop",
          location: location,
          kinds: {},
        };
      } else {
        if (context.action !== "drop" || location !== context.location) {
          context = {
            action: "drop",
            location: location,
            kinds: {},
          };
          context.kinds[kind] = count;
        } else {
          let c = context.kinds[kind];
          if (c === undefined) {
            c = 0;
          }
          c += count;
          context.kinds[kind] = c;
        }
      }

      context.text = function () {
        return buildText(
          context,
          "Dropped in " + simplifyLocation(context.location)
        );
      };

      if (newsTrigger.title !== undefined) {
        context.title = newsTrigger.title;
      }
      if (newsTrigger.kind !== kind) {
        if (context.map === undefined) {
          context.map = {};
        }
        context.map[kind] =
          newsTrigger.kind === undefined ? null : newsTrigger.kind;
      }

      return context;
    };

    let interpretDestroy = function (context, location, kind, count) {
      if (kind === undefined) {
        return context;
      }

      let newsTrigger = {
        location: location,
        kind: kind,
      };
      that._game.triggerManager.addingNews("destroy", newsTrigger);
      if (newsTrigger.location === undefined) {
        return context;
      }

      //

      if (count === undefined) {
        context = {
          action: "destroy",
          location: location,
          kinds: {},
        };
      } else {
        if (context.action !== "destroy" || location !== context.location) {
          context = {
            action: "destroy",
            location: location,
            kinds: {},
          };
          context.kinds[kind] = count;
        } else {
          let c = context.kinds[kind];
          if (c === undefined) {
            c = 0;
          }
          c += count;
          context.kinds[kind] = c;
        }
      }

      context.text = function () {
        return buildText(
          context,
          "Destroyed from " + simplifyLocation(context.location)
        );
      };

      if (newsTrigger.title !== undefined) {
        context.title = newsTrigger.title;
      }
      if (newsTrigger.kind !== kind) {
        if (context.map === undefined) {
          context.map = {};
        }
        context.map[kind] =
          newsTrigger.kind === undefined ? null : newsTrigger.kind;
      }

      return context;
    };
    let interpretMove = function (context, location, to, kind, count) {
      let newsTrigger = {
        location: to,
        from: location,
        kind: kind,
      };
      that._game.triggerManager.addingNews("move", newsTrigger);
      if (newsTrigger.location === undefined) {
        return context;
      }

      //

      if (count === undefined) {
        context = {
          action: "move",
          location: location,
          to: to,
          kinds: {},
        };
      } else {
        if (
          context.action !== "move" ||
          location !== context.location ||
          to !== context.to
        ) {
          context = {
            action: "move",
            location: location,
            to: to,
            kinds: {},
          };
          context.kinds[kind] = count;
        } else {
          let c = context.kinds[kind];
          if (c === undefined) {
            c = 0;
          }
          c += count;
          context.kinds[kind] = c;
        }
      }

      context.text = function () {
        return buildText(
          context,
          "Moved from " +
            simplifyLocation(context.location) +
            " to " +
            simplifyLocation(context.to)
        );
      };

      if (newsTrigger.title !== undefined) {
        context.title = newsTrigger.title;
      }
      if (newsTrigger.kind !== kind) {
        if (context.map === undefined) {
          context.map = {};
        }
        context.map[kind] =
          newsTrigger.kind === undefined ? null : newsTrigger.kind;
      }

      return context;
    };
    let interpretPaint = function (context, location, kind, key, value) {
      let newsTrigger = {
        location: location,
        kind: kind,
        key: key,
        value: value,
      };
      that._game.triggerManager.addingNews("paint", newsTrigger);
      if (newsTrigger.location === undefined) {
        return context;
      }

      //

      if (context.action !== "paint" || location !== context.location) {
        context = {
          action: "paint",
          location: location,
          states: {},
        };
      }
      let c = context.states[kind];
      if (c === undefined) {
        c = {};
        context.states[kind] = c;
      }
      let cc = c[key];
      if (cc === undefined) {
        cc = {
          value: value,
          previous: currentState,
        };
      } else {
        cc = {
          value: value,
          previous: cc.previous,
        };
      }
      c[key] = cc;

      context.text = function () {
        return buildText(
          context,
          "Painted in " + simplifyLocation(context.location)
        );
      };

      if (newsTrigger.title !== undefined) {
        context.title = newsTrigger.title;
      }
      if (newsTrigger.kind !== kind) {
        if (context.map === undefined) {
          context.map = {};
        }
        context.map[kind] =
          newsTrigger.kind === undefined ? null : newsTrigger.kind;
      }

      return context;
    };

    let mergeNewLine = function () {
      if (that._currentContext.text !== undefined) {
        let locations = [];
        locations.push(that._currentContext.location);
        if (that._currentContext.to !== undefined) {
          locations.push(that._currentContext.to);
        }

        let text = that._currentContext.text();

        if (text !== null) {
          // Finally not added...
          that._mergedContext.texts.push({
            text: text === null ? undefined : text,
            locations: locations.length === 0 ? undefined : locations,
          });
        }
      }
      that._currentContext = {};
    };

    let mergeContext = function (newContext) {
      if (newContext === null) {
        return;
      }

      if (newContext !== that._currentContext) {
        mergeNewLine();
      }
      that._currentContext = newContext;
    };

    //

    if (that._timeoutId !== null) {
      clearTimeout(that._timeoutId);
      that._timeoutId = null;
    }

    let reversedEvent;

    //TODO reversedEvent = null if count === undefined ??
    if (event.action === "drop") {
      reversedEvent = {
        action: "destroy",
        location: event.location,
        kind: event.kind,
        count: event.count,
      };

      mergeContext(
        interpretDrop(
          that._currentContext,
          event.location,
          event.kind,
          event.count
        )
      );
    } else if (event.action === "destroy") {
      reversedEvent = {
        action: "drop",
        location: event.location,
        kind: event.kind,
        count: event.count,
      };

      mergeContext(
        interpretDestroy(
          that._currentContext,
          event.location,
          event.kind,
          event.count
        )
      );
    } else if (event.action === "move") {
      reversedEvent = {
        action: "move",
        location: event.to,
        to: event.location,
        kind: event.kind,
        count: event.count,
      };

      mergeContext(
        interpretMove(
          that._currentContext,
          event.location,
          event.to,
          event.kind,
          event.count
        )
      );
    } else if (event.action === "paint") {
      let paintedSpot = that._game.spotManager.getSpot(event.location);
      if (paintedSpot === null) {
        return context;
      }
      let paintedItem = paintedSpot.getItemInstance(event.kind);
      if (paintedItem === null) {
        return context;
      }
      let currentState = paintedItem.state[event.key];

      reversedEvent = {
        action: "paint",
        location: event.location,
        kind: event.kind,
        key: event.key,
        value: currentState,
      };

      mergeContext(
        interpretPaint(
          that._currentContext,
          event.location,
          event.kind,
          event.key,
          event.value
        )
      );
    } else if (event.action === "play") {
      // Ignored
      reversedEvent = undefined;
    } else {
      reversedEvent = null;
    }

    if (reversedEvent === undefined) {
      // Ignored
    } else if (reversedEvent === null) {
      that._mergedContext.reverse = null;
      that._mergedContext.reverseback = null;
    } else if (
      that._mergedContext.reverse !== null &&
      that._mergedContext.reverseback !== null
    ) {
      that._mergedContext.reverse.splice(0, 0, reversedEvent);
      that._mergedContext.reverseback.push(event);
    }

    that._timeoutId = setTimeout(function () {
      mergeNewLine();

      let id = Server.uuid();

      if (that._mergedContext.reverse !== null) {
        that._mergedContext.reverse.push({
          action: "unnews",
          id: id,
        });
      }
      if (that._mergedContext.reverseback !== null) {
        that._mergedContext.reverseback.push({
          action: "unnews",
          id: id,
        });
      }

      let stripped = that._mergedContext.texts;
      if (stripped.length > 10) {
        stripped = stripped.slice(0, 10 - 1);
        stripped.push({
          text: "[...]",
        });
      }
      if (stripped.length === 0) {
        stripped.push({
          text: "[...]",
        });
      }

      that.appendLine(
        id,
        event.live,
        stripped,
        that._mergedContext.reverse === null
          ? undefined
          : that._mergedContext.reverse,
        that._mergedContext.reverseback === null
          ? undefined
          : that._mergedContext.reverseback
      );

      that._game.eventManager.stack({
        action: "news",
        live: event.live,
        id: id,
        texts: stripped,
        reverse:
          that._mergedContext.reverse === null
            ? undefined
            : that._mergedContext.reverse,
        reverseback:
          that._mergedContext.reverseback === null
            ? undefined
            : that._mergedContext.reverseback,
      });

      that._mergedContext = {
        texts: [],
        reverse: [],
        reverseback: [],
      };
    }, 3000);
  }
}

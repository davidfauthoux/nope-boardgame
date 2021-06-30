import { GeneralReference } from "./GeneralReference.class.js";
import { FaceIcon } from "./FaceIcon.class.js";
import { VideoIcon } from "./VideoIcon.class.js";
import { Layout } from "../Layout.class.js";
import { UserInteraction } from "../UserInteraction.class.js";
import { ExecutionContext } from "./ExecutionContext.class.js";
import { Spot } from "./Spot.class.js";

export class Item {
  /**
   * creates a new Item in a given Game, with a given kind
   * @param {Game} game
   * @param {string} kind
   */
  constructor(game, kind) {
    let that = this;

    this.kind = kind;
    this.properties = game.generalReference.properties(kind);
    this.modifiers = game.generalReference.modifiers(kind);

    let generalKinds = GeneralReference.getGeneralKinds(kind);

    this._createInstance = function (layout, countable, liveId) {
      let itemDiv;
      let countItem;
      let faceIcon = null;

      itemDiv = layout;
      itemDiv.$.addClass("item")
          .addClass("item-" + kind)
          .attr("data-kind", kind);
      for (const generalKind of generalKinds) {
        itemDiv.$.addClass("item-" + generalKind.kind);
        itemDiv.$.addClass("_-" + generalKind.suffix);
      }
      for (const k in that.properties) {
        itemDiv.$.addClass("property-" + k);
      }
      for (const k in that.modifiers) {
        itemDiv.$.addClass("modifier-" + k);
      }

      let innerLayout = countable
          ? itemDiv.packed().horizontal().add()
          : itemDiv;

      let extraSpots = [];
      let defaultInputVal = "";

      if (kind === "live") {
        faceIcon = new FaceIcon(innerLayout, game);
        faceIcon.update(null, liveId);
      } else if (kind === "video") {
        faceIcon = new VideoIcon(innerLayout, game, "video");
        faceIcon.update(null, liveId);
      } else if (kind === "audio") {
        faceIcon = new VideoIcon(innerLayout, game, "audio");
        faceIcon.update(null, liveId);
      } else {
        let foundContentDiv = game.generalReference.build(kind);

        if (countable) {
          foundContentDiv.find("[data-location]").append(function () {
            let extraSpotLayout = new Layout();
            let extraSpotLocation = $(this).attr("data-location");
            let extraSpot = new Spot(extraSpotLayout, game, extraSpotLocation, {
              extra: true,
            });
            let prevSpot = game.spotManager.getSpot(extraSpotLocation);
            if (prevSpot !== null) {
              for (const key in prevSpot._itemInstances){
                let ii = prevSpot._itemInstances[key];
                extraSpot.addItem(
                    ii.item.kind,
                    ii.infinite ? undefined : ii.count,
                    ii.liveId
                );
                for (const key in ii.state) {
                  extraSpot.setItemState(ii.item.kind, key, ii.state[key]);
                }
              });
              prevSpot.destroy();
            }
            game.spotManager.registerSpot(extraSpot); // We do not unregister on item delete, the spot may become a ghost but that's ok
            extraSpots.push(extraSpot);
            return extraSpotLayout.$;
          });
        }

        foundContentDiv
            .find("input")
            .first()
            .replaceWith(function () {
              defaultInputVal = $(this).val();
              let titleDiv = $("<div>")
                  .addClass("editable")
                  .text(defaultInputVal);

              let input = null;
              let onClick;
              let backToTitle = function () {
                input.remove();
                input = null;
                UserInteraction.get().click(titleDiv, onClick);
              };
              onClick = function () {
                let previous = titleDiv.text();
                let cancel = function () {
                  titleDiv.text(previous);
                  backToTitle();
                };
                input = $("<input>").attr("spellcheck", "false").val(previous);
                titleDiv.text("");
                titleDiv.append(input);

                titleDiv.off();
                input.on("keydown", function (e) {
                  console.log("Key pressed in input: [" + e.key + "]");
                  if (e.key === "Enter") {
                    let newTitle = input.val().trim();
                    titleDiv.text(newTitle);
                    backToTitle();
                    ExecutionContext.stackAndTrigger(
                        game,
                        {
                          action: "paint",
                          key: "input",
                          value: newTitle,
                          kind: kind,
                          location: countItem.spot.location,
                        },
                        null,
                        countItem.spot,
                        countItem.item
                    );
                  } else if (e.key === "Escape") {
                    cancel();
                  }
                });
                input.on("blur", cancel);
                input.focus();
              };

              UserInteraction.get().click(titleDiv, onClick);
              return titleDiv;
            });

        innerLayout.set(foundContentDiv);
      }

      // console.log("Creating instance: " + kind);

      countItem = {
        spot: null,
        setLiveId: function (id) {
          countItem.liveId = id;
          if (id === undefined) {
            itemDiv.$.addClass("lost");
          } else {
            itemDiv.$.removeClass("lost");
          }
        },
        faceIcon: faceIcon,
        item: that,
        _extraSpots: extraSpots,
        $: itemDiv === null ? undefined : itemDiv.$,
        infinite: false,
        count: 0,
        state: {},
        _countDiv: null,
        _updateCountDiv: function () {
          if (countItem.infinite) {
            itemDiv.$.addClass("infinite");
          } else {
            itemDiv.$.removeClass("infinite");
          }

          if (
              (countItem.count === 1 || countItem.infinite) &&
              that.properties.count === undefined &&
              countItem.state.count === undefined
          ) {
            let flag = countItem.state.auto_flag;
            if (flag === undefined) {
              flag = that.properties.flag;
            }
            if (flag === undefined) {
              flag = countItem.state.flag;
            }
            if (flag !== undefined) {
              if (countItem._countDiv === null) {
                countItem._countDiv = itemDiv.overlay().packed();
                countItem._countDiv.$.addClass("count");
              }
              countItem._countDiv.$.text(flag);
              return;
            } else {
              if (countItem._countDiv !== null) {
                countItem._countDiv.$.parent().remove();
                countItem._countDiv = null;
              }
            }
          } else {
            if (countItem._countDiv === null) {
              countItem._countDiv = itemDiv.overlay().packed();
              countItem._countDiv.$.addClass("count");
            }
            countItem._countDiv.$.text("" + countItem.count);
          }
        },
        inc: function (n) {
          if (countItem.infinite) {
            return;
          }
          // countItem.infinite = false;
          if (n === undefined) {
            n = 1;
          }
          /*%%
					let c;
					if ((countItem.count + n) < 0) {
						c = 0;
					} else {
						c = countItem.count + n;
					}
					*/
          let c = countItem.count + n;
          // console.log("Inc item: " + countItem.count + " -> " + c);
          countItem.count = c;
          countItem._updateCountDiv();
        },
        set: function (n) {
          if (countItem.infinite) {
            return;
          }
          // countItem.infinite = false;
          if (n === undefined) {
            n = 1;
          }
          let c = n;
          // console.log("Set item: " + countItem.count + " -> " + c);
          countItem.count = c;
          countItem._updateCountDiv();
        },
        setInfinite: function () {
          countItem.infinite = true;
          countItem._updateCountDiv();
        },
        setState: function (key, value) {
          if (key === "input") {
            if (value === undefined) {
              value = defaultInputVal;
            }
            if (itemDiv !== null) {
              itemDiv.$.find(".editable").first().text(value);
            }
            return;
          }
          /*%%%%%%
					if (key === "tip") {
						if (itemDiv !== null) {
							itemDiv.$.find(".tip").remove();
							if (value !== undefined) {
								let tipDiv = $("<div>").addClass("tip").text(value);
								tipDiv.click(function() {
									tipDiv.remove();
								});
								itemDiv.$.append(tipDiv);
							}
						}
						return;
					}
					*/

          if (itemDiv !== null) {
            let old = countItem.state[key];
            if (value === undefined) {
              if (old !== undefined) {
                itemDiv.$.removeClass("state-" + key);
                if (old !== null) {
                  itemDiv.$.removeClass("state-" + key + "-" + old);
                }
              }
            } else {
              if (old === undefined) {
                itemDiv.$.addClass("state-" + key);
                if (value !== null) {
                  itemDiv.$.addClass("state-" + key + "-" + value);
                }
              } else if (old !== value) {
                if (old !== null) {
                  itemDiv.$.removeClass("state-" + key + "-" + old);
                }
                if (value !== null) {
                  itemDiv.$.addClass("state-" + key + "-" + value);
                }
              }
            }
          }

          if (value === undefined) {
            delete countItem.state[key];
          } else {
            /*%%
						if (key !== "count") {
							debugger;
						}
						*/
            countItem.state[key] = value;
          }

          if (key === "count" || key === "flag" || key === "auto_flag") {
            countItem._updateCountDiv();
          }
        },
      };

      countItem.setLiveId(liveId);
      return countItem;
    };
  }

  /**
   * creates an instance for the Item
   * @param {Layout} layout
   * @param {boolean} countable
   * @param {number} liveId
   * @returns {*}
   */
  createInstance(layout, countable, liveId) {
    return this._createInstance(layout, countable, liveId);
  }
}

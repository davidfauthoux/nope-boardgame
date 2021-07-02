import { Multimap } from "../Multimap.class.js";
import { Utils } from "../Utils.class.js";
import { CssComposition } from "./CssComposition.class.js";
import { LayoutBuilder } from "../LayoutBuilder.class.js";
import { ExecutionContext } from "./ExecutionContext.class.js";
import { Server } from "./Server.class.js";

export class ScriptExecution {
  constructor(layout, game, contents) {
    var runScript;

    var dropsFoundInLayout = [];

    var generatedId = 0;

    var makeAnonymousTextItem = function (kind, text, properties) {
      if (kind === null) {
        kind = "" + generatedId;
        generatedId++;
      }
      var textKind = "text-generated-" + kind;
      game.generalReference.setContent(
        textKind,
        $("<span>").addClass("generatedText").text(text),
        properties,
        {}
      );
      console.log("Made anonymous text: " + textKind);
      return textKind;
    };

    var makeAnonymousColorItem = function (kind, text, properties) {
      if (kind === null) {
        kind = "" + generatedId;
        generatedId++;
      }
      var colorKind = "color-generated-" + kind;
      game.generalReference.setContent(
        colorKind,
        $("<div>").addClass("generatedColor").css({ background: text }),
        properties,
        {}
      );
      console.log("Made anonymous color: " + colorKind);
      return colorKind;
    };

    var parseLayout = function () {
      var nextNameId = 0;
      game.gameManager.layouts = LayoutBuilder.build(
        contents.layout,
        layout,
        function (vars, applyToLayout, item) {
          var unvar = function (s) {
            Utils.each(vars, function (v, k) {
              s = s.replace(new RegExp("\\$" + k + "\\b"), v);
            });
            return s;
          };
          var getName = function () {
            var itemNameFound = item.children("name");
            if (itemNameFound.length === 0) {
              var generatedName = "unidentified_" + nextNameId;
              nextNameId++;
              return generatedName;
            } else {
              return unvar(itemNameFound.text().trim());
            }
          };

          var parseDrop = function (
            c,
            spotToDropIn,
            states,
            usingKind,
            usingCount
          ) {
            var kind =
              usingKind === undefined ? unvar(c.text().trim()) : usingKind;
            var count =
              usingCount === undefined
                ? c.attr("count") === undefined
                  ? undefined
                  : parseInt(c.attr("count"))
                : usingCount;
            dropsFoundInLayout.push(function (pools, tracks, grids) {
              var it = spotToDropIn(pools, tracks, grids).drop(
                kind,
                count === null ? undefined : count
              );
              Utils.each(states, function (v, k) {
                it.paint(k, v);
              });
            });
          };

          var parseElements = function (
            buildSpot,
            states,
            cc,
            anonymousItemCount,
            anonymousItemProperties
          ) {
            cc.children().each(function (_, c) {
              c = $(c);
              var ctag = c.prop("tagName");
              if (ctag === "state") {
                var stateKey = c.attr("key");
                var stateValue = c.attr("value");
                if (stateValue === undefined) {
                  stateValue = null;
                }
                var clonedStates = Utils.clone(states);
                clonedStates[stateKey] = stateValue;
                parseElements(buildSpot, clonedStates, c);
                return;
              }
              if (ctag === "drop") {
                parseDrop(c, buildSpot(c), states);
                return;
              }
              if (ctag === "text") {
                var text = c.text().trim();
                // Only one possible in the spot
                var kind = makeAnonymousTextItem(
                  null,
                  text,
                  anonymousItemProperties
                );
                parseDrop(c, buildSpot(c), states, kind, anonymousItemCount);
                return;
              }
              if (ctag === "color") {
                var text = c.text().trim();
                // Only one possible in the spot
                var kind = makeAnonymousColorItem(
                  null,
                  text,
                  anonymousItemProperties
                );
                parseDrop(c, buildSpot(c), states, kind, anonymousItemCount);
                return;
              }
              /*%%
						if (ctag === "colors") {
							var from = c.children("from").text().trim();
							var to = c.children("to").text().trim();
							var extrapolated = DomUtils.generateColors(from, to, size);
							Utils.loop(0, size, 1, function(l) {
								console.log("Extrapolated color: " + extrapolated[l] + " level " + l);
								var kind = makeAnonymousColorItem("track-" + name + "-" + l, extrapolated[l]);
								dropsFoundInLayout.push(function(pools, tracks, grids) {
									tracks[name].level(l).drop(kind);
								});
							});
							return;
						}
						*/
            });
          };

          var tag = item.prop("tagName");
          if (tag === "track") {
            var name = getName();
            var title =
              item.children("title").length === 0
                ? null
                : item.children("title").text().trim();
            var size = parseInt(item.children("size").text().trim());
            var vertical = item.attr("direction") === "vertical";
            var start =
              item.children("start").length === 0
                ? 0
                : parseInt(item.children("start").text().trim());
            var step =
              item.children("step").length === 0
                ? 1
                : parseInt(item.children("step").text().trim());
            var limit =
              item.children("limit").length === 0
                ? null
                : parseInt(item.children("limit").text().trim());
            var reversed = item.children("reversed").length > 0;
            game.gameManager.createTrack(
              applyToLayout,
              name,
              title,
              size,
              vertical,
              start,
              step,
              limit,
              reversed
            );

            parseElements(
              function (c) {
                var level = parseInt(c.attr("level"));
                return function (pools, tracks, grids) {
                  return tracks.get(name).level(level);
                };
              },
              {},
              item,
              1,
              { overlay: true, invisible: true }
            );

            return true;
          }
          if (tag === "pool") {
            var name = getName();
            var direction = item.attr("direction") || "horizontal";
            var stacking = item.attr("stacking");
            var properties = {};
            properties.layout = direction;
            if (stacking !== undefined) {
              properties.stacking = stacking;
            }
            game.gameManager.createPool(applyToLayout, name, properties);

            parseElements(
              function (c) {
                return function (pools, tracks, grids) {
                  return pools.get(name);
                };
              },
              {},
              item,
              null,
              { steady: true }
            );

            return true;
          }
          if (tag === "grid") {
            var type = parseInt(item.children("type").text().trim());
            var name = getName();
            var width =
              item.children("width").length === 0
                ? 0
                : parseInt(item.children("width").text().trim());
            var height =
              item.children("height").length === 0
                ? 0
                : parseInt(item.children("height").text().trim());
            var auto = item.children("auto").text().trim() === "true";
            game.gameManager.createGrid(
              applyToLayout,
              name,
              type,
              auto,
              width,
              height
            );

            parseElements(
              function (c) {
                var i = parseInt(c.attr("i"));
                var j = parseInt(c.attr("j"));
                return function (pools, tracks, grids) {
                  return grids.get(name).cell(i, j);
                };
              },
              {},
              item,
              null,
              { overlay: true, invisible: true }
            );

            return true;
          }
          return false;
        }
      );
    };

    var buildScript = function (script) {
      var rebuiltScript = '"use strict";\n';
      rebuiltScript += "return function(context, _) {\n";

      var methods = [
        "global",
        "loop",
        "each",
        "random",
        "pools",
        "tracks",
        "grids",
        "spot",
        "from",
        "here",
        "hover",
        "subject",
        "log",
        "nop",
        "play",
        "mark",
        "layout",
        "pool",
      ];

      Utils.each(methods, function (k) {
        rebuiltScript += "var " + k + " = context." + k + ";\n";
      });

      rebuiltScript += script + ";\n";
      rebuiltScript += "};\n";

      //console.log(rebuiltScript);

      return Function(rebuiltScript);
    };

    var addStateCss = function (cssComposition, kind, states) {
      Utils.each(states, function (stateValues, stateKey) {
        Utils.each([" > div > div > ", " > "], function (chain) {
          cssComposition.css(
            ".item-" +
              kind +
              chain +
              ".content.if-" +
              stateKey +
              " { display: none; }"
          );
          cssComposition.css(
            ".item-" +
              kind +
              chain +
              ".content.if-" +
              stateKey +
              "-_ { display: block ; }"
          );
          Utils.each(stateValues, function (v) {
            if (v === null) {
              return;
            }
            cssComposition.css(
              ".item-" +
                kind +
                ".state-" +
                stateKey +
                "-" +
                v +
                chain +
                ".content.if-" +
                stateKey +
                "-" +
                v +
                " { display: block; }"
            );
            cssComposition.css(
              ".item-" +
                kind +
                ".state-" +
                stateKey +
                "-" +
                v +
                chain +
                ".content.if-" +
                stateKey +
                "-_ { display: none; }"
            );
          });
        });
      });
    };

    var parseDeclarations = function () {
      var cssComposition = new CssComposition();
      var allKindStateFound = new Multimap.Map();
      // for each files in the directory items, parse it
      for (let it in contents.items){
        $($.parseXML(contents.items[it])).children().first().each(function (_, item) {
          item = $(item);
          let tag = item.prop("tagName");
          if (!tag) {
            return null;
          }
          // tag = tag.toLowerCase();
          if (tag === "palette") {
            item.children().each(function (_, i) {
              i = $(i);
              var colorId = i.prop("tagName");
              if (colorId === "color") {
                colorId = i.attr("name");
              }
              var colorValue = i.text().trim();
              // cssComposition.css("body { --" + colorId + ": " + colorValue + "; }");
              cssComposition.css(
                ".item._-" +
                colorId +
                " > svg { fill: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".item._-" +
                colorId +
                " > span { background: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".item._-" +
                colorId +
                " > div > div > svg { fill: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".item._-" +
                colorId +
                " > div > div > span { background: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".spot.state-_-" +
                colorId +
                " > .underlay > svg { stroke: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".spot.state-_-" +
                colorId +
                " > .underlay > svg { fill: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".spot.state-border-" +
                colorId +
                " > .underlay > svg { stroke: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".spot.state-background-" +
                colorId +
                " > .underlay > svg { fill: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".pool > div > .spot.state-border-" +
                colorId +
                " { border-color: " +
                colorValue +
                " !important; }"
              );
              cssComposition.css(
                ".pool > div > .spot.state-background-" +
                colorId +
                " { background: " +
                colorValue +
                " !important; }"
              );
            });
          } else if (tag === "item") {
            const kind = item.children("kind").text().trim();
            let content = null;
            item.children().each(function (_, i) {
              i = $(i);
              var t = i.prop("tagName");
              if (t === "content") {
                if (content === null) {
                  content = "";
                }
                content += ("" + i[0].innerHTML).trim();
              } else if (t === "state") {
                var stateKey = i.attr("key");
                var stateValue = i.attr("value");
                if (stateValue === undefined) {
                  stateValue = null;
                }
                var a = allKindStateFound.get(kind).get(stateKey);
                if (a === null) {
                  a = [];
                  allKindStateFound.get(kind).put(stateKey, a);
                }
                a.push(stateValue);

                i.children("content")
                  .children()
                  .each(function (_, j) {
                    j = $(j);

                    if (content === null) {
                      content = "";
                    }
                    j.addClass("if-" + stateKey);
                    if (stateValue === null) {
                      j.addClass("if-" + stateKey + "-_");
                    } else {
                      j.addClass("if-" + stateKey + "-" + stateValue);
                    }
                    content += ("" + j[0].outerHTML).trim();
                  });
                /*%%
							Utils.each(keyValues, function(jv, jk) {
								allStateKeyValueFound.get(jk).add(jv);
							});
							*/
              }
            });

            let properties = {};
            item.children("property").each(function (_, p) {
              p = $(p);
              var key;
              var k = p.children("key");
              if (k.length > 0) {
                key = k.text().trim();
              } else {
                key = "_";
              }
              var v = p.children("value");
              var value;
              if (v.length > 0) {
                value = v.text().trim();
              } else {
                value = null;
              }
              properties[key] = value;
            });

            var modifiers = {};
            item.children("modifier").each(function (_, p) {
              p = $(p);
              var key;
              var k = p.children("key");
              if (k.length > 0) {
                key = k.text().trim();
              } else {
                key = "_";
              }
              var v = p.children("value");
              var value;
              if (v.length > 0) {
                value = v.text().trim();
              } else {
                value = null;
              }
              modifiers[key] = value;
            });

            var triggers = [];
            var keyTriggers = [];
            var dropTriggers = [];
            var watchdogTriggers = [];
            var newsTriggers = [];
            item.children("trigger").each(function (_, p) {
              var t = $(p).text().trim();
              if (t.startsWith("key:")) {
                var key = t.substring("key:".length).trim();
                keyTriggers.push(key);
              } else if (t === "instant") {
                triggers.push({
                  instant: kind,
                });
              } else if (t === "passive") {
                triggers.push({
                  passive: kind,
                });
              } else if (t === "drop") {
                triggers.push({
                  dropin: kind,
                });
              } else if (t.startsWith("drop:")) {
                var dropKind = t.substring("drop:".length).trim();
                dropTriggers.push(dropKind);
              } else if (t.startsWith("news:")) {
                var newsKind = t.substring("news:".length).trim();
                newsTriggers.push(newsKind);
              } else if (t.startsWith("watchdog:")) {
                var dropKind = t.substring("watchdog:".length).trim();
                watchdogTriggers.push(dropKind);
              }
            });
            if (keyTriggers.length > 0) {
              triggers.push({
                keys: keyTriggers,
              });
            }
            if (dropTriggers.length > 0) {
              triggers.push({
                drops: dropTriggers,
              });
            }
            if (newsTriggers.length > 0) {
              triggers.push({
                news: newsTriggers,
              });
            }
            if (watchdogTriggers.length > 0) {
              triggers.push({
                watchdogs: watchdogTriggers,
              });
            }

            var script = null;
            item.children("script").each(function (_, s) {
              s = $(s).text().trim();
              if (script === null) {
                script = s + ";";
              } else {
                script += "\n" + s + ";";
              }
            });

            if (content === "") {
              properties.undefined = true;
            }
            game.generalReference.setContent(
              kind,
              content,
              properties,
              modifiers
            );
            if (script !== null) {
              var scriptToRun = buildScript(script);
              game.triggerManager.link(
                triggers,
                function (from, itemInstance, spot, extraContext) {
                  return runScript(scriptToRun)(
                    from,
                    itemInstance,
                    spot,
                    extraContext
                  );
                }
              );
            }
          }
        });
      }
      //console.debug(contents.declare);
      // $($.parseXML(contents.declare))
      //   .children()
      //   .first()
      //   .children()
      //   .each(function (_, item) {
      //     item = $(item);
      //
      //     let tag = item.prop("tagName");
      //     console.debug(item);
      //     if (!tag) {
      //       return null;
      //     }
      //     // tag = tag.toLowerCase();
      //     if (tag === "palette") {
      //       item.children().each(function (_, i) {
      //         i = $(i);
      //         var colorId = i.prop("tagName");
      //         if (colorId === "color") {
      //           colorId = i.attr("name");
      //         }
      //         var colorValue = i.text().trim();
      //         // cssComposition.css("body { --" + colorId + ": " + colorValue + "; }");
      //         cssComposition.css(
      //           ".item._-" +
      //             colorId +
      //             " > svg { fill: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".item._-" +
      //             colorId +
      //             " > span { background: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".item._-" +
      //             colorId +
      //             " > div > div > svg { fill: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".item._-" +
      //             colorId +
      //             " > div > div > span { background: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".spot.state-_-" +
      //             colorId +
      //             " > .underlay > svg { stroke: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".spot.state-_-" +
      //             colorId +
      //             " > .underlay > svg { fill: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".spot.state-border-" +
      //             colorId +
      //             " > .underlay > svg { stroke: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".spot.state-background-" +
      //             colorId +
      //             " > .underlay > svg { fill: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".pool > div > .spot.state-border-" +
      //             colorId +
      //             " { border-color: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //         cssComposition.css(
      //           ".pool > div > .spot.state-background-" +
      //             colorId +
      //             " { background: " +
      //             colorValue +
      //             " !important; }"
      //         );
      //       });
      //     } else if (tag === "item") {
      //       var kind = item.children("kind").text().trim();
      //       var content = null;
      //       item.children().each(function (_, i) {
      //         i = $(i);
      //         var t = i.prop("tagName");
      //         if (t === "content") {
      //           if (content === null) {
      //             content = "";
      //           }
      //           content += ("" + i[0].innerHTML).trim();
      //         } else if (t === "state") {
      //           var stateKey = i.attr("key");
      //           var stateValue = i.attr("value");
      //           if (stateValue === undefined) {
      //             stateValue = null;
      //           }
      //           var a = allKindStateFound.get(kind).get(stateKey);
      //           if (a === null) {
      //             a = [];
      //             allKindStateFound.get(kind).put(stateKey, a);
      //           }
      //           a.push(stateValue);
      //
			// 				var keyValues = {};
			// 				Utils.each(i[0].attributes, function(a) {
			// 					if (a.nodeName) {
			// 						if (a.nodeValue) {
			// 							keyValues[a.nodeName] = a.nodeValue;
			// 						} else {
			// 							keyValues[a.nodeName] = "_";
			// 						}
			// 					}
			// 				});
      //
      //           i.children("content")
      //             .children()
      //             .each(function (_, j) {
      //               j = $(j);
      //
			// 					Utils.each(keyValues, function(jv, jk) {
			// 						j.addClass("if-" + jk).addClass("if-" + jk + "-" + jv);
			// 					});
      //
      //               if (content === null) {
      //                 content = "";
      //               }
      //               j.addClass("if-" + stateKey);
      //               if (stateValue === null) {
      //                 j.addClass("if-" + stateKey + "-_");
      //               } else {
      //                 j.addClass("if-" + stateKey + "-" + stateValue);
      //               }
      //               content += ("" + j[0].outerHTML).trim();
      //             });
      //
			// 				Utils.each(keyValues, function(jv, jk) {
			// 					allStateKeyValueFound.get(jk).add(jv);
			// 				});
      //
      //         }
      //       });
      //
      //       var properties = {};
      //       item.children("property").each(function (_, p) {
      //         p = $(p);
      //         var key;
      //         var k = p.children("key");
      //         if (k.length > 0) {
      //           key = k.text().trim();
      //         } else {
      //           key = "_";
      //         }
      //         var v = p.children("value");
      //         var value;
      //         if (v.length > 0) {
      //           value = v.text().trim();
      //         } else {
      //           value = null;
      //         }
      //         properties[key] = value;
      //       });
      //
      //       var modifiers = {};
      //       item.children("modifier").each(function (_, p) {
      //         p = $(p);
      //         var key;
      //         var k = p.children("key");
      //         if (k.length > 0) {
      //           key = k.text().trim();
      //         } else {
      //           key = "_";
      //         }
      //         var v = p.children("value");
      //         var value;
      //         if (v.length > 0) {
      //           value = v.text().trim();
      //         } else {
      //           value = null;
      //         }
      //         modifiers[key] = value;
      //       });
      //
      //       var triggers = [];
      //       var keyTriggers = [];
      //       var dropTriggers = [];
      //       var watchdogTriggers = [];
      //       var newsTriggers = [];
      //       item.children("trigger").each(function (_, p) {
      //         var t = $(p).text().trim();
      //         if (t.startsWith("key:")) {
      //           var key = t.substring("key:".length).trim();
      //           keyTriggers.push(key);
      //         } else if (t === "instant") {
      //           triggers.push({
      //             instant: kind,
      //           });
      //         } else if (t === "passive") {
      //           triggers.push({
      //             passive: kind,
      //           });
      //         } else if (t === "drop") {
      //           triggers.push({
      //             dropin: kind,
      //           });
      //         } else if (t.startsWith("drop:")) {
      //           var dropKind = t.substring("drop:".length).trim();
      //           dropTriggers.push(dropKind);
      //         } else if (t.startsWith("news:")) {
      //           var newsKind = t.substring("news:".length).trim();
      //           newsTriggers.push(newsKind);
      //         } else if (t.startsWith("watchdog:")) {
      //           var dropKind = t.substring("watchdog:".length).trim();
      //           watchdogTriggers.push(dropKind);
      //         }
      //       });
      //       if (keyTriggers.length > 0) {
      //         triggers.push({
      //           keys: keyTriggers,
      //         });
      //       }
      //       if (dropTriggers.length > 0) {
      //         triggers.push({
      //           drops: dropTriggers,
      //         });
      //       }
      //       if (newsTriggers.length > 0) {
      //         triggers.push({
      //           news: newsTriggers,
      //         });
      //       }
      //       if (watchdogTriggers.length > 0) {
      //         triggers.push({
      //           watchdogs: watchdogTriggers,
      //         });
      //       }
      //
      //       var script = null;
      //       item.children("script").each(function (_, s) {
      //         s = $(s).text().trim();
      //         if (script === null) {
      //           script = s + ";";
      //         } else {
      //           script += "\n" + s + ";";
      //         }
      //       });
      //
      //       if (content === "") {
      //         properties.undefined = true;
      //       }
      //       game.generalReference.setContent(
      //         kind,
      //         content,
      //         properties,
      //         modifiers
      //       );
      //       if (script !== null) {
      //         var scriptToRun = buildScript(script);
      //         game.triggerManager.link(
      //           triggers,
      //           function (from, itemInstance, spot, extraContext) {
      //             return runScript(scriptToRun)(
      //               from,
      //               itemInstance,
      //               spot,
      //               extraContext
      //             );
      //           }
      //         );
      //       }
      //     }
      //   });
      allKindStateFound.each(function (values, kind) {
        addStateCss(cssComposition, kind, values);
      });
      /*%%
			allStateKeyValueFound.each(function(a, k) {
				cssComposition.css(".item .content.if-" + k + " { display: none; }");
				cssComposition.css(".item .content.if-" + k + "-_ { display: block ; }");
				Utils.each(a, function(v) {
					if (v !== "_") {
						cssComposition.css(".item.state-" + k + "-" + v + " .content.if-" + k + ".if-" + k + "-" + v + " { display: block; }");
						cssComposition.css(".item.state-" + k + "-" + v + " .content.if-" + k + ".if-" + k + "-_ { display: none; }");
					}
				});
			});
			*/
      cssComposition.finish();
    };

    var globalVar = {};

    runScript = function (script) {
      return function (from, itemInstance, spot, extraContext, extraDrops) {
        return function (
          stack,
          buildPool,
          buildTrack,
          buildGrid,
          buildSpot,
          buildItem
        ) {
          var context;

          var nopping = {
            nop: false,
          };

          var smartBuildSpot = function (spot) {
            if (spot.location === undefined) {
              return spot;
            }
            if (spot.location.startsWith("grid-")) {
              var g = spot.location.substring("grid-".length);
              var k = g.indexOf("-");
              var name = g.substring(0, k);
              var l = g.substring(k + 1);
              var grid = buildGrid(nopping, game.gameManager.grids[name]);
              var ij = grid._grid.parseSpotLocation(l);
              return grid.cell(ij.i, ij.j);
            }
            //TODO Do the same for tracks
            return spot;
          };

          context = {
            global: globalVar,

            loop: Utils.loop,
            each: Utils.each,
            random: function (max) {
              return Utils.random(max);
            },

            pools: {
              get: function (name) {
                return buildPool(nopping, game.gameManager.pools[name]).spot();
              },
              //TODO In the future, do the same for track and grid
              create: function (layoutName, name, properties, floating) {
                stack({
                  action: "pool",
                  layout: layoutName,
                  name: name,
                  properties: properties,
                  floating: floating,
                });
              },
              each: function (callback) {
                return Utils.each(game.gameManager.pools, function (p) {
                  callback(buildPool(nopping, p).spot(), name);
                });
              },
            },
            tracks: {
              get: function (name) {
                return buildTrack(nopping, game.gameManager.tracks[name]);
              },
              each: function (callback) {
                return Utils.each(game.gameManager.tracks, function (t) {
                  callback(buildTrack(nopping, t), name);
                });
              },
            },
            grids: {
              get: function (name) {
                return buildGrid(nopping, game.gameManager.grids[name]);
              },
              each: function (callback) {
                return Utils.each(game.gameManager.grids, function (g) {
                  callback(buildGrid(nopping, g), name);
                });
              },
            },
            spot: function (location) {
              return smartBuildSpot(
                buildSpot(nopping, game.spotManager.getSpot(location))
              );
            },

            from: smartBuildSpot(buildSpot(nopping, from)),
            here: smartBuildSpot(buildSpot(nopping, spot)),
            hover: buildItem(nopping, itemInstance), // TODO DEPRECATE
            subject: buildItem(nopping, itemInstance),

            log: function (message, toAll) {
              if (toAll) {
                stack({
                  action: "log",
                  message: message,
                });
              } else {
                game.logManager.log(message);
              }
            },

            nop: function (f) {
              nopping.nop = true;
              f();
              nopping.nop = false;
            },

            play: function (soundId) {
              stack({
                action: "play",
                sound: soundId,
              });
            },

            mark: function () {
              stack({
                action: "mark",
                mark: Server.uuid(),
              });
            },
          };

          if (extraDrops === null) {
            debugger;
          }
          if (extraContext === undefined) {
            debugger;
          }

          if (extraDrops !== undefined) {
            Utils.each(extraDrops, function (d) {
              d(context.pools, context.tracks, context.grids);
            });
          }
          return script()(context, extraContext);
        };
      };
    };

    var runPrepareScript = function (end) {
      var cssComposition = new CssComposition();
      var delayed = null;

      var nopping = {
        nop: true,
      };

      var initialContext = {
        global: globalVar,

        loop: Utils.loop,
        each: Utils.each,

        item: function (kind, content, properties, modifiers, states) {
          if (states === undefined) {
            game.generalReference.setContent(
              kind,
              content,
              properties,
              modifiers
            );
          } else {
            var rebuiltContent = "";
            var cc = $(content);
            Utils.each(states, function (_, stateKey) {
              cc.addClass("if-" + stateKey);
              cc.addClass("if-" + stateKey + "-_");
            });
            rebuiltContent += ("" + cc[0].outerHTML).trim();

            var stateKeyValues = {};
            Utils.each(states, function (stateValues, stateKey) {
              var stateValuesAsArray = [];
              Utils.each(stateValues, function (stateContent, stateValue) {
                var c = $(stateContent);
                c.addClass("if-" + stateKey);
                c.addClass("if-" + stateKey + "-" + stateValue);
                rebuiltContent += ("" + c[0].outerHTML).trim();
                stateValuesAsArray.push(stateValue);
              });
              stateKeyValues[stateKey] = stateValuesAsArray;
            });
            addStateCss(cssComposition, kind, stateKeyValues);

            game.generalReference.setContent(
              kind,
              rebuiltContent,
              properties,
              modifiers
            );
          }
        },

        text: function (kind, text, properties, modifiers) {
          game.generalReference.setContent(
            kind,
            $("<span>").addClass("generatedText").text(text),
            properties,
            modifiers
          );
        },
        color: function (kind, color, properties, modifiers) {
          game.generalReference.setContent(
            kind,
            $("<div>").addClass("generatedColor").css({ background: color }),
            properties,
            modifiers
          );
        },

        link: function (triggers, script) {
          var scriptToRun = buildScript(script);

          game.triggerManager.link(
            triggers,
            function (from, itemInstance, spot, extraContext) {
              runScript(scriptToRun)(from, itemInstance, spot, extraContext);
            }
          );
        },

        css: function (cssText) {
          cssComposition.css(cssText);
        },

        layout: function (layoutName) {
          return game.gameManager.layouts[layoutName];
        },

        pools: {
          get: function (name) {
            return buildPool(nopping, game.gameManager.pools[name]).spot();
          },
          create: game.gameManager.createPool,
          each: function (callback) {
            return Utils.each(game.gameManager.pools, callback);
          },
        },
        tracks: {
          get: function (name) {
            return buildTrack(nopping, game.gameManager.tracks[name]);
          },
          create: game.gameManager.createTrack,
          each: function (callback) {
            return Utils.each(game.gameManager.tracks, callback);
          },
        },
        grids: {
          get: function (name) {
            return buildGrid(nopping, game.gameManager.grids[name]);
          },
          create: game.gameManager.createGrid,
          each: function (callback) {
            return Utils.each(game.gameManager.grids, callback);
          },
        },

        delay: function (f) {
          delayed = f;
        },

        res: contents.res,

      };

      (function (context) {
        var rebuiltScript = "\n" + "\n";
        rebuiltScript += " return function(context) { " + "\n";

        Utils.each(context, function (_, k) {
          rebuiltScript += "var " + k + " = context." + k + ";" + "\n";
        });

        rebuiltScript +=
          (contents.prepare === undefined ? ";" : contents.prepare) + "\n";
        /*
				var inRaw = false;
				Utils.each(scriptToExecute.split('\n'), function(line) {
					if (line.trim().startsWith("/*::raw/")) {
						inRaw = !inRaw;
						return;
					}
					if (inRaw) {
						rebuiltScript += "+ " + JSON.stringify(line) + '\n';
					} else {
						rebuiltScript += line + '\n';
					}
				});
				rebuiltScript += ";" + '\n';
				*/
        rebuiltScript += "};"  +"\n";

        //console.log(rebuiltScript);

        return Function(rebuiltScript)()(context);
      })(initialContext);

      if (delayed === null) {
        cssComposition.finish();
        end();
      } else {
        delayed(function () {
          cssComposition.finish();
          end();
        });
      }
    };

    var gameCssComposition = new CssComposition();
    gameCssComposition.css(contents.css);
    gameCssComposition.finish();

    console.log("Building layout");
    parseLayout();
    console.log("Building declarations");
    parseDeclarations();
    console.log("Running preparation script");
    runPrepareScript(function () {
      var init = runScript(
        buildScript(contents.reset === undefined ? ";" : contents.reset)
      );
      game.chatManager.launch();
      game.eventManager.launch(function () {
        console.log("Running reset script");
        var initScript = init(null, null, null, null, dropsFoundInLayout);
        ExecutionContext.runScripts(game, [initScript]);
      });
    });
  }
}

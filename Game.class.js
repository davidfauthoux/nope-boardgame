import { Layout } from "../Layout.class.js";
import { Utils } from "../Utils.class.js";
import { DomUtils } from "../DomUtils.class.js";
import { Heap } from "../Async.class.js";
import { Server } from "../Server.class.js";
import { EventManager } from "./EventManager.class.js";
import { GeneralReference } from "./GeneralReference.class.js";
import { TriggerManager } from "./TriggerManager.class.js";
import { ScriptExecution } from "./ScriptExecution.class.js";
import { ChatManager } from "./ChatManager.class.js";
import { SpotManager } from "./SpotManager.class.js";
import { GameManager } from "./GameManager.class.js";
import { UserInteraction } from "../UserInteraction.class.js";
import { Administration } from "./Administration.class.js";
import { FriendFaces } from "./FriendFaces.class.js";
import { NewsManager } from "./NewsManager.class.js";
import { DragAndDropManager } from "./DragAndDropManager.class.js";
import { VideoIcon } from "./VideoIcon.class.js";
import { Sound } from "./Sound.class.js";
import { ItemManager } from "./ItemManager.class.js";
import { Store } from "../Store.class.js";
import { LogManager } from "./LogManager.class.js";


class Game {
  constructor() {
    UserInteraction.get().register(function () {
      // After a user interaction, all of this can be unmuted
      VideoIcon.unmute();
      Sound.unmute();
    });

    var game = {};
    this.game = game;

    game.store = new Store();

    var rootLayout = new Layout();
    rootLayout.fit(false);

    game.overlay = rootLayout.overlay();
    game.overlay.$.addClass("gameOverlay");

    var required = "Chrome/80.0.3900 Firefox/75";
    if (!DomUtils.browser(required)) {
      var warningOverlay = rootLayout.overlay().layout().north();
      warningOverlay.$.addClass("warning");
      warningOverlay
        .horizontal()
        .add()
        .$.addClass("warningText")
        .html(
          "<div>Browser not compatible</div>" +
            /*"<div>" + navigator.userAgent + "</div>" + */ "<div>Please update to " +
            required +
            "</div>"
        );
      UserInteraction.get().click(
        warningOverlay.horizontal().add().$.addClass("warningClose"),
        function () {
          warningOverlay.$.parent().remove();
        }
      );
    }

    var loadingOverlay = rootLayout.overlay();
    loadingOverlay.$.addClass("isLoading");
    loadingOverlay
      .layout()
      .north()
      .layout()
      .west()
      .$.text("Loading...")
      .addClass("loading");
    game.loading = function (flag) {
      if (flag) {
        loadingOverlay.$.show();
      } else {
        loadingOverlay.$.hide();
      }
    };
    game.loading(true);

    game.logManager = new LogManager(rootLayout);

    //TODO Change this code with Async
    var _download = function (
      server,
      prefix,
      files,
      i,
      defaults,
      contents,
      callback
    ) {
      if (i === files.length) {
        callback(contents);
        return;
      }
      var file = files[i];
      console.log("DOWNLOADING " + file + " FROM " + server.base);
      if (
        file.endsWith(".xml") ||
        file.endsWith(".css") ||
        file.endsWith(".js") ||
        file.endsWith(".json")
      ) {
        console.log("Downloading " + file);
        var contentHeap = new Heap();
        server
          .download(
            new Heap((prefix === null ? "" : prefix) + file),
            contentHeap
          )
          .err(function (e) {
            console.log("Error downloading " + file + ": " + e);
            if (defaults === null) {
              contents[file] = null;
            } else {
              contents[file] = defaults[i];
            }
            _download(
              server,
              prefix,
              files,
              i + 1,
              defaults,
              contents,
              callback
            );
          })
          .res(function () {
            var content = contentHeap.get();
            console.log("Downloaded " + file);
            contents[file] = content;
            _download(
              server,
              prefix,
              files,
              i + 1,
              defaults,
              contents,
              callback
            );
          })
          .run();
      } else if (file.endsWith(".png") || file.endsWith(".mp3")) {
        contents[file] = null;
        _download(server, prefix, files, i + 1, defaults, contents, callback);
      } else {
        _download(server, prefix, files, i + 1, defaults, contents, callback);
      }
    };
    var listAndDownload = function (server, resourceDir, contents, callback) {
      var listHeap = new Heap();
      server
        .list(new Heap(resourceDir), listHeap)
        .err(function (e) {
          console.log("Error listing resource files: " + e);
          contents[resourceDir] = {};
          callback(contents);
        })
        .res(function () {
          var list = listHeap.get();
          if (list === null) {
            contents[resourceDir] = {};
            callback(contents);
            return;
          }
          _download(
            server,
            resourceDir + "/",
            list,
            0,
            null,
            {},
            function (listContents) {
              contents[resourceDir] = listContents;
              callback(contents);
            }
          );
        })
        .run();
    };
    var download = function (files, defaults, callback) {
      var server = new Server("/" + Server.location().id);
      _download(server, null, files, 0, defaults, {}, function (contents) {
        listAndDownload(server, "../../res", contents, function (contents) {
          listAndDownload(server, "../res", contents, callback);
        });
      });
    };

    this._launch = function () {
      download(
        [
          "../game.declare.xml",
          "../game.layout.xml",
          "../game.css",
          "../game.prepare.js",
          "../game.reset.js",
        ], //TODO Better to have an array of objects { path, default }
        ["<declare></declare>", "<layout></layout>", "", ";", ";"],
        function (contents) {
          console.log("ASSETS DOWNLOADED");

          game.loading(false);

          game.administration = new Administration(
            rootLayout,
            rootLayout.layout().north(),
            game
          );

          game.generalReference = new GeneralReference();
          game.thisLiveId = Server.uuid();

          game.spotManager = new SpotManager(game);
          game.itemManager = new ItemManager(game);
          game.gameManager = new GameManager(game);

          game.friendFaces = new FriendFaces(game);
          game.dragAndDropManager = new DragAndDropManager(game);

          game.eventManager = new EventManager(rootLayout.overlay(), game);
          game.newsManager = new NewsManager(rootLayout.layout().east(), game);
          game.chatManager = new ChatManager(game);
          game.triggerManager = new TriggerManager(game);

          var res = {};
          Utils.each(contents, function (v, k) {
            if (k.endsWith(".xml")) {
              res["../" + k] = v; // { contents: v };
            }
          });
          var addRes = function (base) {
            Utils.each(contents[base], function (v, k) {
              if (v === null) {
                if (k.endsWith(".mp3")) {
                  var soundId = k.substring(0, k.length - ".mp3".length);
                  game.generalReference.setSound(soundId, base + "/" + k);
                  /*%%
									if (soundId.startsWith("../res/")) {
										game.generalReference.setSound(soundId.substring("../res/".length), "../" + rootDir + "/res/" + k);
									} else {
										game.generalReference.setSound(soundId, "res/" + k);
									}*/
                } else if (k.endsWith(".png")) {
                  res[k] = null; // { path: base + '/' + k };
                } else {
                  // Ignored
                }
              } else {
                res[k] = v; // { contents: v };
              }
            });
          };
          addRes("../../res");
          addRes("../res");

          new ScriptExecution(rootLayout.layout().inside(), game, {
            declare: contents["../game.declare.xml"],
            layout: contents["../game.layout.xml"],
            css: contents["../game.css"],
            prepare: contents["../game.prepare.js"],
            reset: contents["../game.reset.js"],
            res: res,
          });
        }
      );
    };
  }

  launch() {
    this._launch();
  }
}

$(function () {
  var game = new Game();
  game.launch();
});

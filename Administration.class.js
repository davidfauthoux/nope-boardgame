import { UserInteraction } from "../UserInteraction.class.js";


export class Administration {
  constructor(rootLayout, layout, game) {
    this._adminLayout = layout.layout().east().horizontal();
    layout.$.addClass("administration");

    /*%%
                button("_debug_force_fit", function() {
                    Layout.fit();
                });
                button("_debug_relink", function() {
                    game.chatManager.requestRecreateVideoLinks();
                });
                */

    var layoutStoreKey = Administration.storeKey("layout");
    UserInteraction.get().click(
      this._adminLayout.add().$.addClass("iconButton").addClass("fitButton"),
      function () {
        if (game.store.get(layoutStoreKey) === null) {
          game.store.set(layoutStoreKey, "fit");
          rootLayout.fit(true);
        } else {
          game.store.set(layoutStoreKey, null);
          rootLayout.fit(false);
        }
      }
    );
    rootLayout.fit(game.store.get(layoutStoreKey) === "fit");

    UserInteraction.get().click(
      this._adminLayout.add().$.addClass("iconButton").addClass("newButton"),
      function () {
        window.location =
          Administration.rootUrl() +
          "/" +
          Administration.platformId() +
          "@" +
          Administration.gameId() +
          "@" +
          Server.uuid();
      }
    );
    UserInteraction.get().click(
      this._adminLayout.add().$.addClass("iconButton").addClass("logButton"),
      function () {
           game.newsManager.activate(!game.newsManager.isActive());
      }
    );

    this.layout = layout.layout().west().horizontal();
  }

  button(className, callback) {
    UserInteraction.get().click(
      this.layout
        .add()
        .$.addClass("iconButton")
        .addClass(className + "Button"),
      callback
    );
  }
}

Administration.storeKey = function (key) {
  return (
    Administration.platformId() + "@" + Administration.gameId() + "/" + key
  );
};

Administration._splitUrl = function () {
  var a = window.location.href;
  a = a.substring(0, a.lastIndexOf("/"));
  var i = a.lastIndexOf("/");
  var s = a.substring(i + 1).split(/@/g);
  a = a.substring(0, i);
  return {
    rootUrl: a,
    platformId: s[0],
    gameId: s[1],
  };
};
Administration.rootUrl = function () {
  return Administration._splitUrl().rootUrl;
};
Administration.platformId = function () {
  return Administration._splitUrl().platformId;
};
Administration.gameId = function () {
  return Administration._splitUrl().gameId;
};

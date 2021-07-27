// http://localhost:8086/boardgame/apps/portal/portal-web.html

import * as async from "../../../modules/async.js";
import { Server, history, uuid } from "../../../modules/server.js";
// jquery

let superuserUserId = "boardgame/apps/data/users/register";

// get queries in url in a map
let windowParams = (function() {
  let u = window.location.search;
  // Get part of the URL after « ? », including this symbol
  let i = u.indexOf("?");
  if (i < 0) {
    return {};
  }
  u = u.substring(i + 1);
  let p = {};
  for (let kv of u.split(/&/g)) {
    let s = kv.trim().split(/=/g);
    let key;
    let value;
    if (s.length === 1) {
      key = s;
      value = "";
    } else {
      key = decodeURIComponent(s[0]);
      value = decodeURIComponent(s[1]);
    }
    p[key] = value;
    // let values = p[key];
    // if (values === undefined) {
    // 	values = [];
    // 	p[key] = values;
    // }
    // values.push(value);
  }
  return p;
})();

// create server with /users/boardgame/register as base
let server = new Server("/" + superuserUserId);

let stack = function(toStack) {
  console.log("STACKING", toStack);
  async.run([
    server.stack(toStack)
  ]);
};

let goToRandomTable = function(game) {
  const nameTable = uuid();
  window.location = window.location.protocol + "//" + window.location.host + "/boardgame/games/" + game + "/" + nameTable + "/";
};

function createGameCard(oldEvent) {
  let card = document.createElement("div");
  card.classList.add("card");
  card.id = oldEvent.id;
  let content = document.createElement("div");
  content.classList.add("content");
  let verified = document.createElement("h2");
  let name = document.createElement("h3");
  name.innerHTML = oldEvent.game;
  let description = document.createElement("p");
  let game = document.createElement("a");
  game.innerHTML = "Let's go";
  content.appendChild(verified);
  content.appendChild(name);
  content.appendChild(description);
  content.appendChild(game);
  card.appendChild(content);

  game.onclick = function() {
    goToRandomTable(name.innerHTML);
  };
  document.body.appendChild(card);
}

async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.debug("Event : ", event);

      if (event.old !== undefined) {
        for (let oldEvent of event.old) { // when page is invoked
          // inside this, older events are reinvoked
          if (oldEvent.action === "deposit") {
            createGameCard(oldEvent);
          } else if (oldEvent.action === "delete") { // each game cloned deleted
            // delete corresponding card with his id
            document.getElementById(oldEvent.id).remove();
          } else if (oldEvent.action === "verify") {
            let gameVerified = document.getElementById(oldEvent.id);
            let verifiedLabel = gameVerified.getElementsByTagName("h2")[0];
            if (oldEvent.state === "true") {
              verifiedLabel.innerHTML = "Verified";
              document.getElementById("verifiedGames").appendChild(gameVerified);
            } else if (oldEvent.state === "false") {
              verifiedLabel.innerHTML = "";
              document.getElementById("games").appendChild(gameVerified);
            }
          }
        }
      } else { // live
        if (event.action === "deposit") { // each game cloned
          createGameCard(event);
        } else if (event.action === "delete") { // each game cloned deleted
          // delete corresponding card with his id
          document.getElementById(event.id).remove();
        }else if (event.action === "verify") {
          let gameVerified = document.getElementById(event.id);
          let verifiedLabel = gameVerified.getElementsByTagName("h2")[0];
          if (event.state === "true") {
            verifiedLabel.innerHTML = "Verified";
            document.getElementById("verifiedGames").appendChild(gameVerified);
          } else if (event.state === "false") {
            verifiedLabel.innerHTML = "";
            document.getElementById("games").appendChild(gameVerified);
          }
        }
      }
    }
  ])
]);


// http://localhost:8086/boardgame/apps/portal/portal-web.html

import * as async from "../../../modules/async.js";
import { Server, history, uuid } from "../../../modules/server.js";
// jquery

let superuserUserId = "users/boardgame/apps/superuser";

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

// create server
let server = new Server("/" + superuserUserId);

/**
 * Create url for a new table and switch to the waiting page
 * @param nameGame
 */
let goToRandomTable = function(idGame) {
  const nameTable = uuid();
  window.location = window.location.protocol + "//" + window.location.host + "/boardgame/apps/portal/waiting-page.html?game="+idGame+"&table="+nameTable;
};

/**
 * Create and add game card for a game
 * @param idGame
 * @param nameGame
 */
function createGameCard(idGame,nameGame) {
  let card = document.createElement("div");
  card.classList.add("card");
  card.id = idGame;
  let content = document.createElement("div");
  content.classList.add("content");
  let verified = document.createElement("h2");
  let name = document.createElement("h3");
  name.classList.add("name");
  name.innerHTML = nameGame;
  let description = document.createElement("p");
  let game = document.createElement("a");
  game.innerHTML = "Let's go";
  content.appendChild(verified);
  content.appendChild(name);
  content.appendChild(description);
  content.appendChild(game);
  card.appendChild(content);

  game.onclick = function() {
    goToRandomTable(card.id);
  };
  document.getElementById("games").appendChild(card);
}

/**
 * Delete game card corresponding to the id of the game
 * @param idGame
 */
function deleteGameCard(idGame) {
  document.getElementById(idGame).remove();
}

/**
 * Make a card verified or not according to the param isVerified
 * @param idGame
 * @param isVerified boolean
 */
function verifyGameCard(idGame,isVerified){
  let gameVerified = document.getElementById(idGame);
  let verifiedLabel = gameVerified.getElementsByTagName("h2")[0];
  if (isVerified) {
    verifiedLabel.innerHTML = "Verified";
    document.getElementById("verifiedGames").appendChild(gameVerified);
  } else {
    verifiedLabel.innerHTML = "";
    document.getElementById("games").appendChild(gameVerified);
  }
}

/**
 * Change the name of the game on his card
 * @param idGame
 * @param nameGame
 */
function renameGameCard(idGame,nameGame) {
  document.getElementById(idGame).getElementsByClassName("name")[0].innerHTML = nameGame;
}

/**
 * Execute the event according to his action (design pattern builder simplified)
 * @param event
 */
function executeEvent(event) {
  switch (event.action) {
    case "deposit":
      createGameCard(event.id,event.game);
      break;
    case "delete":
      deleteGameCard(event.id);
      break;
    case "verify":
      verifyGameCard(event.id,event.state);
      break;
    case "rename":
      renameGameCard(event.id,event.name);
      break;
    default:
      break;
  }
}

/**
 * When page is loaded, it listens each event on the server
 */
async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.debug("Event : ", event);
      if (event.old !== undefined) {
        for (let oldEvent of event.old) { // older events (before the page was loaded)
          executeEvent(oldEvent.data);
        }
      } else { // live event (after the page is loaded)
        executeEvent(event.data);
      }
    }
  ])
]);


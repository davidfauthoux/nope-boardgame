import * as async from "../../../modules/async.js";
import { Server, history, uuid } from "../../../modules/server.js";

let superuserUserId = "boardgame/apps/data/users/register";

// create server
let server = new Server("/" + superuserUserId);



/**
 /**
 * Return date from a timestamp in "mm/dd/yyyy" format
 * @param timestamp
 * @returns {string}
 */
function getDateFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = date.getFullYear();

  return mm + "/" + dd + "/" + yyyy;
}

/**
 * Stack event on the server
 * @param toStack
 */
function stack(toStack) {
  console.log("STACKING", toStack);
  async.run([
    server.stack(toStack)
  ]);
}

/**
 * Stack modify event on the server
 * @param idGame
 * @param newName
 */
function stackModifyEvent(idGame, newName) {
  stack({
    action: "rename",
    id: idGame,
    name: newName
  });
}

/**
 * Stack delete event on the server
 * @param idGame
 */
function stackDeleteEvent(idGame) {
  stack({
    action: "delete",
    id: idGame
  });
}

/**
 * Stack verify event on the server
 * @param idGame
 * @param isVerified
 */
function stackVerifyEvent(idGame,isVerified) {
  stack({
    action: "verify",
    state: isVerified,
    id: idGame
  });
}

/**
 * Create and add line for a game in the table
 * @param idGame
 * @param timestampDepositGame
 * @param nameGame
 * @param urlGame
 */
function createLineGame(idGame,timestampDepositGame,nameGame,urlGame) {
  let line = document.createElement("tr");
  line.id = idGame;
  let date = document.createElement("td");
  date.innerHTML = getDateFromTimestamp(timestampDepositGame);
  let game = document.createElement("td");
  let name = document.createElement("span");
  name.classList.add("name");
  name.innerHTML = nameGame;
  let modify = document.createElement("button");
  modify.classList.add("buttonModify");
  modify.innerHTML = "Modify";
  modify.onclick = function() {
    let newName = prompt("Modify the name of the game ?", name.innerHTML);
    if (newName != null) {
      stackModifyEvent(idGame, newName);
    }
  };
  game.appendChild(name);
  game.appendChild(modify);
  let url = document.createElement("td");
  url.innerHTML = urlGame;
  let del = document.createElement("td");
  let cross = document.createElement("button");
  cross.innerHTML = "X";
  cross.onclick = function() {
    if (confirm("Are you sure to delete this game ?")) {
      stackDeleteEvent(idGame);
    }
  };
  del.appendChild(cross);

  let verified = document.createElement("td");
  let check = document.createElement("input");
  check.setAttribute("type", "checkbox");
  check.onclick = function() {
      stackVerifyEvent(idGame,check.checked);
  };

  verified.appendChild(check);

  line.appendChild(date);
  line.appendChild(game);
  line.appendChild(url);
  line.appendChild(del);
  line.appendChild(verified);
  document.getElementById("adminTable").getElementsByTagName("tbody")[0].appendChild(line);
}

/**
 * Delete line in the table corresponding to the id of the game
 * @param idGame
 */
function deleteLineGame(idGame) {
  document.getElementById(idGame).remove();
}

/**
 * Execute the event according to his action (design pattern builder simplified)
 * @param event
 */
function executeEvent(event) {
  switch (event.action) {
    case "deposit" :
      createLineGame(event.id,event.timestamp,event.game,event.url);
      break;
    case "delete" :
      deleteLineGame(event.id);
      break;
    case "rename":
      //rename game on the table
      document.getElementById(event.id).getElementsByClassName("name")[0].innerHTML = event.name;
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
          executeEvent(oldEvent);
        }
      } else { // live event (after the page is loaded)
        executeEvent(event);
      }
    }
  ])
]);


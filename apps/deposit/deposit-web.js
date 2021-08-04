// http://localhost:8086/boardgame/apps/deposit/deposit-web.html

import * as async from "../../../modules/async.js";
import { Server, uuid } from "../../../modules/server.js";


const inputUrlGit = document.getElementById("inputUrlGit");
const inputNameGame = document.getElementById("inputNameGame");
const regexSpecialCharacter = /[*|":<>\[\]{}`\\()';@&$]/gi;
const regexGitLink = /https:\/\/github.com\/[^;]+.git$/gi;
const superuserUserId = "users/boardgame/apps/superuser";

// create server
let server = new Server("/" + superuserUserId);


/**
 * Stack event on the server
 * @param toStack
 */

function stack(toStack) {
  console.log("STACKING", toStack);
  async.run([
    server.stack({
      //from: userId,
      data: toStack
    })
  ]);
};


/**
 * Stack deposit event on the server
 * @param today
 */
function stackDepositEvent() {
  stack({
    action: "deposit",
    id: uuid(),
    url: inputUrlGit.value,
    game: inputNameGame.value,
    timestamp: Date.now() // milliseconds since January 1st 1970
  });
}


/**
 * Does the string is empty
 * @param string
 * @returns {boolean}
 */
function isNotEmptyString(string) {
  return string !== "";
}

/**
 * Does the string contain special character
 * @param string
 * @returns {boolean}
 */
function containsSpecialCharacter(string) {
  return string.match(regexSpecialCharacter);
}

/**
 * Does the url is a git clone url (http)
 * @param url
 * @returns {boolean}
 */
function isGitLink(url) {
  return url.match(regexGitLink);
}


/**
 * Verify url and name value to avoid code injection
 * from a client in input
 * Stack a deposit event to clone the game
 */
function cloneGame() {
  if (!isNotEmptyString(inputUrlGit.value)) {
    alert("Git adress undefined");
    return;
  }
  if (!(isGitLink(inputUrlGit.value))) {
    alert("Git adress wrong format");
    return;
  }
  if (!isNotEmptyString(inputNameGame.value)) {
    alert("Name of the game undefined");
    return;
  }
  if (containsSpecialCharacter(inputNameGame.value)) {
    alert("Name of the game doesn't contain special character");
    return;
  }


  stackDepositEvent();
}

document.getElementById("submitUrlGit").addEventListener("click", () => {
    cloneGame();
  }
);

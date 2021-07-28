// http://localhost:8086/boardgame/apps/deposit/deposit-web.html

import * as async from "../../../modules/async.js";
import { Server, uuid } from "../../../modules/server.js";


const superuserUserId = "boardgame/apps/data/users/register";

// create server
let server = new Server("/" + superuserUserId);

const inputUrlGit = document.getElementById("inputUrlGit");
const inputNameGame = document.getElementById("inputNameGame");
const regexSpecialCharacter = /[*|":<>\[\]{}`\\()';@&$]/gi;
const regexGitLink = /https:\/\/github.com\/[^;]+.git/gi;

/**
 * Stack event on the server
 * @param toStack
 */
let stack = function(toStack) {
  console.log("STACKING", toStack);
  async.run([
    server.stack(toStack)
  ]);
};

/**
 * Stack deposit event on the server
 * @param today
 */
function stackDepositEvent(today) {
  stack({
    action: "deposit",
    id: uuid(),
    url: inputUrlGit.value,
    game: inputNameGame.value,
    date: today
  });
}

/**
 * Return today's date in "dd/mm/yyyy" format
 * @returns {string}
 */
function getTodayDate() {
  let today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = today.getFullYear();

  return mm + "/" + dd + "/" + yyyy;
}

/**
 * Verify url and name value to avoid code injection
 * Stack a deposit event to clone the game
 */
function cloneGame() {
  if (inputUrlGit.value === "") {
    alert("Git adress undefined");
    return;
  }
  if (!regexGitLink.test(inputUrlGit.value)) {
    alert("Git adress wrong format");
    return;
  }
  if (inputNameGame.value === "") {
    alert("Name of the game undefined");
    return;
  }
  if (regexSpecialCharacter.test(inputNameGame.value)) {
    alert("Name of the game doesn't contain special character");
    return;
  }
  let today = getTodayDate();
  stackDepositEvent(today);
}

document.getElementById("submitUrlGit").addEventListener("click", () => {
    cloneGame();
  }
);
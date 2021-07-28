// http://localhost:8086/boardgame/register-web.html

import * as async from "../../../modules/async.js";
import { Server, history, uuid } from "../../../modules/server.js";
// jquery

const superuserUserId = "boardgame/apps/data/users/register";
const pathToPortalIndex = "boardgame/apps/portal/portal-web.html";

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

let stack = function(toStack) {
  console.log("STACKING", toStack);
  async.run([
    server.stack(toStack)
  ]);
};

/*async.run([
    () => async.while_(() => true).do_([
        history(server),
        (event) => {
            console.log("EVENT RECEIVED", event);

            if (event.old !== undefined) {
                for (let oldEvent of event.old) {
                }
            }
        },
    ]),
]);*/

const inputUrlGit = document.getElementById("inputUrlGit");
const inputNameGame = document.getElementById("inputNameGame");
const regexSpecialCharacter = /[*|":<>\[\]{}`\\()';@&$]/gi;
const regexGitLink = /https:\/\/github.com\/[^;]+.git/gi;

document.getElementById("submitUrlGit").addEventListener("click", () => {
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
    let today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    const yyyy = today.getFullYear();

    today = mm + "/" + dd + "/" + yyyy;
    stack({
      action: "deposit",
      id: uuid(),
      url: inputUrlGit.value,
      game: inputNameGame.value,
      date: today
    });
    //window.location = window.location.protocol + "//" + window.location.host + "/" + pathToPortalIndex;
  }
);
/*
function cloneGame(){
  stack({
    action: "deposit",
    url: inputUrlGit.value,
    game: inputNameGame.value
  });
  window.location = window.location.protocol + "//" + window.location.host + "/" + pathToPortalIndex;

}

document.getElementById("formAddGame").onsubmit = function() {cloneGame()};*/
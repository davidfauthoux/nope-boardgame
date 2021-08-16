//node -r esm deposit-node.js --base=http://localhost:8086

//npm install esm
//node -r esm <file>.js

import * as async from "../../../modules/async.js";
import { Server, history } from "../../../modules/server.js";

const shell = require("shelljs");
const pathToClone = "../../games/";

let args = {};
for (let a of process.argv) {
  if (a.startsWith("--")) {
    a = a.substring("--".length);
    let i = a.indexOf("=");
    let k = a.substring(0, i);
    let v = a.substring(i + 1);
    args[k] = v;
  }
}
Server.BASE = args.base; // "http://localhost:8086";

console.log("Server.BASE", Server.BASE);


const regexSpecialCharacter = /[*|":<>\[\]{}`\\()';@&$]/i;
const regexGitLink = /https:\/\/github.com\/[^;]+.git/i;

/**
 * Does the url is a git clone url (http)
 * @param url
 * @returns {boolean}
 */
function isGitLink(url) {
  return regexGitLink.test(url);
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
  return regexSpecialCharacter.test(string);
}

let superuserUserId = "users/boardgame/superuser";
let server = new Server("/" + superuserUserId);
shell.cd(pathToClone);
async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.log("EVENT RECEIVED", event);
      if (event.old !== undefined) {

      } else {
        // game has to be cloned, values verified when event was created
        if (event.data.action === "deposit") {
          if ((isGitLink(event.data.url)) && (isNotEmptyString(event.data.url)) && !(containsSpecialCharacter(event.data.game)) && (isNotEmptyString(event.data.game))) {
            shell.exec("git clone " + event.data.url + " " + event.data.id);
          }
        }
      }

    }
  ])
]);


//node -r esm deposit-node.js --base=http://localhost:8086

//npm install esm
//node -r esm <file>.js

import * as async from "../../../modules/async.js";
import { Server, history } from "../../../modules/server.js";
import { EncryptionServer } from "../../../modules/encryption";

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

let encryptionServer = new EncryptionServer();

const regexSpecialCharacter = /[*|":<>\[\]{}`\\()';@&$]/gi;
const regexGitLink = /https:\/\/github.com\/[^;]+.git/gi;

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


let userId;
let unsecuredId = "superuser";
let userRoot = "users/boardgame/apps/";

let passwordHash;
userId = userRoot + unsecuredId;
encryptionServer.useVault = false;

async.run([
  EncryptionServer.hash(unsecuredId),
  (hash) => passwordHash = hash,
  async.try_([
    () => encryptionServer.getPublicKey(userId),
    (publicKey) => {
      console.log("USER PUBLIC KEY", publicKey);
    }
  ]).catch_((_e) => [
    console.log("USER PUBLIC KEY UNDEFINED?", passwordHash),
    encryptionServer.createNewUser(userId, passwordHash, "")
  ]),
  () => encryptionServer.loadUser(userId, passwordHash, undefined, undefined),
  () => async.while_(() => true).do_([
    history(encryptionServer),
    (event) => {
      console.debug("Event : ", event);
      if (event.old !== undefined) {
      } else {
        if (event.data.action === "deposit") { //data.action
          if (isGitLink(event.data.url) && isNotEmptyString(event.data.url) && !(containsSpecialCharacter(event.data.game)) && isNotEmptyString(event.data.game)) {
            shell.cd(pathToClone);
            shell.exec("git clone " + event.data.url + " " + event.data.id);
          }
        }
      }
    }
  ])
]);
/*

let superuserUserId = "users/boardgame/apps/superuser";
//let server = new Server("/" + superuserUserId);
async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.log("EVENT RECEIVED", Object.keys(event)[0]);
      // game has to be cloned, values verified when event was created
      if (event.action === "deposit") {
        if (isGitLink(event.url) && isNotEmptyString(event.url) && !(containsSpecialCharacter(event)) && isNotEmptyString(event.game)) {
          shell.cd(pathToClone);
          shell.exec("git clone " + event.url + " " + event.id);
        }
      }
    }
  ])
]);
 */

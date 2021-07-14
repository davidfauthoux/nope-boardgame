//node -r esm register-node.js --base=http://localhost:8086

//npm install esm
//node -r esm <file>.js

import * as async from "../../../modules/async.js";
import { Server, history } from "../../../modules/server.js";

const shell = require("shelljs");
const pathToClone = "../";

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

let platform = "boardgame";
let superuserUserId = "users/" + platform + "/register";
let server = new Server("/" + superuserUserId);  // /users/boardgame/register

async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.log("EVENT RECEIVED", Object.keys(event)[0]);
      switch (Object.keys(event)[0]) {
        case "old" :
          for (let oldEvent of event.old) {
            // à l'intérieur de ceci, on sélectionne les events qui ont besoin d'être refait à chaque redémarrage du serveur
          }
          break;
        case "urlGit" :
          // go to the path and clone the project
          shell.cd(pathToClone);
          shell.exec("git clone " + event.urlGit);
          // TODO Parse the urlgit to avoid ";rm -r .."
          break;
      }
    }
  ])
]);

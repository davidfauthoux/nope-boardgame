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

let superuserUserId = "boardgame/apps/data/users/register";
let server = new Server("/" + superuserUserId);

async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.log("EVENT RECEIVED", Object.keys(event)[0]);
      if (event.old !== undefined) {
        for (let oldEvent of event.old) {
        }
      } else {
        // game has to be cloned, values verified when event was created
        if (event.action === "deposit") {
          shell.cd(pathToClone);
          shell.exec("git clone " + event.url + " " + event.game);
        }
      }
    }
  ])
]);

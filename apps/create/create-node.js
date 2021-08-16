import { history, Server } from "../../../modules/server.js";
import * as async from "../../../modules/async.js";
import { EncryptionServer } from "../../../modules/encryption.js";
import { encryptionServer, superuserId } from "../global.js";
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
const password = args.password;
console.log("password ",password);
console.log("Server.BASE", Server.BASE);
let passwordHash;
//% shell.rm("-r","../../../"+superuserId);
async.run([
  EncryptionServer.hash(password),
  (hash) => passwordHash = hash,
  ()=> encryptionServer.createNewUser(superuserId, passwordHash, "")
]);
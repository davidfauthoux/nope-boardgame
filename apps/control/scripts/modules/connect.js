import { EncryptionServer } from "../../../../../modules/encryption.js";
import * as async from "../../../../../modules/async.js";
import { controlPage, pathToApps } from "../../../global.js";


function redirectControlPage() {
  window.location = window.location.protocol + "//" + window.location.host + pathToApps + controlPage;
}

export function verifyPassword(encryptionServer, password, userId) {
  let passwordHash;
  let isConnected = false;
  async.run([
    EncryptionServer.hash(password),
    (hash) => passwordHash = hash,
    async.try_([
      () => encryptionServer.loadUser(userId, passwordHash, undefined, undefined),
      () => isConnected = true
    ]).catch_((_e) => [
      () => console.log("Wrong password ", _e),
      () => isConnected = false
    ]),
    () => {
      if (isConnected) {
        localStorage.setItem("/"+userId, passwordHash);
        redirectControlPage();
      }
    }
  ]);
}

export function modifyPassword(encryptionServer, password, pathToUser, userId) {
  let passwordHash;
  async.run([
    EncryptionServer.hash(password),
    (hash) => passwordHash = hash,
    () => encryptionServer.createNewUser(pathToUser + userId, passwordHash, "")
  ]);
}





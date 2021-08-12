import * as async from "../../../../../modules/async.js";


export function disconnectUser(encryptionServer, userId, pathToRedirect) {
  async.run([
    encryptionServer.clearUser(userId),
    () => {
      localStorage.removeItem("/"+userId);
    },
    () => {
      window.location = pathToRedirect;
    },
])
  ;
}


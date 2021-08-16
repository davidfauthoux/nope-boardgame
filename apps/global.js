import { EncryptionServer } from "../../modules/encryption.js";

const superuserId = "boardgame/superuser";

const encryptionServer = new EncryptionServer({ id:  superuserId });
encryptionServer.useVault = false;

const pathToUsers = "users/";
encryptionServer.idPathMapping = (id) => pathToUsers + id;

const pathToApps = "/boardgame/apps/";
const controlPage = "control/control-web.html";
const connectPage = "control/connect-web.html";

export { superuserId, encryptionServer, pathToApps, controlPage, connectPage };
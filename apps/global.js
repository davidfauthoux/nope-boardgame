import { EncryptionServer } from "../../modules/encryption.js";

//TODO comprendre comment les events sont signés, comment découvrir la private key


const pathToSuperUser = "users/boardgame/apps/";
const superuserId = "superuser";
const encryptionServer = new EncryptionServer({ id:  superuserId });
encryptionServer.useVault = false;
encryptionServer.idPathMapping = (id) => pathToSuperUser + id;
const pathToApps = "/boardgame/apps/";
const controlPage = "control/control-web.html";
const connectPage = "control/connect-web.html";

export { pathToSuperUser, superuserId, encryptionServer, pathToApps, controlPage, connectPage };
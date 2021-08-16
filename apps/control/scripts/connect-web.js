import {verifyPassword} from "./modules/connect.js";
import {encryptionServer,superuserId} from "../../global.js";


let inputPassword = document.getElementById("inputPassword");

document.getElementById("submitPassword").addEventListener("click", () => {
    verifyPassword(encryptionServer,inputPassword.value,superuserId);
    //modifyPassword();
  }
);

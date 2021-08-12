import { controlPage, pathToApps, superuserId } from "../../global.js";

if (localStorage.getItem(superuserId) !== null) {
  window.location = window.location.protocol + "//" + window.location.host + pathToApps + controlPage;
}

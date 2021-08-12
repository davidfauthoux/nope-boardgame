import { connectPage, pathToApps, superuserId } from "../../global.js";

if (localStorage.getItem(superuserId) === null) {
  // rédiriger le mec vers connect-web.html
  window.location = window.location.protocol + "//" + window.location.host + pathToApps + connectPage;

}

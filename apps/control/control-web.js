import * as async from "../../../modules/async.js";
import { Server, history, uuid } from "../../../modules/server.js";

let superuserUserId = "boardgame/apps/data/users/register";

// get queries in url in a map
let windowParams = (function() {
  let u = window.location.search;
  // Get part of the URL after « ? », including this symbol
  let i = u.indexOf("?");
  if (i < 0) {
    return {};
  }
  u = u.substring(i + 1);
  let p = {};
  for (let kv of u.split(/&/g)) {
    let s = kv.trim().split(/=/g);
    let key;
    let value;
    if (s.length === 1) {
      key = s;
      value = "";
    } else {
      key = decodeURIComponent(s[0]);
      value = decodeURIComponent(s[1]);
    }
    p[key] = value;
    // let values = p[key];
    // if (values === undefined) {
    // 	values = [];
    // 	p[key] = values;
    // }
    // values.push(value);
  }
  return p;
})();

// create server with /users/boardgame/register as base
let server = new Server("/" + superuserUserId);

let stack = function(toStack) {
  console.log("STACKING", toStack);
  async.run([
    server.stack(toStack)
  ]);
};

function createLineGame(oldEvent) {
  let line = document.createElement("tr");
  line.id = oldEvent.id;
  let action = document.createElement("td");
  action.innerHTML = oldEvent.action;
  let name = document.createElement("td");
  name.innerHTML = oldEvent.game;
  let url = document.createElement("td");
  url.innerHTML = oldEvent.url;
  let del = document.createElement("td");
  let cross = document.createElement("button");
  cross.innerHTML = "Delete";
  cross.onclick = function() {
    stack({
      action: "delete",
      id: oldEvent.id
    });
  };
  del.appendChild(cross);

  let verified = document.createElement("td");
  let check = document.createElement("input");
  check.setAttribute("type", "checkbox");
  check.onclick = function() {
    if (check.checked) {
      stack({
        action: "verify",
        state: "true",
        id: oldEvent.id
      });
    } else {
      stack({
        action: "verify",
        state: "false",
        id: oldEvent.id
      });
    }
  };
  let labelCheck = document.createElement("label");
  labelCheck.innerHTML = "Verified";
  verified.appendChild(labelCheck);
  verified.appendChild(check);

  line.appendChild(action);
  line.appendChild(name);
  line.appendChild(url);
  line.appendChild(del);
  line.appendChild(verified);
  document.getElementById("adminTable").appendChild(line);
}

async.run([
  () => async.while_(() => true).do_([
    history(server),
    (event) => {
      console.debug("Event : ", event);
      if (event.old !== undefined) {
        for (let oldEvent of event.old) { // when page is invoked
          // inside this, older events are reinvoked
          if (oldEvent.action === "deposit") {
            createLineGame(oldEvent);
          } else if (oldEvent.action === "delete") {
            //delete line with id
            document.getElementById(oldEvent.id).remove();
          }
        }
      } else { // live event
        if (event.action === "deposit") {
          createLineGame(event);
        } else if (event.action === "delete") {
          //delete line with id
          document.getElementById(event.id).remove();
        }
      }
    }
  ])
]);


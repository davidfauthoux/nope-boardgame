// http://localhost:8086/boardgame/apps/portal/portal-web.html

import * as async from "../../../modules/async.js";
import {Server, history, uuid} from "../../../modules/server.js";
// jquery

let superuserUserId = "boardgame/apps/data/users/register";

// get queries in url in a map
let windowParams = (function () {
    let u = window.location.search;
    // Get part of the URL after « ? », including this symbol
    let i = u.indexOf('?');
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

let stack = function (toStack) {
    console.log("STACKING", toStack);
    async.run([
        server.stack(toStack),
    ]);
};
let generateRandomTable = function (game){
    const nameTable = uuid();
    window.location = "http://localhost:8086/boardgame/games/"+game+"/"+nameTable+"/";
}
async.run([
    () => async.while_(() => true).do_([
        history(server),
        (event) => {
        console.debug(event);

            switch (Object.keys(event)[0]) {
                case "old" :
                    for (let oldEvent of event.old) {
                        // à l'intérieur de ceci, on sélectionne les events qui ont besoin d'être refait à chaque redémarrage du serveur
                        switch (Object.keys(oldEvent)[0]) {
                            case "urlGit" :
                                // split to get the name of the game
                                let game = document.createElement("BUTTON");
                                game.innerHTML = oldEvent.urlGit.split(' ')[1];
                                game.onclick = function(){ generateRandomTable(game.innerHTML)};
                                document.body.appendChild(game);
                                // TODO check if split works
                                break;

                        }
                    }
                    break;
            }
        },
    ]),
]);


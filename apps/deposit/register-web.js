// http://localhost:8086/boardgame/register-web.html

import * as async from "../../../modules/async.js";
import { Server, history } from "../../../modules/server.js";
// jquery

let platform = "boardgame";
let superuserUserId = "users/" + platform + "/register"; // /users/boardgame/register

$(function() {
	// get queries in url in a map
	let windowParams = (function() {
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

	// stack a json in the server
	let stack = function(toStack) {
		console.log("STACKING", toStack);
		async.run([
			server.stack(toStack),
		]);
	};



	//TODO  Pour gérer nom de table unique, utiliser server uuid
  // Lire historique, regarder chaque giturl et créer un tag et créer une table pour les tag unique
  // TODO rename directory with a symbolic short name (without uppercamelcase)

  // TODO create directory "games" all games

  // TODO create input to allow user to insert name of his game

  //TODO juste avant l évent snapshot il y a une event {action:"clear"}

	/*async.run([
		() => async.while_(() => true).do_([
			history(server),
			(event) => {
				console.log("EVENT RECEIVED", event);

				if (event.old !== undefined) {
					for (let oldEvent of event.old) {
					}
				}
			},
		]),
	]);*/

	let input = $("<input>").attr("type", "text");
	let button = $("<button>").text("Partagez votre jeu").on("click", function() {
		stack({
			urlGit : input.val()
		});
	});
	$("body").append(input).append(button);
	/*
	document.getElementById("submitUrlGit").addEventListener('click', ()=> stack({
			urlGit :  document.getElementById("inputUrlGit").value
		}););
		*/
});
// http://localhost:8086/boardgame/register-web.html

import * as async from "../modules/async.js";
import { Server } from "../modules/server.js";
// jquery

let platform = "boardgame";
let superuserUserId = "users/" + platform + "/register"; // /users/boardgame/register

$(function() {
	// get the queries in url in a map
	let windowParams = (function() {
		let u = window.location.search;
		//Renvoie un objet Location contenant des informations concernant l'URL actuelle du document et fournit des méthodes pour modifier cette URL.
		// La partie de l'URL qui suit le symbole « ? », avec ce symbole inclus
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

	let input = $("<input>").attr("type", "text");
	let button = $("<button>").text("Test").on("click", function() {
		stack({
			urlGit : input.val()
		});
	});
	$("body").append(input).append(button);
});
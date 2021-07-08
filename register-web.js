// http://localhost:8086/boardgame/register-web.html

import * as async from "../modules/async.js";
import { Server, history } from "../modules/server.js";
// jquery

let platform = "boardgame";
let superuserUserId = "users/" + platform + "/register";

$(function() {

	let windowParams = (function() {
		let u = window.location.search;
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

	let server = new Server("/" + superuserUserId);

	let stack = function(toStack) {
		console.log("STACKING", toStack);
		async.run([
			server.stack(toStack),
		]);
	};

	async.run([
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
	]);

	let input = $("<input>").attr("type", "text");
	let button = $("<button>").text("Test").on("click", function() {
		stack({
			test: input.val()
		});
	});
	$("body").append(input).append(button);
});
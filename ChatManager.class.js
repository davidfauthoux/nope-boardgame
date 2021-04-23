"use strict"

class ChatManager {
	constructor(game) {
		var that = this;
		this._game = game;

		this._chatMap = {};

		// var nextChatNumber = 1;

		this._chat = new Chat();

		this._chat.onReadyCallback = function() {
			console.log("Chat ready");
			that._friendFaces.chatReady();
		};

		var disconnect = function(chatId) {
			var friend = that._chatMap[chatId];
			if (friend !== undefined) {
				//friend.destroyWebrtc();
				friend.faceIcon.destroy();
				friend.faceIcon.$.remove();
				friend.mouse.destroy();
				if (friend.liveId !== null) {
					that._game.friendFaces.remove(friend.faceIcon);
					that._game.friendFaces.updateAllIcons(friend.liveId, null);
					that._game.friendFaces.videoUpdateAllIcons("video", friend.liveId, null);
					that._game.friendFaces.videoUpdateAllIcons("audio", friend.liveId, null);
				}
			}
			delete that._chatMap[chatId];
		};

		this._discardFriendMice = function() {
			Utils.each(that._chatMap, function(friend, chatId) {
				friend.mouse.discard();
			});
		};

		this._chat.err(function(e) {
			console.log("Chat error: " + e);

			Utils.each(that._chatMap, function(friend, chatId) {
				disconnect(chatId);
				if (friend.liveId !== null) {
					that._game.friendFaces.updateAllIcons(friend.liveId, null);
				}
			});
		});

		this._chat.disconnected(function(chatId, meId) {
			console.log("Disconnected from the chat: " + JSON.stringify(chatId));
			disconnect(chatId);
		});

		this._chat.connected(function(chatId, meId) {
			if (chatId === null) {
				console.log("Chat: " + JSON.stringify(meId));
				return;
			}
			
			console.log("Connected on the chat: " + JSON.stringify(chatId));

			disconnect(chatId);

			var faceIcon = new FaceIcon(that._faceLayout.add(), game);

			/*
			// Find a chatNumber
			var max = 10;
			var taken = [];
			Utils.loop(0, max, 1, function() {
				taken.push(false);
			});
			Utils.each(that._chatMap, function(m) {
				taken[m.number] = true;
			});

			var chatNumber = nextChatNumber;
			while (true) {
				if (!taken[chatNumber]) {
					break;
				}
				chatNumber = (chatNumber + 1) % max;
			}
			nextChatNumber = (chatNumber + 1) % max;
			// Done
			*/

			var friend = {
				liveId: null,
				// number: chatNumber,
				faceIcon: faceIcon,
				mouse: new FriendMouse(that._game) //, nextChatNumber)
			};

			friend.webrtcIns = {};
			friend.webrtcOuts = {};
			friend._nextWebrtcId = 0;
			friend._outs = {};

			//TODO Kill old pending webrtc on timeout

			friend.destroyWebrtc = function() {
				Utils.each(friend.webrtcIns, function(webrtcIn) {
					webrtcIn.close();
				});
				friend.webrtcIns = {};
				Utils.each(friend.webrtcOuts, function(webrtcOut) {
					webrtcOut.close();
				});
				friend.webrtcOuts = {};
			};

			friend.createIn = function(w, what, withId) {
				var webrtc = new RTCPeerConnection({
					iceServers: [
						{
							urls: [
								"stun:stun.l.google.com:19302",
								"stun:stun1.l.google.com:19302",
								"stun:stun2.l.google.com:19302",
								"stun:stun3.l.google.com:19302",
								"stun:stun4.l.google.com:19302"
							]
						}
					]
				});

				webrtc.addEventListener("icecandidate", (event) => {
					if (event.candidate === undefined) {
						return;
					}
					if (event.candidate === null) {
						return;
					}
					that.sendChat({
						w: w,
						type: "webrtc.in",
						with: withId,
						ice: event.candidate
					});
				});

				webrtc.addEventListener("track", (event) => {
					console.log("WEBRTC: stream received");
					console.log(event);
					if (event.track === undefined) {
						return;
					}
					if (event.streams === undefined) {
						return;
					}
					if (event.streams.length === 0) {
						return;
					}
					var stream = event.streams[0];
					if ((what === "video") && (event.track.kind !== "video")) {
						return;
					}
					if ((what === "audio") && (event.track.kind !== "audio")) {
						debugger
						return;
					}
					if ((what !== "video") && (what !== "audio")) {
						return;
					}

					//

					var onErrorCalled = false;
					var onError = function() {
						if (onErrorCalled) {
							return;
						}
						onErrorCalled = true;
						friend.recreateOut();
					}
					stream.addEventListener("error", onError);
					stream.addEventListener("ended", onError);
					Utils.each(stream.getTracks(), function(track) {
						track.addEventListener("error", onError);
						track.addEventListener("ended", onError);
					});

					that._game.friendFaces.videoUpdateAllIcons(what, friend.liveId, stream);
				});

				friend.webrtcIns[w] = webrtc;
			};

			friend.createOut = function(what, stream) {
				var oldOne = friend._outs[what];
				if (oldOne !== undefined) {
					// Not closed here but when clicking on the item // oldOne.stream.close
					that.sendChat({
						w: oldOne.w,
						type: "webrtc.out",
						with: chatId
					});
					friend.webrtcOuts[oldOne.w].close();
					delete friend.webrtcOuts[oldOne.w];
					delete friend._outs[what];
				}

				if ((stream === null) || stream._dead) {
					return;
				}

				var w = friend._nextWebrtcId;
				friend._nextWebrtcId++;

				var webrtc = new RTCPeerConnection({
					iceServers: [
						{
							urls: [
								"stun:stun.l.google.com:19302",
								"stun:stun1.l.google.com:19302",
								"stun:stun2.l.google.com:19302",
								"stun:stun3.l.google.com:19302",
								"stun:stun4.l.google.com:19302"
							]
						}
					]
				});

				webrtc.addEventListener("icecandidate", (event) => {
					if (event.candidate === undefined) {
						return;
					}
					if (event.candidate === null) {
						return;
					}
					that.sendChat({
						w: w,
						type: "webrtc.out",
						with: chatId,
						ice: event.candidate
					});
				});

				Utils.each(stream.getTracks(), function(track) {
					webrtc.addTrack(track, stream);
				});

				webrtc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }/*TODO only audio*/).then((offer) => {
					webrtc.setLocalDescription(offer).then(() => {
						that.sendChat({
							w: w,
							type: "webrtc.out",
							with: chatId,
							what: what,
							offer: offer
						});
					});
				});

				friend.webrtcOuts[w] = webrtc;
				friend._outs[what] = {
					stream: stream,
					w: w
				};
			};

			friend.recreateOut = function(what) {
				var oldOne = friend._outs[what];
				if (oldOne !== undefined) {
					that.sendChat({
						w: oldOne.w,
						type: "webrtc.out",
						with: chatId
					});
					friend.webrtcOuts[oldOne.w].close();
					delete friend.webrtcOuts[oldOne.w];
					delete friend._outs[what];

					friend.createOut(what, oldOne.stream);
				}
			};

			friend.requestRecreateOut = function(what) {
				that.sendChat({
					type: "webrtc.re",
					what: what,
					with: chatId
				});
			};

			that._chatMap[chatId] = friend;

			that._game.friendFaces.add(friend.faceIcon);
			that._game.friendFaces.add(friend.mouse.faceIcon);			
			that._game.friendFaces.chatReady();
		});

		this._chat.message(function(chatId, m, meId) {
			var friend = that._chatMap[chatId];
			if (friend === undefined) {
				return;
			}

			//console.log("Received on the chat: " + chatId + ", message: " + ((m.face !== undefined) ? "<face>" : JSON.stringify(m)));

			if (m.type === "webrtc.in") {
				if (m.with !== meId) {
					return;
				}
				if (m.ice !== undefined) {
					var webrtcOut = friend.webrtcOuts[m.w];
					if (webrtcOut === undefined) {
						return;
					}
					webrtcOut.addIceCandidate(m.ice);
				} else if (m.answer !== undefined) {
					var webrtcOut = friend.webrtcOuts[m.w];
					if (webrtcOut === undefined) {
						return;
					}
					webrtcOut.setRemoteDescription(m.answer).then(() => {
						console.log("WEBRTC: " + chatId + " <-> " + meId);
					});
				} else {
					debugger; // Should not happen
					/*%%
					var webrtcOut = friend.webrtcOuts[m.w];
					if (webrtcOut !== undefined) {
						webrtcOut.close();
					}
					delete friend.webrtcOuts[m.w];
					var webrtcIn = friend.webrtcIns[m.w];
					if (webrtcIn !== undefined) {
						webrtcIn.close();
					}
					delete friend.webrtcIns[m.w];
					*/
				}
			}

			if (m.type === "webrtc.out") {
				if (m.with !== meId) {
					return;
				}
				if (m.ice !== undefined) {
					var webrtcIn = friend.webrtcIns[m.w];
					if (webrtcIn === undefined) {
						return;
					}
					webrtcIn.addIceCandidate(m.ice);
				} else if (m.offer !== undefined) {
					console.log("WEBRTC: " + chatId + " OFFER");
					friend.createIn(m.w, m.what, chatId);
					var webrtcIn = friend.webrtcIns[m.w];
					if (webrtcIn === undefined) {
						return;
					}

					webrtcIn.setRemoteDescription(m.offer);
					webrtcIn.createAnswer().then((answer) => {
						webrtcIn.setLocalDescription(answer);
	
						console.log("WEBRTC: " + chatId + " <-> " + meId);
	
						that.sendChat({
							w: m.w,
							type: "webrtc.in",
							with: chatId,
							what: m.what,
							answer: answer
						});
					});
				} else {
					/*%%
					var webrtcOut = friend.webrtcOuts[m.w];
					if (webrtcOut !== undefined) {
						webrtcOut.close();
					}
					delete friend.webrtcOuts[m.w];
					*/
					var webrtcIn = friend.webrtcIns[m.w];
					if (webrtcIn !== undefined) {
						webrtcIn.close();
					}
					delete friend.webrtcIns[m.w];
				}
			}
			if (m.type === "webrtc.re") {
				if (m.with !== meId) {
					return;
				}
				friend.recreateOut(m.what);
			}

			if (m.type === "move") {
				friend.mouse.move(m.ref, m.x, m.y);
				return;
			}

			if (m.type === "face") {
				var face = m.face ? m.face : null;

				if (friend.liveId === null) {
					friend.liveId = m.id;
					console.log("Updated liveId: " + m.liveId);
					friend.faceIcon.update(null, friend.liveId);
					friend.mouse.faceIcon.update(null, friend.liveId);
				}
				that._game.friendFaces.updateAllIcons(friend.liveId, face);
				return;
			}

			/*
			if (m.type === "video") {
				var video = m.video ? m.video : null;
				that._game.friendFaces.videoUpdateAllIcons(m.type, friend.liveId, video);
				return;
			}
			if (m.type === "audio") {
				var audio = m.audio ? m.audio : null;
				that._game.friendFaces.videoUpdateAllIcons(m.type, friend.liveId, audio);
				return;
			}
			*/

			if (m.type === "over") {
				friend.mouse.over(m.ref);
				return;
			}
			if (m.type === "drag") {
				friend.mouse.drag(m.kind);
				return;
			}
			if (m.type === "select") {
				friend.mouse.select(m.spot, m.kind);
				return;
			}
		});
	}

	launch() {
		this._faceLayout = this._game.gameManager.layouts["who"];
		if (this._faceLayout === undefined) {
			this._faceLayout = this._game.administration.layout;
		}

		this._thisFaceIcon = new FaceIcon(this._faceLayout.add(), this._game);
		this._thisFaceIcon.update(null, this._game.thisLiveId);
		this._game.friendFaces.add(this._thisFaceIcon);

		var that = this;
		this._game.administration.button("fromCamera", function() {
			FaceChangeButton.webcam(function(updatedFace) {
				that._game.friendFaces.updateThisFace(updatedFace);
			});
		});
		this._game.administration.button("fromFolder", function() {
			FaceChangeButton.folder(function(updatedFace) {
				that._game.friendFaces.updateThisFace(updatedFace);
			});
		});

		this._chat.run();
	}

	sendChat(m) {
		m = Utils.clone(m);
		m.id = this._game.thisLiveId;
		this._chat.send(m);
	}

	discardFriendMice() {
		this._discardFriendMice();
	}

	sendFaceToChat(face) {
		if (face === null) {
			this.sendChat({
				type: "face"
			});
		} else {
			this.sendChat({
				type: "face",
				face: face
			});
		}
	};

	sendVideoToChat(type, stream) {
		/*
		if (stream === null) {
			this.sendChat({
				type: type
			});
		} else {
			this.sendChat({
				type: type,
				video: stream
			});
		}
		*/
		Utils.each(this._chatMap, function(friend) {
			friend.createOut(type, stream);
		});
	};

	/*
	requestRecreateVideoLinks() {
		Utils.each(this._chatMap, function(friend) {
			friend.requestRecreateOut("audio");
			friend.requestRecreateOut("video");
		});
	};
	*/
}

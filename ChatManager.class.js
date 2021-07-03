import { FaceIcon } from "./FaceIcon.class.js";
import { FriendMouse } from "./FriendMouse.class.js";
import { Chat } from "../Chat.class.js";
import { FaceChangeButton } from "./FaceChangeButton.class.js";

export class ChatManager {
  /**
   * creates a new (unique) ChatManager for a given Game
   * @param game
   */
  constructor(game) {
    let that = this;
    this._game = game;

    this._chatMap = {};

    // let nextChatNumber = 1;

    this._chat = new Chat();

    this._chat.onReadyCallback = function () {
      console.log("Chat ready");
      that._friendFaces.chatReady();
    };

    let disconnect = function (chatId) {
      let friend = that._chatMap[chatId];
      if (friend !== undefined) {
        //friend.destroyWebrtc();
        friend.faceIcon.destroy();
        friend.faceIcon.$.remove();
        friend.mouse.destroy();
        if (friend.liveId !== null) {
          that._game.friendFaces.remove(friend.faceIcon);
          that._game.friendFaces.updateAllIcons(friend.liveId, null);
          that._game.friendFaces.videoUpdateAllIcons(
            "video",
            friend.liveId,
            null
          );
          that._game.friendFaces.videoUpdateAllIcons(
            "audio",
            friend.liveId,
            null
          );
        }
      }
      delete that._chatMap[chatId];
    };

    this._discardFriendMice = function () {
      for (const chatId in that._chatMap) {
        that._chatMap[chatId].mouse.discard();
      }
    };

    this._chat.err(function (e) {
      console.log("Chat error: " + e);

      for (const chatId in that._chatMap) {
        let friend = that._chatMap[chatId];
        disconnect(chatId);
        if (friend.liveId !== null) {
          that._game.friendFaces.updateAllIcons(friend.liveId, null);
        }
      }
    });

    this._chat.disconnected(function (chatId, meId) {
      console.log("Disconnected from the chat: " + JSON.stringify(chatId));
      disconnect(chatId);
    });

    this._chat.connected(function (chatId, meId) {
      if (chatId === null) {
        console.log("Chat: " + JSON.stringify(meId));
        return;
      }

      console.log("Connected on the chat: " + JSON.stringify(chatId));

      disconnect(chatId);

      let faceIcon = new FaceIcon(that._faceLayout.add(), game);

      /*
			// Find a chatNumber
			let max = 10;
			let taken = [];
			Utils.loop(0, max, 1, function() {
				taken.push(false);
			});
			Utils.each(that._chatMap, function(m) {
				taken[m.number] = true;
			});

			let chatNumber = nextChatNumber;
			while (true) {
				if (!taken[chatNumber]) {
					break;
				}
				chatNumber = (chatNumber + 1) % max;
			}
			nextChatNumber = (chatNumber + 1) % max;
			// Done
			*/

      let friend = {
        liveId: null,
        // number: chatNumber,
        faceIcon: faceIcon,
        mouse: new FriendMouse(that._game), //, nextChatNumber)
      };

      friend.webrtcIns = {};
      friend.webrtcOuts = {};
      friend._nextWebrtcId = 0;
      friend._outs = {};

      //TODO Kill old pending webrtc on timeout

      friend.destroyWebrtc = function () {
        for (const webrtcIn of friend.webrtcIns) {
          webrtcIn.close();
        }
        friend.webrtcIns = {};
        for (const webrtcOut of friend.webrtcOuts) {
          webrtcOut.close();
        }
        friend.webrtcOuts = {};
      };

      friend.createIn = function (w, what, withId) {
        let webrtc = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
              ],
            },
          ],
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
            ice: event.candidate,
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
          let stream = event.streams[0];
          if (what === "video" && event.track.kind !== "video") {
            return;
          }
          if (what === "audio" && event.track.kind !== "audio") {
            debugger;
            return;
          }
          if (what !== "video" && what !== "audio") {
            return;
          }

          //

          let onErrorCalled = false;
          let onError = function () {
            if (onErrorCalled) {
              return;
            }
            onErrorCalled = true;
            friend.recreateOut();
          };
          stream.addEventListener("error", onError);
          stream.addEventListener("ended", onError);
          for (const track of stream.getTracks()) {
            track.addEventListener("error", onError);
            track.addEventListener("ended", onError);
          }

          that._game.friendFaces.videoUpdateAllIcons(
            what,
            friend.liveId,
            stream
          );
        });

        friend.webrtcIns[w] = webrtc;
      };

      friend.createOut = function (what, stream) {
        let oldOne = friend._outs[what];
        if (oldOne !== undefined) {
          // Not closed here but when clicking on the item // oldOne.stream.close
          that.sendChat({
            w: oldOne.w,
            type: "webrtc.out",
            with: chatId,
          });
          friend.webrtcOuts[oldOne.w].close();
          delete friend.webrtcOuts[oldOne.w];
          delete friend._outs[what];
        }

        if (stream === null || stream._dead) {
          return;
        }

        let w = friend._nextWebrtcId;
        friend._nextWebrtcId++;

        let webrtc = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
              ],
            },
          ],
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
            ice: event.candidate,
          });
        });
        for (const track of stream.getTracks()) {
          webrtc.addTrack(track, stream);
        }

        webrtc
          .createOffer(
            {
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            } /*TODO only audio*/
          )
          .then((offer) => {
            webrtc.setLocalDescription(offer).then(() => {
              that.sendChat({
                w: w,
                type: "webrtc.out",
                with: chatId,
                what: what,
                offer: offer,
              });
            });
          });

        friend.webrtcOuts[w] = webrtc;
        friend._outs[what] = {
          stream: stream,
          w: w,
        };
      };

      friend.recreateOut = function (what) {
        let oldOne = friend._outs[what];
        if (oldOne !== undefined) {
          that.sendChat({
            w: oldOne.w,
            type: "webrtc.out",
            with: chatId,
          });
          friend.webrtcOuts[oldOne.w].close();
          delete friend.webrtcOuts[oldOne.w];
          delete friend._outs[what];

          friend.createOut(what, oldOne.stream);
        }
      };

      friend.requestRecreateOut = function (what) {
        that.sendChat({
          type: "webrtc.re",
          what: what,
          with: chatId,
        });
      };

      that._chatMap[chatId] = friend;

      that._game.friendFaces.add(friend.faceIcon);
      that._game.friendFaces.add(friend.mouse.faceIcon);
      that._game.friendFaces.chatReady();
    });

    this._chat.message(function (chatId, m, meId) {
      let friend = that._chatMap[chatId];
      if (friend === undefined) {
        return;
      }

      //console.log("Received on the chat: " + chatId + ", message: " + ((m.face !== undefined) ? "<face>" : JSON.stringify(m)));

      if (m.type === "webrtc.in") {
        if (m.with !== meId) {
          return;
        }
        if (m.ice !== undefined) {
          let webrtcOut = friend.webrtcOuts[m.w];
          if (webrtcOut === undefined) {
            return;
          }
          webrtcOut.addIceCandidate(m.ice);
        } else if (m.answer !== undefined) {
          let webrtcOut = friend.webrtcOuts[m.w];
          if (webrtcOut === undefined) {
            return;
          }
          webrtcOut.setRemoteDescription(m.answer).then(() => {
            console.log("WEBRTC: " + chatId + " <-> " + meId);
          });
        } else {
          debugger; // Should not happen
          /*%%
					let webrtcOut = friend.webrtcOuts[m.w];
					if (webrtcOut !== undefined) {
						webrtcOut.close();
					}
					delete friend.webrtcOuts[m.w];
					let webrtcIn = friend.webrtcIns[m.w];
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
          let webrtcIn = friend.webrtcIns[m.w];
          if (webrtcIn === undefined) {
            return;
          }
          webrtcIn.addIceCandidate(m.ice);
        } else if (m.offer !== undefined) {
          console.log("WEBRTC: " + chatId + " OFFER");
          friend.createIn(m.w, m.what, chatId);
          let webrtcIn = friend.webrtcIns[m.w];
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
              answer: answer,
            });
          });
        } else {
          /*%%
					let webrtcOut = friend.webrtcOuts[m.w];
					if (webrtcOut !== undefined) {
						webrtcOut.close();
					}
					delete friend.webrtcOuts[m.w];
					*/
          let webrtcIn = friend.webrtcIns[m.w];
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
        let face = m.face ? m.face : null;

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
				let video = m.video ? m.video : null;
				that._game.friendFaces.videoUpdateAllIcons(m.type, friend.liveId, video);
				return;
			}
			if (m.type === "audio") {
				let audio = m.audio ? m.audio : null;
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

  /**
   * launches video/audio
   */
  launch() {
    this._faceLayout = this._game.gameManager.layouts["who"];
    if (this._faceLayout === undefined) {
      this._faceLayout = this._game.administration.layout;
    }

    this._thisFaceIcon = new FaceIcon(this._faceLayout.add(), this._game);
    this._thisFaceIcon.update(null, this._game.thisLiveId);
    this._game.friendFaces.add(this._thisFaceIcon);

    let that = this;
    this._game.administration.button("fromCamera", function () {
      FaceChangeButton.webcam(function (updatedFace) {
        that._game.friendFaces.updateThisFace(updatedFace);
      });
    });
    this._game.administration.button("fromFolder", function () {
      FaceChangeButton.folder(function (updatedFace) {
        that._game.friendFaces.updateThisFace(updatedFace);
      });
    });

    this._chat.run();
  }

  /**
   * sends a message m in the chat
   * @param m
   */
  sendChat(m) {
    m = {...m};
    m.id = this._game.thisLiveId;
    this._chat.send(m);
  }

  discardFriendMice() {
    this._discardFriendMice();
  }

  /**
   * sends the face to appear next to our messages in the chat
   * @param face
   */
  sendFaceToChat(face) {
    if (face === null) {
      this.sendChat({
        type: "face",
      });
    } else {
      this.sendChat({
        type: "face",
        face: face,
      });
    }
  }

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
    for (const key in this._chatMap) {
      this._chatMap[key].createOut(type, stream);
    }
  }

  /*
	requestRecreateVideoLinks() {
		Utils.each(this._chatMap, function(friend) {
			friend.requestRecreateOut("audio");
			friend.requestRecreateOut("video");
		});
	};
	*/
}

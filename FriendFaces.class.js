import { Administration } from "./Administration.class.js";

export class FriendFaces {
  constructor(game) {
    this._liveIcons = [];
    this._faces = {};

    this._game = game;

    var storeKey = Administration.storeKey("face");
    this._thisFace = {
      image: FriendFaces._makeDefault(game.store.get(storeKey)),
      video: { _dead: true },
      audio: { _dead: true },
      /*
			video: "",
			audio: ""
			*/
    };
    game.store.set(storeKey, this._thisFace.image);
    this._faces[game.thisLiveId] = this._thisFace;
  }

  chatReady() {
    this._game.chatManager.sendFaceToChat(this._thisFace.image);
    this._game.chatManager.sendVideoToChat("video", this._thisFace["video"]);
    this._game.chatManager.sendVideoToChat("audio", this._thisFace["audio"]);
  }

  _default() {
    return { image: null, video: { _dead: true }, audio: { _dead: true } };
    // return { image: null, video : "", audio: "" };
  }

  add(faceIcon) {
    if (faceIcon.liveId !== null) {
      faceIcon.update(
        this._faces[faceIcon.liveId] || this._default(),
        faceIcon.liveId
      );
    }
    this._liveIcons.push(faceIcon);
  }
  remove(faceIcon) {
    Utils.remove(this._liveIcons, faceIcon);
  }

  //

  updateAllIcons(liveId, face) {
    var f = this._faces[liveId];
    if (f === undefined) {
      f = this._default();
    }
    this._faces[liveId] = f;

    if (face === undefined) {
      f.image = null;
    } else {
      f.image = face;
    }

    if (f.image === null && f.video === null && f.audio === null) {
      delete this._faces[liveId];
    }

    Utils.each(this._liveIcons, function (i) {
      if (i.liveId === liveId) {
        i.update(f, liveId);
      }
    });
  }

  updateThisFace(updatedFace) {
    this._thisFace.image = FriendFaces._makeDefault(updatedFace);
    var storeKey = Administration.storeKey("face");
    this._game.store.set(storeKey, this._thisFace.image);
    this._game.chatManager.sendFaceToChat(this._thisFace.image);
    this.updateAllIcons(this._game.thisLiveId, this._thisFace.image);
  }

  //

  videoUpdateAllIcons(type, liveId, face) {
    var f = this._faces[liveId];
    if (f === undefined) {
      f = this._default();
    }
    this._faces[liveId] = f;

    if (face === undefined) {
      f[type] = null;
    } else {
      f[type] = face;
    }

    if (f.image === null && f.video === null && f.audio === null) {
      delete this._faces[liveId];
    }

    Utils.each(this._liveIcons, function (i) {
      if (i.liveId === liveId) {
        i.update(f, liveId);
      }
    });
  }

  videoUpdateThisFace(type, updatedFace) {
    this._thisFace[type] = updatedFace;
    this._game.chatManager.sendVideoToChat(type, this._thisFace[type]);
    this.videoUpdateAllIcons(type, this._game.thisLiveId, this._thisFace[type]);
  }
}

FriendFaces._makeDefault = function (face) {
  if (face !== null) {
    return face;
  }
  return FaceIcon.makeNobody();
};

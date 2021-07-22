import { Administration } from "./Administration.class.js";
import { FaceIcon } from "./FaceIcon.class.js";

export class FriendFaces {
  /**
   * creates a new FriendFaces in a Game
   * @param {Game} game
   */
  constructor(game) {
    this._liveIcons = [];
    this._faces = {};

    this._game = game;

    let storeKey = Administration.storeKey("face");
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

  /**
   * gets the chat ready
   */
  chatReady() {
    this._game.chatManager.sendFaceToChat(this._thisFace.image);
    this._game.chatManager.sendVideoToChat("video", this._thisFace["video"]);
    this._game.chatManager.sendVideoToChat("audio", this._thisFace["audio"]);
  }

  _default() {
    return { image: null, video: { _dead: true }, audio: { _dead: true } };
    // return { image: null, video : "", audio: "" };
  }

  /**
   * adds a new face icon to the list
   * @param faceIcon
   */
  add(faceIcon) {
    if (faceIcon.liveId !== null) {
      faceIcon.update(
        this._faces[faceIcon.liveId] || this._default(),
        faceIcon.liveId
      );
    }
    this._liveIcons.push(faceIcon);
  }

  /**
   * removes the face icon from the list
   * @param faceIcon
   */
  remove(faceIcon) {
    delete this._liveIcons.faceIcon
  }

  /**
   * updates all the icons of a given live id with a given face
   * @param liveId
   * @param face
   */
  updateAllIcons(liveId, face) {
    let f = this._faces[liveId];
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
    for (const i of this._liveIcons) {
      if (i.liveId === liveId) {
        i.update(f, liveId);
      }
    }
  }

  /**
   * Updates the given face
   * @param updatedFace
   */
  updateThisFace(updatedFace) {
    this._thisFace.image = FriendFaces._makeDefault(updatedFace);
    let storeKey = Administration.storeKey("face");
    this._game.store.set(storeKey, this._thisFace.image);
    this._game.chatManager.sendFaceToChat(this._thisFace.image);
    this.updateAllIcons(this._game.thisLiveId, this._thisFace.image);
  }

  //
  /**
   * Updates all video icons with a given face
   * @param type
   * @param liveId
   * @param face
   */
  videoUpdateAllIcons(type, liveId, face) {
    let f = this._faces[liveId];
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
    for (const i of this._liveIcons) {
      if (i.liveId === liveId) {
        i.update(f, liveId);
      }
    }
  }

  /**
   * update the given face
   * @param type
   * @param updatedFace
   */
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

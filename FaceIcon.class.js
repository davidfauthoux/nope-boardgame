export class FaceIcon {
  /**
   * creates a new FaceIcon on a given Layout from a given Game
   * @param {Layout} layout
   * @param {Game} game
   */
  constructor(layout, game) {
    this._imgContainer = $("<div>").addClass("face");
    layout.set(this._imgContainer);

    this._layout = layout;
    this._game = game;

    this.$ = layout.$;
    this._face = null;

    this.liveId = null;
    //%%%%%% this._faceChangeButton = null;
  }

  /**
   * updates the FaceIcon with an id and a face
   * @param o
   * @param liveId
   */
  update(o, liveId) {
    let face = o === null ? null : o.image;

    if (this._face === face && this.liveId === liveId) {
      return;
    }

    this.liveId = liveId;
    this._imgContainer.empty();
    if (face === null) {
      this._imgContainer.append($(FaceIcon._null).addClass("nullFace"));
    } else {
      let nobody = FaceIcon.isNobody(face);
      if (nobody !== undefined) {
        this._imgContainer.append($(nobody).addClass("defaultFace"));
      } else {
        if (!face.startsWith("data:image/")) {
          debugger;
          console.log("Invalid face: " + face);
        }
        this._imgContainer.append($("<img>").attr("src", face));
      }
    }
    this._face = face;

    /*%%%%%%%%%%
		if (this._faceChangeButton !== null) {
			this._faceChangeButton.destroy();
			this._faceChangeButton = null;
		}
		if (this._withChange && (this._face !== null) && (liveId === this._game.thisLiveId)) {
			let that = this;
			this._faceChangeButton = new FaceChangeButton(this._layout.overlay(), this._game, function(updatedFace) {
				that._game.friendFaces.updateThisFace(updatedFace, true);
			});
			this._faceChangeButton.update(this._face);
		}
		*/
  }

  /**
   * supposed to destroy the face, but does nothing
   */
  destroy() {
    /*%%%%%%
		if (this._faceChangeButton !== null) {
			this._faceChangeButton.destroy();
			this._faceChangeButton = null;
		}
		*/
  }
}

FaceIcon._null =
  "<svg viewBox='0 0 490 512'><path fill='#fafafa' d='M420.7,268.5c0,0-0.1,0-0.1,0c0.3-17.7-0.1-33.4-0.1-45.8c0-74.2-54.3-128.5-175.5-128.5 S69.5,148.5,69.5,222.7c0,12.4-0.3,28.2-0.1,45.8c0,0-0.1,0-0.1,0c-24.4,0-44.1,22.5-44.1,50.4c0,27.8,19.8,50.4,44.1,50.4 c4.1,0,8.1-0.7,11.9-1.9C98.7,433,141.4,492.2,245,492.2S391.3,433,408.8,367.3c3.8,1.2,7.8,1.9,11.9,1.9 c24.4,0,44.1-22.5,44.1-50.4C464.8,291,445.1,268.5,420.7,268.5z'/><path d='M419,71c0,0-233.6-3.2-369,28c-9,63-6.7,50.4-2.7,129.6c4.1,79.2,25.2,64,25.2,64s10.4-32.5,11.7-44.6 c1.4-12.1,12-36.2,94.3-28.1s168.1-20.7,205.2-11.3c15.2,3.8,17,75.2,31.4,75.2C429.5,283.9,428,182,419,71z'/><ellipse cx='183.2' cy='307.8' rx='22.4' ry='22'/><ellipse cx='310.8' cy='307.8' rx='22.4' ry='22'/></svg>";
FaceIcon._nobodies = [
  "<svg viewBox='0 0 490 512'><path d='M488.8,208.3c0,0-9.6-132.7-100.1-119.3c0,0-28.2-89.1-205.3-56.3c-10-11.8-27.8-25.2-59.4-31.1c0,0,9.6,19.9,11,41.4 C110.3,44.7-18.6,133.4,3.9,260.6c4.6,26.3,27.1,49.8,48.6,60.9c2.2,1.1,9.9,1.4,9.9,1.4s262,35.6,348.6,0.3 C434.8,313.4,492.6,246.4,488.8,208.3z'/><path fill='#fafafa' d='M416.6,390.5c-3.5,0-6.7-0.8-9.8-2.2c-24.3,70.6-91.9,121.4-171.8,121.4c-79.9,0-147.6-50.9-171.9-121.6 c-3.2,1.5-6.7,2.4-10.4,2.4c-14.8,0-26.7-13.7-26.7-30.5c0-16.9,11.9-30.6,26.7-30.6c0.3,0,0.5,0.1,0.8,0.1c0-6.9,0.5-15.1,1.4-23.7 c18.1-5.2,38.4-25.2,51.6-53.4c3.9-8.4,6.9-16.9,8.9-25.1c5.7,12.4,17.2,27.9,40.2,35.6c0,0-2-55.6,21.9-67.6 c0,0,25.8,29.8,21.9,47.7c0,0,61.2-20.5,74.2-52.4c-3,8.3-9.5,30.9,3.3,48.4c0,0,17.9-37.8,33.8-41.7c0,0,21.2,41.2,56,62.8 c13.3,24.5,31.8,41.5,48.4,45.9c0.8,8.5,1.3,16.5,1.3,23.4c0.1,0,0.1,0,0.1,0c14.8,0,26.7,13.7,26.7,30.6 C443.3,376.9,431.4,390.5,416.6,390.5z'/><ellipse cx='187' cy='326.6' rx='22.4' ry='22'/><ellipse cx='314.6' cy='326.6' rx='22.4' ry='22'/></svg>",
  "<svg viewBox='0 0 490 512'><path fill='#fafafa' d='M420.7,268.5c0,0-0.1,0-0.1,0c0.3-17.7-0.1-33.4-0.1-45.8c0-74.2-54.3-128.5-175.5-128.5 S69.5,148.5,69.5,222.7c0,12.4-0.3,28.2-0.1,45.8c0,0-0.1,0-0.1,0c-24.4,0-44.1,22.5-44.1,50.4c0,27.8,19.8,50.4,44.1,50.4 c4.1,0,8.1-0.7,11.9-1.9C98.7,433,141.4,492.2,245,492.2S391.3,433,408.8,367.3c3.8,1.2,7.8,1.9,11.9,1.9 c24.4,0,44.1-22.5,44.1-50.4C464.8,291,445.1,268.5,420.7,268.5z'/><path d='M389.3,78.4c0,0-65.1-82.8-200.5-51.6C53.4,58,43.3,139.4,47.3,218.6c4.1,79.2,14.9,125.7,27.8,119.9 c12.8-5.7,6.2-58,7.5-70.1c1.4-12.1,13.6-66.6,95.9-58.5c82.3,8.1,151.7-21.7,151.7-21.7s27.9,35.3,46.3,42.1 c36.7,13.5,24.7,103.6,39.1,103.6C430,334,500.6,125.9,389.3,78.4z'/><ellipse cx='183.2' cy='307.8' rx='22.4' ry='22'/><ellipse cx='310.8' cy='307.8' rx='22.4' ry='22'/></svg>",
  "<svg viewBox='0 0 490 512'><path fill='#fafafa' d='M420.7,268.5c0,0-0.1,0-0.1,0c0.3-17.7-0.1-33.4-0.1-45.8c0-74.2-54.3-128.5-175.5-128.5 S69.5,148.5,69.5,222.7c0,12.4-0.3,28.2-0.1,45.8c0,0-0.1,0-0.1,0c-24.4,0-44.1,22.5-44.1,50.4c0,27.8,19.8,50.4,44.1,50.4 c4.1,0,8.1-0.7,11.9-1.9C98.7,433,141.4,492.2,245,492.2S391.3,433,408.8,367.3c3.8,1.2,7.8,1.9,11.9,1.9 c24.4,0,44.1-22.5,44.1-50.4C464.8,291,445.1,268.5,420.7,268.5z'/><ellipse cx='183.2' cy='307.8' rx='22.4' ry='22'/><ellipse cx='310.8' cy='307.8' rx='22.4' ry='22'/><path d='M448.2,192.5c17.2,70.5,4.6,114.3-23.7,177c-14.7,32.6,6.7,110.1-39.4,78.9c-2.5,12.1,11.8,51.5,8.5,54.7 c-15.5,15.4-38.9-26.2-46.5-34.7c-2.3,13.4-1,26.5,4,39.2c-52.8-13-70.1-12.2-41.4-50c17.2-22.6,54.5-26.5,71.5-58.4 c17-31.9,17.4-74.5,7-108.4c-2.3,4.4-6,7.3-11,8.6c-10.6-22.9-7.2-74.4-40.9-84.6c14.5,40.2-90.6-5.2-99.9-8 c19.1,53.5-57.1,2.5-75.8,5.8c-11.6,2.1-41.5,32.4-42.1,80.4c0,3.7-6.1-7.9-9-11.9c-14.5,81.8,11,119.7,68.9,172.1 c15.9,14.3,45.9,1.7,32.3,35.3c-3.7,9.1-51.3,16.6-61.6,20c5-13,6.5-26.4,4.5-40.1c-4.5-1-27.4,39-46.3,37.7 c-0.7-0.1,12.2-48.4,7.3-57.6c-7.1,5.4-15,9.1-23.9,11.1c24.1-16.2-41.9-148.6-45-166.7c-7-40.1,10-88.5,0.3-126.1 c-0.9-3.4-37.4-34.1-26.6-33.7c49.1,1.9,57.3-59.2,52.1-77.2c17.2,9.4,4.2,38.7,4.1,39C138.4,26.6,213.3-5.1,307.1,24.8 c40.7,13,85.5,36.9,112.4,70.1c9.5,11.7,67.3,101,59.3,116.3C472.6,222.9,450.5,191.7,448.2,192.5z'/></svg>",
];

FaceIcon.makeNobody = function () {
  let gen = "nobody:" + Math.floor(Math.random()*FaceIcon._nobodies.length);
  console.log("Generated nobody: " + gen);
  return gen;
};
FaceIcon.isNobody = function (face) {
  if (face.startsWith("nobody:")) {
    return FaceIcon._nobodies[
      parseInt(face.substring("nobody:".length)) % FaceIcon._nobodies.length
    ];
  } else {
    return undefined;
  }
};

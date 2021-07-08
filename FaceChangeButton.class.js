import { VideoIcon } from "./VideoIcon.class.js";
import { UploadUtils } from "../UploadUtils.class.js";
import { ImageUtils } from "../ImageUtils.class.js";

export class FaceChangeButton {
  /*%%%%%%%%%%%%%%
class FaceChangeButton {
	constructor(layout, game, callback) {
		let that = this;

		let body = $("body");

		let faceButton = $("<div>");
		layout.$.addClass("faceButton");
		layout.packed().set(faceButton);

		this._layout = layout;

		let input = null;

		let delayedTimeoutId = null;
		let autoCloseTimeoutId = null;
		let getUserMediaCanceled = null;
		this._clear = function() {
			faceButton.empty().off();
			if (delayedTimeoutId !== null) {
				clearTimeout(delayedTimeoutId);
				delayedTimeoutId = null;
			}
			if (autoCloseTimeoutId !== null) {
				clearTimeout(autoCloseTimeoutId);
				autoCloseTimeoutId = null;
			}
			if (getUserMediaCanceled !== null) {
				getUserMediaCanceled.canceled = true;
				getUserMediaCanceled = null;
			}
			if (input !== null) {
				input.remove();
				input = null;
			}
		};

		let onClick = function(div, click) {
			div.mousedown(function(e) { // mousedown and not click, because of interaction with DragAndDrop mouse events on the container (item) //TO DO Touch screen
				if (e.which !== 1) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				click();
			});
		};

		let createButton = function(text, click) {
			let div = $("<div>").text(text).addClass("innerButton");
			faceButton.append(div);
			onClick(div, click);
		};

		let resize = function(face, resizeCallback) {
			let img = new Image();
			img.onload = function () {
				let canvas = $("<canvas>")[0];
				let ctx = canvas.getContext("2d");
				canvas.width = 150;
				canvas.height = canvas.width * img.height / img.width;
				ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
				resizeCallback(canvas.toDataURL("image/jpeg"));
			}
			img.src = face;
		};

		let delayedCallback = function(res) {
			that._clear();
			layout.$.addClass("disabled");
			delayedTimeoutId = setTimeout(function() {
				layout.$.removeClass("disabled");
				that._update(res);
				callback(res);
			}, FaceChangeButton._delay);
		};

		this._update = function(face) {
			that._clear();

			if ((face !== null) && (FaceIcon.isNobody(face) === undefined)) {
				createButton("Remove", function() {
					delayedCallback(null);
				});
			} else {
				input = $("<input>").attr("type", "file").attr("accept", "image/*");
				input.css("width", "0");
				input.css("height", "0");
				input.css("opacity", "0");
				body.append(input);
			
				let doUpload = function(useWebcam) {
					if (useWebcam) {
						return function() {
							let video = $("<video muted autoplay>");
							let canceled = {};
							getUserMediaCanceled = canceled;
							navigator.mediaDevices.getUserMedia({ video: true })
								.then(function (stream) {
									if (canceled.canceled) {
										return;
									}

									video[0].srcObject = stream;
									that._clear();
									faceButton.append(video);
									faceButton.append($("<div>").text("Click to accept").addClass("acceptButton"));
									layout.$.addClass("hoverLock");

									let track = stream.getTracks()[0];

									let close = function() {
										layout.$.removeClass("hoverLock");
										track.stop();
										that._update(null);
									};
									autoCloseTimeoutId = setTimeout(close, 5000);
									onClick(faceButton, function() {
										let size = track.getSettings();

										let canvas = $("<canvas>")[0];
										let ctx = canvas.getContext("2d");
										canvas.width = 150;
										canvas.height = canvas.width * size.height / size.width;
										ctx.drawImage(video[0], 0, 0, size.width, size.height, 0, 0, canvas.width, canvas.height);

										let resizedFace = canvas.toDataURL("image/jpeg");

										close();
										delayedCallback(resizedFace);
									});
								})
								.catch(function (e) {
									if (canceled.canceled) {
										return;
									}

									console.log(e);
								});
						};
					} else {
						return function() {
							if (!input[0].files[0]) {
								input.click();
								return;
							}
							let reader = new FileReader();
							let canceled = {};
							getUserMediaCanceled = canceled;
							reader.readAsDataURL(input[0].files[0]);
							reader.onload = function () {
								if (canceled.canceled) {
									return;
								}

								input.val("");
								let uploadedFace = reader.result;
								let canceled = {};
								getUserMediaCanceled = canceled;
								resize(uploadedFace, function(resizedFace) {
									if (canceled.canceled) {
										return;
									}

									delayedCallback(resizedFace);
								});
							};
							reader.onerror = function (error) {
								if (canceled.canceled) {
									return;
								}

								input.val("");
								console.log("Error: ", error);
							};
						}
					}
				};

				input.change(doUpload(false));
				createButton("Upload", doUpload(false));
				createButton("Webcam", doUpload(true));
			}
		};
	}

	update(face) {
		this._clear();
		this._layout.$.addClass("disabled");
		if (this._delayedTimeoutId !== null) {
			clearTimeout(this._delayedTimeoutId);
		}
		let that = this;
		this._delayedTimeoutId = setTimeout(function() {
			that._layout.$.removeClass("disabled");
			that._update(face);
		}, FaceChangeButton._delay);
	}

	destroy() {
		this._clear();
		this._layout.$.remove();
	}
}

FaceChangeButton._delay = 500;
*/
}

FaceChangeButton._size = 150;

FaceChangeButton.webcam = function (callback) {
  let acquire = VideoIcon._acquire("video");
  acquire.acquire(function (acquireId, stream) {
    if (stream === null || stream._dead) {
      callback(null);
      return;
    }

    let video = $("<video muted autoplay playsinline>");
    video.css({ position: "absolute", top: "0", left: "0", opacity: "0" });
    // $("body").append(video);
    video[0].srcObject = stream;
    let size = stream._size;

    setTimeout(function () {
      let canvas = $("<canvas>")[0];
      let ctx = canvas.getContext("2d");
      canvas.width = FaceChangeButton._size;
      canvas.height = (canvas.width * size.height) / size.width;
      ctx.drawImage(
        video[0],
        0,
        0,
        size.width,
        size.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      let resizedFace = canvas.toDataURL("image/jpeg");

      acquire.stop(acquireId);

      // video.remove();
      callback(resizedFace);
    }, 1000);
  });
};

FaceChangeButton.folder = function (callback) {
  ImageUtils.toUrl(
    ImageUtils.toCanvas(
      ImageUtils.fromBlob(UploadUtils.fromComputer("image/*")),
      ImageUtils.limit(
        ImageUtils.identity(),
        FaceChangeButton._size,
        FaceChangeButton._size
      )
    )
  )
    .res(callback)
    .run();
};

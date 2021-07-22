export class VideoIcon {
  /**
   * creates a new VideoIcon in a Layout for a given Game
   * @param {Layout} layout
   * @param {Game} game
   * @param type
   */
  constructor(layout, game, type) {
    this._imgContainer = $("<div>")
      .addClass("face")
      .addClass(type + "Face");
    layout.set(this._imgContainer);

    this.type = type;

    this._layout = layout;
    this._game = game;

    this.$ = layout.$;
    this._face = null;

    this.liveId = null;

    this._promiseCanceled = null;

    this._acquiredId = null;

    this._userMuted = false;
    //%% this._registerTimeoutId = null;
  }

  /**
   * updates the current video icon
   * @param o
   * @param liveId
   */
  update(o, liveId) {
    let face = o === null ? null : this.type === "video" ? o.video : o.audio;

    if (this._face === face && this.liveId === liveId) {
      return;
    }

    let that = this;

    this.liveId = liveId;
    this._imgContainer.empty();
    this._face = face;

    if (this._promiseCanceled !== null) {
      this._promiseCanceled.canceled = true;
      this._promiseCanceled = null;
    }

    let acquire = VideoIcon._acquire(this.type);

    if (this._acquiredId !== null) {
      acquire.stop(this._acquiredId);
      this._acquiredId = null;
    }

    this._doMute = function (_flag) {};

    VideoIcon._globalUnregister(this);
    this._imgContainer
      .removeClass("active")
      .removeClass("muted")
      .removeClass("dead");

    if (this._face !== null) {
      if (liveId === this._game.thisLiveId) {
        let localVideo = $("<" + that.type + " muted autoplay playsinline>");
        if (this.type === "video") {
          localVideo.css({ transform: "scale(-1, 1)" }); // scale to mirror it
        }
        if (!this._face._dead) {
          localVideo[0].srcObject = this._face;
        }
        this._imgContainer.append(localVideo).addClass("active");

        if (this._face._dead) {
          let promiseCanceled = {};
          this._promiseCanceled = promiseCanceled;
          acquire.acquire(function (id, localStream) {
            if (promiseCanceled.canceled) {
              acquire.stop(id);
              return;
            }

            that._acquiredId = id;

            if (localStream._dead) {
              that._game.logManager.log(
                "No " + that.type + " device available"
              );
              that._imgContainer.addClass("dead");

              if (!that._face._dead) {
                that._face = localStream;
                that._game.friendFaces.videoUpdateThisFace(
                  that.type,
                  localStream
                );
              }
            } else {
              that._imgContainer.removeClass("dead");

              that._face = localStream;

              localVideo[0].srcObject = that._face;
              localVideo[0]._srcObject = that._face; // Fix preparation

              that._game.friendFaces.videoUpdateThisFace(
                that.type,
                localStream
              );
            }

            //TODO that._face.onend => _dead, videoUpdateThisFace
          });
        }
      } else {
        let remoteVideo = $("<" + this.type + " muted autoplay playsinline>");
        if (!this._face._dead) {
          remoteVideo[0].srcObject = this._face;
          remoteVideo[0]._srcObject = this._face; // Fix preparation
        }
        this._imgContainer.append(remoteVideo).addClass("active");

        this._doMute = function (flag) {
          remoteVideo[0].muted = flag;
          VideoIcon._fixAudio();
          if (!flag) {
            that._imgContainer.removeClass("muted");
          } else {
            that._imgContainer.addClass("muted");
          }
        };

        VideoIcon._globalRegister(this);
      }
    }
  }

  /**
   * destroys current video icon
   */
  destroy() {
    let acquire = VideoIcon._acquire(this.type);

    if (this._acquiredId !== null) {
      acquire.stop(this._acquiredId);
      this._acquiredId = null;
    }
    this._face = null;

    /*%%%
                // iOS fix
                this._imgContainer.children(this.type).each(function(_, d) {
                    d.pause();
                    d.src = "";
                });
        */

    this._imgContainer.empty();

    if (this._promiseCanceled !== null) {
      this._promiseCanceled.canceled = true;
      this._promiseCanceled = null;
    }

    VideoIcon._globalUnregister(this);
  }
}

VideoIcon._fixAudio = function () {
  $("audio").each(function (_, div) {
    if (div._srcObject !== undefined) {
      div.srcObject = div._srcObject;
    }
  });
};

VideoIcon._muted = true;
VideoIcon._registered = [];
VideoIcon._globalRegister = function (icon) {
  if (!(icon in VideoIcon._registered)) {
    VideoIcon._registered.push(icon);
  }

  icon._doMute(VideoIcon._muted || icon._userMuted);

  if (icon._registerTimeoutId !== null) {
    clearTimeout(icon._registerTimeoutId);
    icon._registerTimeoutId = null;
  }
  icon._imgContainer.off();

  if (!VideoIcon._muted) {
    icon._registerTimeoutId = setTimeout(function () {
      UserInteraction.get().click(icon._imgContainer, function () {
        icon._userMuted = !icon._userMuted;
        icon._doMute(icon._userMuted);
      });
    }, 0);
  }
};
VideoIcon._globalUnregister = function (icon) {
  delete VideoIcon._registered.icon;

  if (icon._registerTimeoutId !== null) {
    clearTimeout(icon._registerTimeoutId);
    icon._registerTimeoutId = null;
  }
  icon._imgContainer.off();
};
VideoIcon.unmute = function () {
  if (!VideoIcon._muted) {
    return;
  }
  VideoIcon._muted = false;
  for (const icon of VideoIcon._registered) {
    VideoIcon._globalRegister(icon);
  }
};

VideoIcon._acquires = {};
VideoIcon._acquire = function (type) {
  let acquire = VideoIcon._acquires[type];
  if (acquire === undefined) {
    acquire = {};
    VideoIcon._acquires[type] = acquire;

    let stopStream = function (stream) {
      if (stream.getTracks !== undefined) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      stream._dead = true;
    };

    acquire._current = {
      stream: null,
      getting: false,
      callback: null,
      get: function (callback) {
        let that = acquire._current;

        that.callback = callback;
        if (that.stream !== null) {
          let c = that.callback;
          that.callback = null;
          c(that.stream);
          return;
        }
        if (!that.getting) {
          that.getting = true;

          if (navigator.mediaDevices === undefined) {
            // Not on https
            console.log("No device available, are you on https?");

            that.getting = false;
            that.stream = null;

            if (that.callback === null) {
              return;
            }

            let c = that.callback;
            that.callback = null;
            c(null);
            return;
          }

          let err = function () {
            that.getting = false;
            that.stream = {};
            that.stream._dead = true;

            if (that.callback === null) {
              return;
            }

            let c = that.callback;
            that.callback = null;
            c(that.stream);
          };

          //TODO iOS navigator.mediaDevices.getUserMedia video stops audio
          //TODO iOS when acquire video, acquire again audio if previously acquired (f*ck iOS)
          navigator.mediaDevices
            .getUserMedia({
              video:
                type === "video"
                  ? {
                      width: 320,
                      height: 240,
                      facingMode: "user",
                    }
                  : false,
              audio: true,
            })
            .then(function (localStream) {
              if (localStream.getTracks === undefined) {
                stopStream(localStream);
                err();
                return;
              }

              if (type === "video") {
                let settings;
                try {
                  settings = localStream.getVideoTracks()[0].getSettings();
                } catch (ee) {
                  stopStream(localStream);
                  err();
                  return;
                }
                if (!settings.width || !settings.height) {
                  stopStream(localStream);
                  err();
                  return;
                }

                localStream._size = {
                  width: settings.width,
                  height: settings.height,
                };
              }

              localStream._dead = false;

              that.getting = false;
              that.stream = localStream;

              if (that.callback === null) {
                stopStream(that.stream);
                that.stream = null;
                return;
              }

              let c = that.callback;
              that.callback = null;
              c(that.stream);
            })
            .catch((e) => {
              console.log("Could not acquire " + type, e);
              err();
            });
        }
      },
      cancel: function () {
        let that = acquire._current;

        that.callback = null;
        if (that.stream !== null) {
          stopStream(that.stream);
          that.stream = null;
        }
      },
    };

    acquire._acquiring = {};
    acquire._nextId = 0;

    acquire.acquire = function (callback) {
      let id = acquire._nextId;
      acquire._nextId++;

      acquire._acquiring[id] = function (stream) {
        acquire._acquiring[id] = null;

        setTimeout(function () {
          callback(id, stream);
        }, 0);
      };

      acquire._current.get(function (stream) {
        for (const key in acquire._acquiring) {
          if (acquire._acquiring[key] !== null) {
            acquire._acquiring[key](stream);
          }
        }
      });
    };

    acquire.stop = function (id) {
      delete acquire._acquiring[id];

      if ($.isEmptyObject(acquire._acquiring)) {
        acquire._current.cancel();
      }
    };
  }
  return acquire;
};

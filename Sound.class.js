"use strict";

export class Sound {
  /**
   * Creates a new Sound from a given url
   * @param url
   */
  constructor(url) {
    this._url = url;
    this._audio = [];
    let that = this;
    for (let i = 0; i < 3; i++) {
      let a = new Audio(url);
      that._audio.push(a);
      a.load();
    }
    this._next = 0;
  }

  /**
   * plays the sound
   */
  play() {
    console.log("Playing sound " + this._url);

    if (Sound._muted) {
      return;
    }

    let i = this._next;
    this._next++;
    if (this._next == this._audio.length) {
      this._next = 0;
    }
    let a = this._audio[i];

    a.currentTime = 0;
    a.play();
  }

  /*	
      stop() {
          Utils.each(this._audio, function(a) {
              a.pause();
          });
      }
  */
}

Sound._muted = true;
Sound.unmute = function () {
  Sound._muted = false;
};

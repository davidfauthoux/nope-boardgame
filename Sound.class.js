"use strict";
import { Utils } from "../Utils.class.js";

export class Sound {
  constructor(url) {
    this._url = url;
    this._audio = [];
    var that = this;
    Utils.loop(0, 3, 1, function () {
      var a = new Audio(url);
      that._audio.push(a);
      a.load();
    });
    this._next = 0;
  }

  play() {
    console.log("Playing sound " + this._url);

    if (Sound._muted) {
      return;
    }

    var i = this._next;
    this._next++;
    if (this._next == this._audio.length) {
      this._next = 0;
    }
    var a = this._audio[i];

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

"use strict";

class CssComposition {
  constructor() {
    this._cssComposition = null;
    this._id = "cssComposition-" + CssComposition.nextId;
    CssComposition.nextId++;
  }

  css(cssText) {
    if (cssText === undefined) {
      return;
    }
    if (this._cssComposition === null) {
      this._cssComposition = "";
    }
    this._cssComposition += cssText + "\n";
  }

  clear() {
    $("link#" + this._id).remove();
  }

  finish() {
    this.clear();
    if (this._cssComposition !== null) {
      var div = $("<link>").attr("id", this._id);
      $("head").append(div);
      div.attr("rel", "stylesheet");
      div.attr("type", "text/css");
      div.addClass("generatedcss");
      console.log("Css composition: " + this._cssComposition);
      div.attr(
        "href",
        "data:text/css;charset=UTF-8," +
          encodeURIComponent(this._cssComposition)
      );
    }
  }
}

CssComposition.nextId = 0;

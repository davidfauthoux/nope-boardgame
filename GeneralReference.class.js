import { Sound } from "./Sound.class.js";
import { Utils } from "../Utils.class.js";

export class GeneralReference {
  constructor() {
    var that = this;

    this._sounds = {};

    this._properties = {};
    this._modifiers = {};
    this._referenced = {};

    this._build = function (kind) {
      var content = that._referenced[kind];
      Utils.each(
        GeneralReference.getGeneralKinds(kind),
        function (generalKind) {
          if (content !== undefined) {
            return;
          }
          var overridenContent = that._referenced[generalKind.kind];
          if (overridenContent !== undefined) {
            content = overridenContent;
          }
        }
      );
      if (content !== undefined) {
        return $(content).addClass("content");
      } else {
        return $("<div>").addClass("undefined").text(kind);
      }
    };

    this._getProperties = function (kind) {
      var content = that._properties[kind];
      Utils.each(
        GeneralReference.getGeneralKinds(kind),
        function (generalKind) {
          if (content !== undefined) {
            return;
          }
          var overridenContent = that._properties[generalKind.kind];
          if (overridenContent !== undefined) {
            content = overridenContent;
          }
        }
      );
      if (content !== undefined) {
        return content;
      } else {
        return {};
      }
    };
    this._getModifiers = function (kind) {
      var content = that._modifiers[kind];
      Utils.each(
        GeneralReference.getGeneralKinds(kind),
        function (generalKind) {
          if (content !== undefined) {
            return;
          }
          var overridenContent = that._modifiers[generalKind.kind];
          if (overridenContent !== undefined) {
            content = {};
            Utils.each(overridenContent, function (v, k) {
              content[k] = v === null ? generalKind.suffix : v; // null is a special value meaning 'this suffix'
            });
          }
        }
      );
      if (content !== undefined) {
        return content;
      } else {
        return {};
      }
    };

    this._setContent = function (kind, content) {
      if (content !== null) {
        that._referenced[kind] = content;
      }
    };
  }

  setContent(kind, content, properties, modifiers) {
    this._setContent(kind, content);
    this._modifiers[kind] = modifiers;
    this._properties[kind] = properties;
  }

  properties(kind) {
    return this._getProperties(kind);
  }
  modifiers(kind) {
    return this._getModifiers(kind);
  }

  build(kind) {
    return this._build(kind);
  }

  setSound(id, url) {
    this._sounds[id] = new Sound(url);
  }
  getSound(id) {
    return this._sounds[id] || null;
  }
}

GeneralReference.getGeneralKinds = function (kind) {
  var generalKinds = [];
  var ik = 0;
  while (true) {
    var k = kind.indexOf("-", ik);
    if (k < 0) {
      // No more general kind
      break;
    } else {
      var generalKind = kind.substring(0, k);
      var suffix = kind.substring(k + 1);
      generalKinds.push({
        kind: generalKind,
        suffix: suffix,
      });
    }
    ik = k + 1;
  }
  return generalKinds;
};

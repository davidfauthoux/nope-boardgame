import { Sound } from "./Sound.class.js";

export class GeneralReference {
  /**
   * creates the General Reference for kinds
   */
  constructor() {
    let that = this;

    this._sounds = {};

    this._properties = {};
    this._modifiers = {};
    this._referenced = {};

    this._build = function (kind) {
      let content = that._referenced[kind];
      for (const generalKind of GeneralReference.getGeneralKinds(kind)) {
        if (content !== undefined) {
          break;
        }
        let overridenContent = that._referenced[generalKind.kind];
        if (overridenContent !== undefined) {
          content = overridenContent;
        }
      }
      if (content !== undefined) {
        return $(content).addClass("content");
      } else {
        return $("<div>").addClass("undefined").text(kind);
      }
    };

    this._getProperties = function (kind) {
      let content = that._properties[kind];
      for (const generalKind of GeneralReference.getGeneralKinds(kind)) {
        if (content !== undefined) {
          break;
        }
        let overridenContent = that._properties[generalKind.kind];
        if (overridenContent !== undefined) {
          content = overridenContent;
        }
      }
      if (content !== undefined) {
        return content;
      } else {
        return {};
      }
    };
    this._getModifiers = function (kind) {
      let content = that._modifiers[kind];
      for (const generalKind of GeneralReference.getGeneralKinds(kind)) {
        if (content !== undefined) {
          break;
        }
        let overridenContent = that._modifiers[generalKind.kind];
        if (overridenContent !== undefined) {
          content = {};
          for (const k in overridenContent) {
            content[k] = overridenContent[k] === null ? generalKind.suffix : overridenContent[k]; // null is a special value meaning 'this suffix'

          }
        }
      }

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

  /**
   * Adds a kind to the referenced kinds
   * @param {string} kind
   * @param content
   * @param properties
   * @param modifiers
   */
  setContent(kind, content, properties, modifiers) {
    this._setContent(kind, content);
    this._modifiers[kind] = modifiers;
    this._properties[kind] = properties;
  }

  /**
   * search for properties of a kind
   * @param {string} kind
   * @returns {*|{}}
   */
  properties(kind) {
    return this._getProperties(kind);
  }

  /**
   * search for modifiers of a kind
   * @param {string} kind
   * @returns {*|{}}
   */
  modifiers(kind) {
    return this._getModifiers(kind);
  }

  /**
   * builds the given kind if referenced
   * @param {string} kind
   * @returns {*}
   */
  build(kind) {
    return this._build(kind);
  }

  /**
   * sets a new sound with an id and an url
   * @param id
   * @param url
   */
  setSound(id, url) {
    this._sounds[id] = new Sound(url);
  }

  /**
   * get the sound from it's id
   * @param id
   * @returns {null}
   */
  getSound(id) {
    return this._sounds[id] || null;
  }
}

/**
 * gets the General kind of specified kind
 * @param kind
 * @returns {*[]}
 */
GeneralReference.getGeneralKinds = function (kind) {
  let generalKinds = [];
  let ik = 0;
  while (true) {
    let k = kind.indexOf("-", ik);
    if (k < 0) {
      // No more general kind
      break;
    } else {
      let generalKind = kind.substring(0, k);
      let suffix = kind.substring(k + 1);
      generalKinds.push({
        kind: generalKind,
        suffix: suffix,
      });
    }
    ik = k + 1;
  }
  return generalKinds;
};

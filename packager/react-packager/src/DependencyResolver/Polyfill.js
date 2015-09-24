'use strict';

const Promise = require('promise');
const Module = require('./Module');

class Polyfill extends Module {
  constructor({ path, id, dependencies }) {
    super(path);
    this._id = id;
    this._dependencies = dependencies;
  }

  isHaste() {
    return Promise.resolve(false);
  }

  getName() {
    return Promise.resolve(this._id);
  }

  getPackage() {
    return null;
  }

  getDependencies() {
    return Promise.resolve(this._dependencies);
  }

  isJSON() {
    return false;
  }

  isPolyfill() {
    return true;
  }
}

module.exports = Polyfill;

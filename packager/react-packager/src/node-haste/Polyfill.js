'use strict';

const Module = require('./Module');

class Polyfill extends Module {
  constructor(options) {
    super(options);
    this._id = options.id;
    this._dependencies = options.dependencies;
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

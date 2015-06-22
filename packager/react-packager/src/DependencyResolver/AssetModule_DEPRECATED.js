'use strict';

const Module = require('./Module');
const Promise = require('promise');
const getAssetDataFromName = require('../lib/getAssetDataFromName');

class AssetModule_DEPRECATED extends Module {
  isHaste() {
    return Promise.resolve(false);
  }

  getName() {
    return Promise.resolve(this.name);
  }

  getDependencies() {
    return Promise.resolve([]);
  }

  getPlainObject() {
    const {name, resolution} = getAssetDataFromName(this.path);

    return Promise.resolve(this.addReference({
      path: this.path,
      id: `image!${name}`,
      resolution,
      isAsset_DEPRECATED: true,
      dependencies: [],
      isJSON: false,
      isPolyfill: false,
      isAsset: false,
    }));
  }

  hash() {
    return `AssetModule_DEPRECATED : ${this.path}`;
  }
}

module.exports = AssetModule_DEPRECATED;

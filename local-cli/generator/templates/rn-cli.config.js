'use strict';

var blacklist = require('./node_modules/react-native/packager/blacklist');

var config = {
  getProjectRoots() {
    return this._getRoots();
  },

  getAssetRoots() {
    return this._getRoots();
  },

  getBlacklistRE() {
    return blacklist('');
  },

  getTransformModulePath() {
    return require.resolve('./node_modules/react-native/packager/transformer');
  },

  _getRoots() {
    return [__dirname];
  }
};

module.exports = config;

'use strict';

var blacklist = require('./node_modules/react-native/packager/blacklist');

var config = {
  getProjectRoots() {
    return [__dirname];
  },

  getAssetRoots() {
    // speficy where to look for assets
    return [];
  },

  getBlacklistRE(platform) {
    return blacklist(platform);
  }
};

module.exports = config;

'use strict';

var blacklist = require('./node_modules/react-native/packager/blacklist');

var config = {
  getProjectRoots() {
    return [__dirname];
  },

  getAssetRoots() {
    // Speficy where to look for assets that are referenced using `image!<image_name>`.
    // Asset directories for images referenced using `./<image.extension>` don't require 
    // any entry in here.
    return [];
  },

  getBlacklistRE(platform) {
    return blacklist(platform);
  }
};

module.exports = config;

'use strict';

var blacklist = require('../packager/blacklist');
var path = require('path');
var os = require('os');

/**
 * Default configuration for the CLI.
 *
 * If you need to override any of this functions do so by defining the file
 * `rn-cli.config.js` on the root of your project with the functions you need
 * to tweak.
 */
var config = {
  getProjectRoots() {
    return getRoots();
  },

  /**
   * Specify where to look for assets that are referenced using
   * `image!<image_name>`. Asset directories for images referenced using
   * `./<image.extension>` don't require any entry in here.
   */
  getAssetRoots() {
    return getRoots();
  },

  /**
   * Returns a regular expression for modules that should be ignored by the
   * packager on a given platform.
   */
  getBlacklistRE(platform) {
    return blacklist(platform);
  }
};

function getRoots() {
  var root = process.env.REACT_NATIVE_APP_ROOT;
  if (root) {
    return [path.resolve(root)];
  }
  var dirname = __dirname;
  // Temporary workaround for case sensitivity. See: https://github.com/ReactWindows/react-native/issues/221
  if (os.platform() === 'win32') {
    dirname = __dirname.replace(__dirname.substr(0,1),__dirname.substr(0,1).toLowerCase());
  }
  if (dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli$/)) {
    // Packager is running from node_modules.
    // This is the default case for all projects created using 'react-native init'.
    return [path.resolve(dirname, '../../..')];
  } else if (dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
     // React Native was installed using CocoaPods.
    return [path.resolve(dirname, '../../..')];
  } else {
    return [path.resolve(dirname, '..')];
  }
}

module.exports = config;

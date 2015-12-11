 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');

class DependencyGraphHelpers {
  constructor({ providesModuleNodeModules, assetExts }) {
    this._providesModuleNodeModules = providesModuleNodeModules;
    this._assetExts = assetExts;
  }

  isNodeModulesDir(file) {
    let parts = path.normalize(file).split(path.sep);
    const indexOfNodeModules = parts.lastIndexOf('node_modules');

    if (indexOfNodeModules === -1) {
      return false;
    }

    parts = parts.slice(indexOfNodeModules + 1);

    const dirs = this._providesModuleNodeModules;

    for (let i = 0; i < dirs.length; i++) {
      if (parts.indexOf(dirs[i]) > -1) {
        return false;
      }
    }

    return true;
  }

  isAssetFile(file) {
    return this._assetExts.indexOf(this.extname(file)) !== -1;
  }

  extname(name) {
    return path.extname(name).replace(/^\./, '');
  }
}

module.exports = DependencyGraphHelpers;

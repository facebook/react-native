/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs-extra');
const path = require('path');
const groupFilesByType = require('../groupFilesByType');

/**
 * Copies each file from an array of assets provided to targetPath directory
 *
 * The final path is based on the type of the asset: 
 * - Fonts (otf, ttf) - copied to targetPath/fonts under original name
 * - Others - copied to targetPath under original name
 */
module.exports = function unlinkAssetsAndroid(files, project) {
  const assets = groupFilesByType(files);

  for (const type in assets) {
    if (type === 'font') {
      assets[type].forEach(file => {
        const filePath = path.join(project.assetsPath, 'fonts', path.basename(file));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      })
    } else {
      assets[type].forEach(file => {
        const filePath = path.join(project.assetsPath, path.basename(file));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      })
    }
  }
};

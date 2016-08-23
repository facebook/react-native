const fs = require('fs-extra');
const path = require('path');
const groupFilesByType = require('../groupFilesByType');

/**
 * Copies each file from an array of assets provided to targetPath directory
 *
 * For now, the only types of files that are handled are:
 * - Fonts (otf, ttf) - copied to targetPath/fonts under original name
 */
module.exports = function copyAssetsAndroid(files, targetPath) {
  const assets = groupFilesByType(files);

  (assets.font || []).forEach(asset =>
    fs.copySync(asset, path.join(targetPath, 'fonts', path.basename(asset)))
  );
};

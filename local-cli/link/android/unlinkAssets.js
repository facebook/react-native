const fs = require('fs-extra');
const path = require('path');
const groupFilesByType = require('../groupFilesByType');

/**
 * Copies each file from an array of assets provided to targetPath directory
 *
 * For now, the only types of files that are handled are:
 * - Fonts (otf, ttf) - copied to targetPath/fonts under original name
 */
module.exports = function unlinkAssetsAndroid(files, project) {
  const assets = groupFilesByType(files);

  (assets.font || []).forEach((file) => {
    const filePath = path.join(project.assetsPath, 'fonts', path.basename(file));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

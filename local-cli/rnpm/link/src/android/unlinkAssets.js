const fs = require('fs-extra');
const path = require('path');
const groupFilesByType = require('../groupFilesByType');

/**
 * Copies each file from an array of assets provided to targetPath directory
 *
 * For now, the only types of files that are handled are:
 * - Fonts (otf, ttf) - copied to targetPath/fonts under original name
 */
module.exports = function unlinkAssetsAndroid(files, targetPath) {
  const grouped = groupFilesByType(files);

  grouped.font.forEach((file) => {
    const filename = path.basename(file);
    if (fs.existsSync(filename)) {
      fs.unlinkSync(path.join(targetPath, 'fonts', filename));
    }
  });
};

const glob = require('glob');
const path = require('path');

const findAssetsInFolder = (folder) =>
  glob.sync(path.join(folder, '**'), { nodir: true });

/**
 * Given an array of assets folders, e.g. ['Fonts', 'Images'],
 * it globs in them to find all files that can be copied.
 *
 * It returns an array of absolute paths to files found.
 */
module.exports = function findAssets(folder, assets) {
  return (assets || [])
    .map(assetsFolder => path.join(folder, assetsFolder))
    .reduce((assets, assetsFolder) =>
      assets.concat(findAssetsInFolder(assetsFolder)),
      []
    );
};

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const glob = require('glob');
const path = require('path');

const findAssetsInFolder = folder =>
  glob.sync(path.join(folder, '**'), {nodir: true});

/**
 * Given an array of assets folders, e.g. ['Fonts', 'Images'],
 * it globs in them to find all files that can be copied.
 *
 * It returns an array of absolute paths to files found.
 */
module.exports = function findAssets(folder, assets) {
  return (assets || [])
    .map(assetsFolder => path.join(folder, assetsFolder))
    .reduce(
      (_assets, assetsFolder) =>
        _assets.concat(findAssetsInFolder(assetsFolder)),
      [],
    );
};

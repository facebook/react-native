/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const AssetPaths = require('./lib/AssetPaths');
const MapWithDefaults = require('./lib/MapWithDefaults');

import type {AssetData} from './lib/AssetPaths';

type Options = {|
  /**
   * Files that don't match these extensions are discarded. Assets always need
   * an extension.
   */
  +assetExtensions: Set<string>,
  /**
   * This should return all the files of the specified directory.
   */
  +getDirFiles: (dirPath: string) => $ReadOnlyArray<string>,
  /**
   * All the valid platforms so as to support platform extensions, ex.
   * `foo.ios.png`. A platform that's no in this set will be considered part of
   * the asset name. Ex. `foo.smth.png`, if `smth` is not a valid platform, will
   * be resolved by its full name `foo.smth.png`.
   */
  +platforms: Set<string>,
|};

type AssetInfo = {|platform: ?string, fileName: string|};
type InfoByAssetName = Map<string, Array<AssetInfo>>;

const EMPTY_ARRAY = [];

/**
 * Lazily build an index of assets for the directories in which we're looking
 * for specific assets. For example if we're looking for `foo.png` in a `bar`
 * directory, we'll look at all the files there and identify all the assets
 * related to `foo.png`, for example `foo@2x.png` and `foo.ios.png`.
 */
class AssetResolutionCache {
  _assetsByDirPath: MapWithDefaults<string, InfoByAssetName>;
  _opts: Options;

  constructor(options: Options) {
    this._assetsByDirPath = new MapWithDefaults(this._findAssets);
    this._opts = options;
  }

  /**
   * The cache needs to be emptied if any file changes. This could be made more
   * selective if performance demands it: for example, we could clear
   * exclusively the directories in which files have changed. But that'd be
   * more error-prone.
   */
  clear() {
    this._assetsByDirPath.clear();
  }

  /**
   * Get the file paths of all the variants (resolutions, platforms, etc.) of a
   * particular asset name, only looking at a specific directory. If needed this
   * function could be changed to return pre-parsed information about the assets
   * such as the resolution.
   */
  resolve(
    dirPath: string,
    assetName: string,
    platform: ?string,
  ): $ReadOnlyArray<string> {
    const results = this._assetsByDirPath.get(dirPath);
    const assets = results.get(assetName);
    if (assets == null) {
      return EMPTY_ARRAY;
    }
    return assets
      .filter(asset => asset.platform == null || asset.platform === platform)
      .map(asset => asset.fileName);
  }

  /**
   * Build an index of assets for a particular directory. Several file can
   * fulfill a single asset name, for example the different resolutions or
   * platforms: ex. `foo.png` could contain `foo@2x.png`, `foo.ios.js`, etc.
   */
  _findAssets = (dirPath: string) => {
    const results = new Map();
    const fileNames = this._opts.getDirFiles(dirPath);
    for (let i = 0; i < fileNames.length; ++i) {
      const fileName = fileNames[i];
      const assetData = AssetPaths.tryParse(fileName, this._opts.platforms);
      if (assetData == null || !this._isValidAsset(assetData)) {
        continue;
      }
      getWithDefaultArray(results, assetData.assetName).push({
        platform: assetData.platform,
        fileName,
      });
    }
    return results;
  };

  _isValidAsset(assetData: AssetData): boolean {
    return this._opts.assetExtensions.has(assetData.type);
  }
}

/**
 * Used instead of `MapWithDefaults` so that we don't create empty arrays
 * anymore once the index is built.
 */
function getWithDefaultArray<TK, TV>(
  map: Map<TK, Array<TV>>,
  key: TK,
): Array<TV> {
  let el = map.get(key);
  if (el != null) {
    return el;
  }
  el = [];
  map.set(key, el);
  return el;
}

module.exports = AssetResolutionCache;

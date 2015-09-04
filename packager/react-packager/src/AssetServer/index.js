/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Promise = require('promise');

const crypto = require('crypto');
const declareOpts = require('../lib/declareOpts');
const fs = require('fs');
const getAssetDataFromName = require('../lib/getAssetDataFromName');
const path = require('path');

const stat = Promise.denodeify(fs.stat);
const readDir = Promise.denodeify(fs.readdir);
const readFile = Promise.denodeify(fs.readFile);

const validateOpts = declareOpts({
  projectRoots: {
    type: 'array',
    required: true,
  },
  assetExts: {
    type: 'array',
    required: true,
  },
});

class AssetServer {
  constructor(options) {
    const opts = validateOpts(options);
    this._roots = opts.projectRoots;
    this._assetExts = opts.assetExts;
  }

  get(assetPath, platform = null) {
    const assetData = getAssetDataFromName(assetPath);
    return this._getAssetRecord(assetPath, platform).then(record => {
      for (let i = 0; i < record.scales.length; i++) {
        if (record.scales[i] >= assetData.resolution) {
          return readFile(record.files[i]);
        }
      }

      return readFile(record.files[record.files.length - 1]);
    });
  }

  getAssetData(assetPath) {
    const nameData = getAssetDataFromName(assetPath);
    const data = {
      name: nameData.name,
      type: nameData.type,
    };

    return this._getAssetRecord(assetPath).then(record => {
      data.scales = record.scales;

      return Promise.all(
        record.files.map(file => stat(file))
      );
    }).then(stats => {
      const hash = crypto.createHash('md5');

      stats.forEach(fstat =>
        hash.update(fstat.mtime.getTime().toString())
      );

      data.hash = hash.digest('hex');
      return data;
    });
  }

  /**
   * Given a request for an image by path. That could contain a resolution
   * postfix, we need to find that image (or the closest one to it's resolution)
   * in one of the project roots:
   *
   * 1. We first parse the directory of the asset
   * 2. We check to find a matching directory in one of the project roots
   * 3. We then build a map of all assets and their scales in this directory
   * 4. Then try to pick platform-specific asset records
   * 5. Then pick the closest resolution (rounding up) to the requested one
   */
  _getAssetRecord(assetPath, platform = null) {
    const filename = path.basename(assetPath);

    return (
      this._findRoot(
        this._roots,
        path.dirname(assetPath)
      )
      .then(dir => Promise.all([
        dir,
        readDir(dir),
      ]))
      .then(res => {
        const dir = res[0];
        const files = res[1];
        const assetData = getAssetDataFromName(filename);

        const map = this._buildAssetMap(dir, files, platform);

        let record;
        if (platform != null){
          record = map[getAssetKey(assetData.assetName, platform)] ||
                   map[assetData.assetName];
        } else {
          record = map[assetData.assetName];
        }

        if (!record) {
          throw new Error(
            `Asset not found: ${assetPath} for platform: ${platform}`
          );
        }

        return record;
      })
    );
  }

  _findRoot(roots, dir) {
    return Promise.all(
      roots.map(root => {
        const absPath = path.join(root, dir);
        return stat(absPath).then(fstat => {
          return {path: absPath, isDirectory: fstat.isDirectory()};
        }, err => {
          return {path: absPath, isDirectory: false};
        });
      })
    ).then(stats => {
      for (let i = 0; i < stats.length; i++) {
        if (stats[i].isDirectory) {
          return stats[i].path;
        }
      }
      throw new Error('Could not find any directories');
    });
  }

  _buildAssetMap(dir, files) {
    const assets = files.map(getAssetDataFromName);
    const map = Object.create(null);
    assets.forEach(function(asset, i) {
      const file = files[i];
      const assetKey = getAssetKey(asset.assetName, asset.platform);
      let record = map[assetKey];
      if (!record) {
        record = map[assetKey] = {
          scales: [],
          files: [],
        };
      }

      let insertIndex;
      const length = record.scales.length;

      for (insertIndex = 0; insertIndex < length; insertIndex++) {
        if (asset.resolution <  record.scales[insertIndex]) {
          break;
        }
      }
      record.scales.splice(insertIndex, 0, asset.resolution);
      record.files.splice(insertIndex, 0, path.join(dir, file));
    });

    return map;
  }
}

function getAssetKey(assetName, platform) {
  if (platform != null) {
    return `${assetName} : ${platform}`;
  } else {
    return assetName;
  }
}

module.exports = AssetServer;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const crypto = require('crypto');
const declareOpts = require('../lib/declareOpts');
const denodeify = require('denodeify');
const fs = require('fs');
const getAssetDataFromName = require('../node-haste').getAssetDataFromName;
const path = require('path');

const createTimeoutPromise = (timeout) => new Promise((resolve, reject) => {
  setTimeout(reject, timeout, 'fs operation timeout');
});
function timeoutableDenodeify(fsFunc, timeout) {
  return function raceWrapper(...args) {
    return Promise.race([
      createTimeoutPromise(timeout),
      denodeify(fsFunc).apply(this, args)
    ]);
  };
}

const FS_OP_TIMEOUT = parseInt(process.env.REACT_NATIVE_FSOP_TIMEOUT, 10) || 15000;

const stat = timeoutableDenodeify(fs.stat, FS_OP_TIMEOUT);
const readDir = timeoutableDenodeify(fs.readdir, FS_OP_TIMEOUT);
const readFile = timeoutableDenodeify(fs.readFile, FS_OP_TIMEOUT);

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
    this._hashes = new Map();
    this._files = new Map();
  }

  get(assetPath, platform = null) {
    const assetData = getAssetDataFromName(assetPath, new Set([platform]));
    return this._getAssetRecord(assetPath, platform).then(record => {
      for (let i = 0; i < record.scales.length; i++) {
        if (record.scales[i] >= assetData.resolution) {
          return readFile(record.files[i]);
        }
      }

      return readFile(record.files[record.files.length - 1]);
    });
  }

  getAssetData(assetPath, platform = null) {
    const nameData = getAssetDataFromName(assetPath, new Set([platform]));
    const data = {
      name: nameData.name,
      type: nameData.type,
    };

    return this._getAssetRecord(assetPath, platform).then(record => {
      data.scales = record.scales;
      data.files = record.files;

      if (this._hashes.has(assetPath)) {
        data.hash = this._hashes.get(assetPath);
        return data;
      }

      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        hashFiles(data.files.slice(), hash, error => {
          if (error) {
            reject(error);
          } else {
            data.hash = hash.digest('hex');
            this._hashes.set(assetPath, data.hash);
            data.files.forEach(f => this._files.set(f, assetPath));
            resolve(data);
          }
        });
      });
    });
  }

  onFileChange(type, filePath) {
    this._hashes.delete(this._files.get(filePath));
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
        path.dirname(assetPath),
        assetPath,
      )
      .then(dir => Promise.all([
        dir,
        readDir(dir),
      ]))
      .then(res => {
        const dir = res[0];
        const files = res[1];
        const assetData = getAssetDataFromName(filename, new Set([platform]));

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

  _findRoot(roots, dir, debugInfoFile) {
    return Promise.all(
      roots.map(root => {
        const absRoot = path.resolve(root);
        // important: we want to resolve root + dir
        // to ensure the requested path doesn't traverse beyond root
        const absPath = path.resolve(root, dir);
        return stat(absPath).then(fstat => {
          // keep asset requests from traversing files
          // up from the root (e.g. ../../../etc/hosts)
          if (!absPath.startsWith(absRoot)) {
            return {path: absPath, isValid: false};
          }
          return {path: absPath, isValid: fstat.isDirectory()};
        }, _ => {
          return {path: absPath, isValid: false};
        });
      })
    ).then(stats => {
      for (let i = 0; i < stats.length; i++) {
        if (stats[i].isValid) {
          return stats[i].path;
        }
      }

      const rootsString = roots.map(s => `'${s}'`).join(', ');
      throw new Error(
        `'${debugInfoFile}' could not be found, because '${dir}' is not a ` +
        `subdirectory of any of the roots  (${rootsString})`,
      );
    });
  }

  _buildAssetMap(dir, files, platform) {
    const assets = files.map(this._getAssetDataFromName.bind(this, new Set([platform])));
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

  _getAssetDataFromName(platform, file) {
    return getAssetDataFromName(file, platform);
  }
}

function getAssetKey(assetName, platform) {
  if (platform != null) {
    return `${assetName} : ${platform}`;
  } else {
    return assetName;
  }
}

function hashFiles(files, hash, callback) {
  if (!files.length) {
    callback(null);
    return;
  }

  fs.createReadStream(files.shift())
    .on('data', data => hash.update(data))
    .once('end', () => hashFiles(files, hash, callback))
    .once('error', error => callback(error));
}

module.exports = AssetServer;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const filterPlatformAssetScales = require('./filterPlatformAssetScales');
const fs = require('fs');
const getAssetDestPathAndroid = require('./getAssetDestPathAndroid');
const getAssetDestPathIOS = require('./getAssetDestPathIOS');
const log = require('../util/log').out('bundle');
const mkdirp = require('mkdirp');
const path = require('path');

function saveAssets(
  assets,
  platform,
  assetsDest
) {
  if (!assetsDest) {
    console.warn('Assets destination folder is not set, skipping...');
    return Promise.resolve();
  }

  const getAssetDestPath = platform === 'android'
    ? getAssetDestPathAndroid
    : getAssetDestPathIOS;

  const filesToCopy = Object.create(null); // Map src -> dest
  assets
    .forEach(asset => {
      const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));
      asset.scales.forEach((scale, idx) => {
        if (!validScales.has(scale)) {
          return;
        }
        const src = asset.files[idx];
        const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
        filesToCopy[src] = dest;
      });
    });

  return copyAll(filesToCopy);
}

function copyAll(filesToCopy) {
  const queue = Object.keys(filesToCopy);
  if (queue.length === 0) {
    return Promise.resolve();
  }

  log('Copying ' + queue.length + ' asset files');
  return new Promise((resolve, reject) => {
    const copyNext = (error) => {
      if (error) {
        return reject(error);
      }
      if (queue.length === 0) {
        log('Done copying assets');
        resolve();
      } else {
        const src = queue.shift();
        const dest = filesToCopy[src];
        copy(src, dest, copyNext);
      }
    };
    copyNext();
  });
}

function copy(src, dest, callback) {
  const destDir = path.dirname(dest);
  mkdirp(destDir, err => {
    if (err) {
      return callback(err);
    }
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', callback);
  });
}

module.exports = saveAssets;

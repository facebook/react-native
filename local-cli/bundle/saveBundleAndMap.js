/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const execFile = require('child_process').execFile;
const fs = require('fs');
const getAssetDestPathAndroid = require('./getAssetDestPathAndroid');
const getAssetDestPathIOS = require('./getAssetDestPathIOS');
const log = require('../util/log').out('bundle');
const path = require('path');
const sign = require('./sign');

function saveBundleAndMap(
  codeWithMap,
  platform,
  bundleOutput,
  encoding,
  sourcemapOutput,
  assetsDest
) {
  log('Writing bundle output to:', bundleOutput);
  fs.writeFileSync(bundleOutput, sign(codeWithMap.code), encoding);
  log('Done writing bundle output');

  if (sourcemapOutput) {
    log('Writing sourcemap output to:', sourcemapOutput);
    fs.writeFileSync(sourcemapOutput, codeWithMap.map);
    log('Done writing sourcemap output');
  }

  if (!assetsDest) {
    console.warn('Assets destination folder is not set, skipping...');
    return Promise.resolve();
  }

  const getAssetDestPath = platform === 'android'
    ? getAssetDestPathAndroid
    : getAssetDestPathIOS;

  const filesToCopy = Object.create(null); // Map src -> dest
  codeWithMap.assets
    .filter(asset => !asset.deprecated)
    .forEach(asset =>
      asset.scales.forEach((scale, idx) => {
        const src = asset.files[idx];
        const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
        filesToCopy[src] = dest;
      })
    );

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
  execFile('mkdir', ['-p', destDir], err => {
    if (err) {
      return callback(err);
    }
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', callback);
  });
}

module.exports = saveBundleAndMap;

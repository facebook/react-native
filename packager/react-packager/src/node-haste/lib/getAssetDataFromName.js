 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('../fastpath');
const {getPlatformExtension, getInfixExt} = require('./getExtensions');
const permute = require('./permutations');

function getAssetDataFromName(filename, platforms, infixExts) {
  const ext = path.extname(filename);
  const platformExt = getPlatformExtension(filename, platforms);
  const infixExt = getInfixExt(filename, infixExts);

  const resolutionPattern = {
    test: 'resolution',
    value: '(@([\\d\\.]+)x)?',
  };
  const permutations = permute([
    resolutionPattern,
    { test: platformExt, value: '(\\.' + platformExt + ')?' },
    { test: infixExt, value: '(\\.' + infixExt + ')?' },
  ].filter(addition => addition.test));

  for (let i = 0; i < permutations.length; ++i) {
    const permutation = permutations[i];
    let pattern = '';
    for (let j = 0; j < permutation.length; ++j) {
      pattern += permutation[j].value;
    }
    pattern += '\\' + ext + '$';
    const re = new RegExp(pattern);

    const resolutionIndex = permutation.indexOf(resolutionPattern);
    const match = filename.match(re);
    let resolution;

    if (!(match && match[resolutionIndex + 2])) {
      resolution = 1;
    } else {
      resolution = parseFloat(match[resolutionIndex + 2], 10);
      if (isNaN(resolution)) {
        resolution = 1;
      }
    }

    let assetName;
    if (match) {
      assetName = filename.replace(re, ext);
      return {
        resolution: resolution,
        assetName: assetName,
        type: ext.slice(1),
        name: path.basename(assetName, ext),
        platform: platformExt,
        infixExt: infixExt,
      };
    }
  }
  return {
    resolution: 1,
    assetName: filename,
    type: ext.slice(1),
    name: path.basename(filename, ext),
    platform: platformExt,
    infixExt: infixExt,
  };
}

module.exports = getAssetDataFromName;

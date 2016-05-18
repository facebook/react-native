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
const hash = require('./hash');
const writeFile = require('./writeFile');

function buildBundle(packagerClient, requestOptions) {
  return packagerClient.buildBundle(requestOptions);
}

function createCodeWithMap(bundle, dev) {
  return {
    code: bundle.getSource({dev}),
    map: JSON.stringify(bundle.getSourceMap({dev})),
  };
}

function saveBundleAndMap(bundle, options, log) {
  const {
    'bundle-output': bundleOutput,
    'bundle-encoding': encoding,
    dev,
    'sourcemap-output': sourcemapOutput,
  } = options;

  log('start');
  const codeWithMap = createCodeWithMap(bundle, dev);
  log('finish');

  log('Writing bundle output to:', bundleOutput);

  const code = hash.appendToString(codeWithMap.code, encoding);
  const writeBundle = writeFile(bundleOutput, code, encoding);
  writeBundle.then(() => log('Done writing bundle output'));

  if (sourcemapOutput) {
    log('Writing sourcemap output to:', sourcemapOutput);
    const writeMap = writeFile(sourcemapOutput, codeWithMap.map, null);
    writeMap.then(() => log('Done writing sourcemap output'));
    return Promise.all([writeBundle, writeMap]);
  } else {
    return writeBundle;
  }
}

exports.build = buildBundle;
exports.save = saveBundleAndMap;
exports.formatName = 'bundle';

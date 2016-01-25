/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const writeFile = require('./writeFile');

function buildPrepackBundle(packagerClient, requestOptions) {
  return packagerClient.buildPrepackBundle(requestOptions);
}

function savePrepackBundle(bundle, options, log) {
  const {
    'bundle-output': bundleOutput,
    'bridge-config': bridgeConfig,
  } = options;

  const result = bundle.build({
    batchedBridgeConfig: bridgeConfig
  });

  log('Writing prepack bundle output to:', bundleOutput);
  const writePrepackBundle = writeFile(bundleOutput, result, 'ucs-2');
  writePrepackBundle.then(() => log('Done writing prepack bundle output'));
  return writePrepackBundle;
}

exports.build = buildPrepackBundle;
exports.save = savePrepackBundle;

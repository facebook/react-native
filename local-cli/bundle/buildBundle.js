/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const log = require('../util/log').out('bundle');
const outputBundle = require('./output/bundle');
const path = require('path');
const Promise = require('promise');
const saveAssets = require('./saveAssets');
const Server = require('../../packager/react-packager/src/Server');

function saveBundle(output, bundle, args) {
  return Promise.resolve(
    output.save(bundle, args, log)
  ).then(() => bundle);
}

function buildBundle(args, config, output = outputBundle, packagerInstance) {
  return new Promise((resolve, reject) => {

    const options = {
      projectRoots: config.getProjectRoots(),
      assetRoots: config.getAssetRoots(),
      blacklistRE: config.getBlacklistRE(args.platform),
      getTransformOptionsModulePath: config.getTransformOptionsModulePath,
      transformModulePath: path.resolve(args.transformer),
      extraNodeModules: config.extraNodeModules,
      nonPersistent: true,
      resetCache: args['reset-cache'],
    };

    const requestOpts = {
      entryFile: args['entry-file'],
      sourceMapUrl: args['sourcemap-output'],
      dev: args.dev,
      minify: !args.dev,
      platform: args.platform,
    };

    // If a packager instance was not provided, then just create one for this
    // bundle command and close it down afterwards.
    var shouldClosePackager = false;
    if (!packagerInstance) {
      packagerInstance = new Server(options);
      shouldClosePackager = true;
    }

    const bundlePromise = output.build(packagerInstance, requestOpts)
      .then(bundle => {
        if (shouldClosePackager) {
          packagerInstance.end();
        }
        return saveBundle(output, bundle, args);
      });

    // Save the assets of the bundle
    const assets = bundlePromise
      .then(bundle => bundle.getAssets())
      .then(outputAssets => saveAssets(
        outputAssets,
        args.platform,
        args['assets-dest']
      ));

    // When we're done saving bundle output and the assets, we're done.
    resolve(assets);
  });
}

module.exports = buildBundle;

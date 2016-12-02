/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const log = require('../util/log').out('bundle');
const Server = require('../../packager/react-packager/src/Server');

const outputBundle = require('./output/bundle');
const path = require('path');
const saveAssets = require('./saveAssets');
const defaultAssetExts = require('../../packager/defaults').assetExts;

import type RequestOptions from './types.flow';

function saveBundle(output, bundle, args) {
  return Promise.resolve(
    output.save(bundle, args, log)
  ).then(() => bundle);
}

function buildBundle(args, config, output = outputBundle, packagerInstance) {
  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';

  const requestOpts: RequestOptions = {
    entryFile: args.entryFile,
    sourceMapUrl: args.sourcemapOutput && path.basename(args.sourcemapOutput),
    dev: args.dev,
    minify: !args.dev,
    platform: args.platform,
  };

  // If a packager instance was not provided, then just create one for this
  // bundle command and close it down afterwards.
  var shouldClosePackager = false;
  if (!packagerInstance) {
    const assetExts = (config.getAssetExts && config.getAssetExts()) || [];

    const transformModulePath =
      args.transformer ? path.resolve(args.transformer) :
      typeof config.getTransformModulePath === 'function' ? config.getTransformModulePath() :
      undefined;

    const options = {
      projectRoots: config.getProjectRoots(),
      assetExts: defaultAssetExts.concat(assetExts),
      blacklistRE: config.getBlacklistRE(),
      getTransformOptions: config.getTransformOptions,
      transformModulePath: transformModulePath,
      extraNodeModules: config.extraNodeModules,
      resetCache: args.resetCache,
      watch: false,
    };

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
      args.assetsDest,
    ));

  // When we're done saving bundle output and the assets, we're done.
  return assets;
}

module.exports = buildBundle;

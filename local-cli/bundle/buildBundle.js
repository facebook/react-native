/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const log = require('../util/log').out('bundle');
const Server = require('metro-bundler/build/Server');
const Terminal = require('metro-bundler/build/lib/TerminalClass');
const TerminalReporter = require('metro-bundler/build/lib/TerminalReporter');
const TransformCaching = require('metro-bundler/build/lib/TransformCaching');

const outputBundle = require('metro-bundler/build/shared/output/bundle');
const path = require('path');
const saveAssets = require('./saveAssets');
const defaultAssetExts = require('metro-bundler/build/defaults').assetExts;
const defaultSourceExts = require('metro-bundler/build/defaults').sourceExts;
const defaultPlatforms = require('metro-bundler/build/defaults').platforms;
const defaultProvidesModuleNodeModules = require('metro-bundler/build/defaults').providesModuleNodeModules;

import type {RequestOptions, OutputOptions} from './types.flow';
import type {ConfigT} from '../util/Config';

function saveBundle(output, bundle, args) {
  return Promise.resolve(
    output.save(bundle, args, log)
  ).then(() => bundle);
}

function buildBundle(
  args: OutputOptions & {
    assetsDest: mixed,
    entryFile: string,
    resetCache: boolean,
    transformer: string,
  },
  config: ConfigT,
  output = outputBundle,
  packagerInstance,
) {
  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';

  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const requestOpts: RequestOptions = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: !args.dev,
    platform: args.platform,
  };

  // If a packager instance was not provided, then just create one for this
  // bundle command and close it down afterwards.
  var shouldClosePackager = false;
  if (!packagerInstance) {
    const assetExts = (config.getAssetExts && config.getAssetExts()) || [];
    const sourceExts = (config.getSourceExts && config.getSourceExts()) || [];
    const platforms = (config.getPlatforms && config.getPlatforms()) || [];

    const transformModulePath = args.transformer
      ? path.resolve(args.transformer)
      : config.getTransformModulePath();

    const providesModuleNodeModules =
      typeof config.getProvidesModuleNodeModules === 'function'
        ? config.getProvidesModuleNodeModules()
        : defaultProvidesModuleNodeModules;

    /* $FlowFixMe: Flow is wrong, Node.js docs specify that process.stdout is an
     * instance of a net.Socket (a local socket, not network). */
    const terminal = new Terminal(process.stdout);
    const options = {
      assetExts: defaultAssetExts.concat(assetExts),
      blacklistRE: config.getBlacklistRE(),
      extraNodeModules: config.extraNodeModules,
      getTransformOptions: config.getTransformOptions,
      globalTransformCache: null,
      hasteImpl: config.hasteImpl,
      platforms: defaultPlatforms.concat(platforms),
      postMinifyProcess: config.postMinifyProcess,
      postProcessModules: config.postProcessModules,
      projectRoots: config.getProjectRoots(),
      providesModuleNodeModules: providesModuleNodeModules,
      resetCache: args.resetCache,
      reporter: new TerminalReporter(terminal),
      sourceExts: defaultSourceExts.concat(sourceExts),
      transformCache: TransformCaching.useTempDir(),
      transformModulePath: transformModulePath,
      watch: false,
      workerPath: config.getWorkerPath && config.getWorkerPath(),
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

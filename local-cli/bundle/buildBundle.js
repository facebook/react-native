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
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const Server = require('metro-bundler/src/Server');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const Terminal = require('metro-bundler/src/lib/Terminal');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const TerminalReporter = require('metro-bundler/src/lib/TerminalReporter');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const TransformCaching = require('metro-bundler/src/lib/TransformCaching');

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const outputBundle = require('metro-bundler/src/shared/output/bundle');
const path = require('path');
const saveAssets = require('./saveAssets');
const defaultAssetExts = require('metro-bundler/src/defaults').assetExts;
const defaultSourceExts = require('metro-bundler/src/defaults').sourceExts;
const defaultPlatforms = require('metro-bundler/src/defaults').platforms;
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const defaultProvidesModuleNodeModules = require('metro-bundler/src/defaults').providesModuleNodeModules;

const {ASSET_REGISTRY_PATH} = require('../core/Constants');

import type {RequestOptions, OutputOptions} from './types.flow';
import type {ConfigT} from 'metro-bundler';

function saveBundle(output, bundle, args) {
  return Promise.resolve(
    /* $FlowFixMe(>=0.56.0 site=react_native_oss) This comment suppresses an
     * error found when Flow v0.56 was deployed. To see the error delete this
     * comment and run Flow. */
    /* $FlowFixMe(>=0.56.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.56 was deployed. To see the error
     * delete this comment and run Flow. */
    output.save(bundle, args, log)
  ).then(() => bundle);
}

function buildBundle(
  args: OutputOptions & {
    assetsDest: mixed,
    entryFile: string,
    maxWorkers: number,
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

    /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.54 was deployed. To see the error
     * delete this comment and run Flow. */
    const terminal = new Terminal(process.stdout);
    const options = {
      assetExts: defaultAssetExts.concat(assetExts),
      assetRegistryPath: ASSET_REGISTRY_PATH,
      blacklistRE: config.getBlacklistRE(),
      extraNodeModules: config.extraNodeModules,
      getPolyfills: config.getPolyfills,
      getTransformOptions: config.getTransformOptions,
      globalTransformCache: null,
      hasteImpl: config.hasteImpl,
      maxWorkers: args.maxWorkers,
      platforms: defaultPlatforms.concat(platforms),
      postMinifyProcess: config.postMinifyProcess,
      postProcessModules: config.postProcessModules,
      postProcessBundleSourcemap: config.postProcessBundleSourcemap,
      projectRoots: config.getProjectRoots(),
      providesModuleNodeModules: providesModuleNodeModules,
      resetCache: args.resetCache,
      reporter: new TerminalReporter(terminal),
      runBeforeMainModule: config.runBeforeMainModule,
      sourceExts: defaultSourceExts.concat(sourceExts),
      transformCache: TransformCaching.useTempDir(),
      transformModulePath: transformModulePath,
      useDeltaBundler: false,
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

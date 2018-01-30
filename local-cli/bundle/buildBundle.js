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
const Server = require('metro/src/Server');
const {Terminal} = require('metro-core');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const TerminalReporter = require('metro/src/lib/TerminalReporter');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const TransformCaching = require('metro/src/lib/TransformCaching');

const {defaults} = require('metro');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const outputBundle = require('metro/src/shared/output/bundle');
const path = require('path');
const saveAssets = require('./saveAssets');

const {ASSET_REGISTRY_PATH} = require('../core/Constants');

import type {RequestOptions, OutputOptions} from './types.flow';
import type {ConfigT} from 'metro';

const defaultAssetExts = defaults.assetExts;
const defaultSourceExts = defaults.sourceExts;
const defaultPlatforms = defaults.platforms;
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const defaultProvidesModuleNodeModules = defaults.providesModuleNodeModules;

async function buildBundle(
  args: OutputOptions & {
    assetsDest: mixed,
    entryFile: string,
    maxWorkers: number,
    resetCache: boolean,
    transformer: string,
    minify: boolean,
  },
  config: ConfigT,
  output = outputBundle,
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
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
  };

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

  const terminal = new Terminal(process.stdout);

  const server = new Server({
    assetExts: defaultAssetExts.concat(assetExts),
    assetRegistryPath: ASSET_REGISTRY_PATH,
    blacklistRE: config.getBlacklistRE(),
    dynamicDepsInPackages: config.dynamicDepsInPackages,
    extraNodeModules: config.extraNodeModules,
    getModulesRunBeforeMainModule: config.getModulesRunBeforeMainModule,
    getPolyfills: config.getPolyfills,
    getTransformOptions: config.getTransformOptions,
    globalTransformCache: null,
    hasteImplModulePath: config.hasteImplModulePath,
    maxWorkers: args.maxWorkers,
    platforms: defaultPlatforms.concat(platforms),
    postMinifyProcess: config.postMinifyProcess,
    postProcessModules: config.postProcessModules,
    postProcessBundleSourcemap: config.postProcessBundleSourcemap,
    projectRoots: config.getProjectRoots(),
    providesModuleNodeModules: providesModuleNodeModules,
    resetCache: args.resetCache,
    reporter: new TerminalReporter(terminal),
    sourceExts: defaultSourceExts.concat(sourceExts),
    transformCache: TransformCaching.useTempDir(),
    transformModulePath: transformModulePath,
    watch: false,
    workerPath: config.getWorkerPath && config.getWorkerPath(),
  });

  const bundle = await output.build(server, requestOpts);

  await output.save(bundle, args, log);

  // Save the assets of the bundle
  const outputAssets = await server.getAssets({
    ...Server.DEFAULT_BUNDLE_OPTIONS,
    ...requestOpts,
    bundleType: 'todo',
  });

  // When we're done saving bundle output and the assets, we're done.
  const assets = await saveAssets(
    outputAssets,
    args.platform,
    args.assetsDest,
  );

  server.end();

  return assets;
}

module.exports = buildBundle;

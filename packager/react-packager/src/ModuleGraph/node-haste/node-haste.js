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

import type { // eslint-disable-line sort-requires
  DeprecatedAssetMapT,
  Extensions,
  HasteMapT,
  HelpersT,
  Path,
  ResolutionRequestT,
} from './node-haste.flow';

import type {
  ResolveFn,
  TransformedFile,
} from '../types.flow';

const DependencyGraphHelpers: Class<HelpersT> = require('../../node-haste/DependencyGraph/DependencyGraphHelpers');
const DeprecatedAssetMap: Class<DeprecatedAssetMapT> = require('../../node-haste/DependencyGraph/DeprecatedAssetMap');
const FastFS = require('./FastFS');
const HasteMap: Class<HasteMapT> = require('../../node-haste/DependencyGraph/HasteMap');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const ResolutionRequest: Class<ResolutionRequestT> = require('../../node-haste/DependencyGraph/ResolutionRequest');

type ResolveOptions = {
  assetExts: Extensions,
  extraNodeModules: {[id: string]: string},
  providesModuleNodeModules: Array<string>,
  transformedFiles: {[path: Path]: TransformedFile},
};

const platforms = new Set(['android', 'ios']);
const returnTrue = () => true;

exports.createResolveFn = function(options: ResolveOptions): ResolveFn {
  const {
    assetExts,
    extraNodeModules,
    providesModuleNodeModules,
    transformedFiles,
  } = options;
  const files = Object.keys(transformedFiles);
  const getTransformedFile =
    path => Promise.resolve(
      transformedFiles[path] || Promise.reject(new Error(`"${path} does not exist`))
    );

  const helpers = new DependencyGraphHelpers({
    assetExts,
    providesModuleNodeModules,
  });
  const deprecatedAssetMap = new DeprecatedAssetMap({
    assetExts,
    files,
    helpers,
    platforms,
  });

  const fastfs = new FastFS(files);
  const moduleCache = new ModuleCache(getTransformedFile);
  const hasteMap = new HasteMap({
    extensions: ['js', 'json'],
    fastfs,
    helpers,
    moduleCache,
    platforms,
    preferNativePlatform: true,
  });

  const resolutionRequests = {};
  return (id, source, platform, _, callback) => {
    let resolutionRequest = resolutionRequests[platform];
    if (!resolutionRequest) {
      resolutionRequest = resolutionRequests[platform] = new ResolutionRequest({
        deprecatedAssetMap,
        extraNodeModules,
        fastfs,
        hasteMap,
        helpers,
        moduleCache,
        platform,
        platforms,
        preferNativePlatform: true,
        shouldThrowOnUnresolvedErrors: returnTrue,
      });
    }

    const from = new Module(source, getTransformedFile(source));
    resolutionRequest.resolveDependency(from, id).then(
      // nextTick to escape promise error handling
      module => process.nextTick(callback, null, module.path),
      error => process.nextTick(callback, error),
    );
  };
};

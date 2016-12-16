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
  Extensions,
  Path,
} from './node-haste.flow';

import type {
  ResolveFn,
  TransformedFile,
} from '../types.flow';

const DependencyGraphHelpers = require('../../node-haste/DependencyGraph/DependencyGraphHelpers');
const HasteFS = require('./HasteFS');
const HasteMap = require('../../node-haste/DependencyGraph/HasteMap');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const ResolutionRequest = require('../../node-haste/DependencyGraph/ResolutionRequest');

const defaults = require('../../../../defaults');

type ResolveOptions = {|
  assetExts: Extensions,
  extraNodeModules: {[id: string]: string},
  transformedFiles: {[path: Path]: TransformedFile},
|};

const platforms = new Set(defaults.platforms);

exports.createResolveFn = function(options: ResolveOptions): ResolveFn {
  const {
    assetExts,
    extraNodeModules,
    transformedFiles,
  } = options;
  const files = Object.keys(transformedFiles);
  const getTransformedFile =
    path => Promise.resolve(
      transformedFiles[path] || Promise.reject(new Error(`"${path} does not exist`))
    );

  const helpers = new DependencyGraphHelpers({
    assetExts,
    providesModuleNodeModules: defaults.providesModuleNodeModules,
  });

  const hasteFS = new HasteFS(files);
  const moduleCache = new ModuleCache(
    filePath => hasteFS.closest(filePath, 'package.json'),
    getTransformedFile,
  );
  const hasteMap = new HasteMap({
    extensions: ['js', 'json'],
    files,
    helpers,
    moduleCache,
    platforms,
    preferNativePlatform: true,
  });

  const hasteMapBuilt = hasteMap.build();
  const resolutionRequests = {};
  return (id, source, platform, _, callback) => {
    let resolutionRequest = resolutionRequests[platform];
    if (!resolutionRequest) {
      resolutionRequest = resolutionRequests[platform] = new ResolutionRequest({
        dirExists: filePath => hasteFS.dirExists(filePath),
        entryPath: '',
        extraNodeModules,
        hasteFS,
        hasteMap,
        helpers,
        moduleCache,
        platform,
        platforms,
        preferNativePlatform: true,
      });
    }

    const from = new Module(source, moduleCache, getTransformedFile(source));
    hasteMapBuilt
      .then(() => resolutionRequest.resolveDependency(from, id))
      .then(
        // nextTick to escape promise error handling
        module => process.nextTick(callback, null, module.path),
        error => process.nextTick(callback, error),
      );
  };
};

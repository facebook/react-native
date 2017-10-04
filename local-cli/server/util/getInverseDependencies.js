/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

/**
 * This is a subset of the actual `metro-bundler`'s `ResolutionResponse` class,
 * without all the stuff we don't need to know about. This allows us to use
 * `getInverseDependencies` with different versions of `metro-bundler`.
 */
export type ResolutionResponse<TModule> = {
  copy(data: {
    dependencies?: Array<TModule>,
    mainModuleId?: number,
    mocks?: mixed,
  }): ResolutionResponse<TModule>,
  dependencies: Array<TModule>,
  getResolvedDependencyPairs(
    module: TModule,
  ): $ReadOnlyArray<[string, TModule]>,
  options: Object,
};

function resolveModuleRequires<TModule>(
  resolutionResponse: ResolutionResponse<TModule>,
  module: TModule,
): Array<TModule> {
  const pairs = resolutionResponse.getResolvedDependencyPairs(module);
  return pairs ? pairs.map(([, dependencyModule]) => dependencyModule) : [];
}

function getModuleDependents<TModule>(
  cache: Map<TModule, Set<TModule>>,
  module: TModule,
): Set<TModule> {
  let dependents = cache.get(module);
  if (!dependents) {
    dependents = new Set();
    cache.set(module, dependents);
  }
  return dependents;
}

/**
 * Returns an object that indicates in which module each module is required.
 */
function getInverseDependencies<TModule>(
  resolutionResponse: ResolutionResponse<TModule>,
): Map<TModule, Set<TModule>> {
  const cache = new Map();

  resolutionResponse.dependencies.forEach(module => {
    resolveModuleRequires(resolutionResponse, module).forEach(dependency => {
      getModuleDependents(cache, dependency).add(module);
    });
  });

  return cache;
}

module.exports = getInverseDependencies;

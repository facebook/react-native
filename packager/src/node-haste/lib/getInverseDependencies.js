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

import type ResolutionResponse from '../DependencyGraph/ResolutionResponse';

function resolveModuleRequires<TModule: {hash(): string}, TOptions>(
  resolutionResponse: ResolutionResponse<TModule, TOptions>,
  module: TModule,
) {
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
function getInverseDependencies<TModule: {hash(): string}, TOptions>(
  resolutionResponse: ResolutionResponse<TModule, TOptions>,
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

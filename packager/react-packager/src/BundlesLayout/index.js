/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const _ = require('underscore');
const declareOpts = require('../lib/declareOpts');

const validateOpts = declareOpts({
  dependencyResolver: {
    type: 'object',
    required: true,
  },
});

/**
 * Class that takes care of separating the graph of dependencies into
 * separate bundles
 */
class BundlesLayout {
  constructor(options) {
    const opts = validateOpts(options);
    this._resolver = opts.dependencyResolver;

    this._moduleToBundle = Object.create(null);
  }

  generateLayout(entryPaths, isDev) {
    const bundles = [];
    var pending = [entryPaths];

    return promiseWhile(
      () => pending.length > 0,
      () => bundles,
      () => {
        const pendingPaths = pending.shift();
        return Promise
          .all(pendingPaths.map(path =>
            this._resolver.getDependencies(path, {dev: isDev})
          ))
          .then(modulesDeps => {
            let syncDependencies = Object.create(null);
            modulesDeps.forEach(moduleDeps => {
              moduleDeps.dependencies.forEach(dep => {
                syncDependencies[dep.path] = dep
                this._moduleToBundle[dep.path] = bundles.length;
              });
              pending = pending.concat(moduleDeps.asyncDependencies);
            });

            syncDependencies = _.values(syncDependencies);
            if (syncDependencies.length > 0) {
              bundles.push(syncDependencies);
            }

            return Promise.resolve(bundles);
          });
      },
    );
  }

  getBundleIDForModule(path) {
    return this._moduleToBundle[path];
  }
}

// Runs the body Promise meanwhile the condition callback is satisfied.
// Once it's not satisfied anymore, it returns what the results callback
// indicates
function promiseWhile(condition, result, body) {
  if (!condition()) {
    return Promise.resolve(result());
  }

  return body().then(() => promiseWhile(condition, result, body));
}

module.exports = BundlesLayout;

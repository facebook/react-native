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
        // pending sync dependencies we still need to explore for the current
        // pending dependency
        let pendingSyncDeps = pending.shift();

        // accum variable for sync dependencies of the current pending
        // dependency we're processing
        const syncDependencies = Object.create(null);

        return promiseWhile(
          () => pendingSyncDeps.length > 0,
          () => {
            const dependencies = _.values(syncDependencies);
            if (dependencies.length > 0) {
              bundles.push(dependencies);
            }
          },
          () => {
            const pendingSyncDep = pendingSyncDeps.shift();
            return this._resolver
              .getDependencies(pendingSyncDep, {dev: isDev})
              .then(deps => {
                deps.dependencies.forEach(dep => {
                  if (dep.path !== pendingSyncDep && !dep.isPolyfill) {
                    pendingSyncDeps.push(dep.path);
                  }
                  syncDependencies[dep.path] = dep;
                  this._moduleToBundle[dep.path] = bundles.length;
                });
                pending = pending.concat(deps.asyncDependencies);
              });
          },
        );
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

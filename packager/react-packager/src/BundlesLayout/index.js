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

const BUNDLE_PREFIX = 'bundle';

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
    var currentBundleID =  0;
    const rootBundle = {
      id: BUNDLE_PREFIX + '.' + currentBundleID++,
      modules: [],
      children: [],
    };
    var pending = [{paths: entryPaths, bundle: rootBundle}];

    return promiseWhile(
      () => pending.length > 0,
      () => rootBundle,
      () => {
        const {paths, bundle} = pending.shift();

        // pending sync dependencies we still need to explore for the current
        // pending dependency
        const pendingSyncDeps = paths;

        // accum variable for sync dependencies of the current pending
        // dependency we're processing
        const syncDependencies = Object.create(null);

        return promiseWhile(
          () => pendingSyncDeps.length > 0,
          () => {
            const dependencies = Object.keys(syncDependencies);
            if (dependencies.length > 0) {
              bundle.modules = dependencies;
            }
          },
          index => {
            const pendingSyncDep = pendingSyncDeps.shift();
            return this._resolver
              .getDependencies(pendingSyncDep, {dev: isDev})
              .then(deps => {
                deps.dependencies.forEach(dep => {
                  if (dep.path !== pendingSyncDep && !dep.isPolyfill()) {
                    pendingSyncDeps.push(dep.path);
                  }
                  syncDependencies[dep.path] = true;
                  this._moduleToBundle[dep.path] = bundle.id;
                });
                deps.asyncDependencies.forEach(asyncDeps => {
                  const childBundle = {
                    id: bundle.id + '.' + currentBundleID++,
                    modules: [],
                    children: [],
                  };

                  bundle.children.push(childBundle);
                  pending.push({paths: asyncDeps, bundle: childBundle});
                });
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
  return _promiseWhile(condition, result, body, 0);
}

function _promiseWhile(condition, result, body, index) {
  if (!condition()) {
    return Promise.resolve(result());
  }

  return body(index).then(() =>
    _promiseWhile(condition, result, body, index + 1)
  );
}

module.exports = BundlesLayout;

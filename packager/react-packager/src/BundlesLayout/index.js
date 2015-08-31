/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Activity = require('../Activity');

const _ = require('underscore');
const declareOpts = require('../lib/declareOpts');
const fs = require('fs');
const getCacheFilePath = require('../lib/getCacheFilePath');
const loadCacheSync = require('../lib/loadCacheSync');
const version = require('../../../../package.json').version;
const path = require('path');

const validateOpts = declareOpts({
  dependencyResolver: {
    type: 'object',
    required: true,
  },
  resetCache: {
    type: 'boolean',
    default: false,
  },
  cacheVersion: {
    type: 'string',
    default: '1.0',
  },
  projectRoots: {
    type: 'array',
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

    // Cache in which bundle is each module.
    this._moduleToBundle = Object.create(null);

    // Cache the bundles layouts for each entry point. This entries
    // are not evicted unless the user explicitly specifies so as
    // computing them is pretty expensive
    this._layouts = Object.create(null);

    // TODO: watch for file creations and removals to update this caches

    this._cacheFilePath = this._getCacheFilePath(opts);
    if (!opts.resetCache) {
      this._loadCacheSync(this._cacheFilePath);
    } else {
      this._persistCacheEventually();
    }
  }

  getLayout(entryPath, isDev) {
    if (this._layouts[entryPath]) {
      return this._layouts[entryPath];
    }
    var currentBundleID =  0;
    const rootBundle = {
      id: BUNDLE_PREFIX + '.' + currentBundleID++,
      modules: [],
      children: [],
    };
    var pending = [{paths: [entryPath], bundle: rootBundle}];

    this._layouts[entryPath] = promiseWhile(
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

            // persist changes to layouts
            this._persistCacheEventually();
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

    return this._layouts[entryPath];
  }

  getBundleIDForModule(path) {
    return this._moduleToBundle[path];
  }

  _loadCacheSync(cachePath) {
    const loadCacheId = Activity.startEvent('Loading bundles layout');
    const cacheOnDisk = loadCacheSync(cachePath);

    // TODO: create single-module bundles for unexistent modules
    // TODO: remove modules that no longer exist
    Object.keys(cacheOnDisk).forEach(entryPath => {
      this._layouts[entryPath] = Promise.resolve(cacheOnDisk[entryPath]);
      this._fillModuleToBundleMap(cacheOnDisk[entryPath]);
    });

    Activity.endEvent(loadCacheId);
  }

  _fillModuleToBundleMap(bundle) {
    bundle.modules.forEach(module => this._moduleToBundle[module] = bundle.id);
    bundle.children.forEach(child => this._fillModuleToBundleMap(child));
  }

  _persistCacheEventually() {
    _.debounce(
      this._persistCache.bind(this),
      2000,
    );
  }

  _persistCache() {
    if (this._persisting !== null) {
      return this._persisting;
    }

    this._persisting = Promise
      .all(_.values(this._layouts))
      .then(bundlesLayout => {
        var json = Object.create(null);
        Object.keys(this._layouts).forEach((p, i) =>
          json[p] = bundlesLayout[i]
        );

        return Promise.denodeify(fs.writeFile)(
          this._cacheFilepath,
          JSON.stringify(json),
        );
      })
      .then(() => this._persisting = null);

    return this._persisting;
  }

  _getCacheFilePath(options) {
    return getCacheFilePath(
      'react-packager-bundles-cache-',
      version,
      options.projectRoots.join(',').split(path.sep).join('-'),
      options.cacheVersion || '0',
    );
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

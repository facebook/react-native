/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Promise = require('promise');
const ProgressBar = require('progress');
const BundlesLayout = require('../BundlesLayout');
const Cache = require('../DependencyResolver/Cache');
const Transformer = require('../JSTransformer');
const Resolver = require('../Resolver');
const Bundle = require('./Bundle');
const HMRBundle = require('./HMRBundle');
const PrepackBundle = require('./PrepackBundle');
const Activity = require('../Activity');
const ModuleTransport = require('../lib/ModuleTransport');
const declareOpts = require('../lib/declareOpts');
const imageSize = require('image-size');
const version = require('../../../../package.json').version;

const sizeOf = Promise.denodeify(imageSize);
const readFile = Promise.denodeify(fs.readFile);

const validateOpts = declareOpts({
  projectRoots: {
    type: 'array',
    required: true,
  },
  blacklistRE: {
    type: 'object', // typeof regex is object
  },
  moduleFormat: {
    type: 'string',
    default: 'haste',
  },
  polyfillModuleNames: {
    type: 'array',
    default: [],
  },
  cacheVersion: {
    type: 'string',
    default: '1.0',
  },
  resetCache: {
    type: 'boolean',
    default: false,
  },
  transformModulePath: {
    type:'string',
    required: false,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
  assetRoots: {
    type: 'array',
    required: false,
  },
  assetExts: {
    type: 'array',
    default: ['png'],
  },
  fileWatcher: {
    type: 'object',
    required: true,
  },
  assetServer: {
    type: 'object',
    required: true,
  },
  transformTimeoutInterval: {
    type: 'number',
    required: false,
  },
  disableInternalTransforms: {
    type: 'boolean',
    default: false,
  },
});

class Bundler {

  constructor(options) {
    const opts = this._opts = validateOpts(options);

    opts.projectRoots.forEach(verifyRootExists);

    let mtime;
    try {
      ({mtime} = fs.statSync(opts.transformModulePath));
      mtime = String(mtime.getTime());
    } catch (error) {
      mtime = '';
    }

    this._getModuleId = createModuleIdGetter();

    this._cache = new Cache({
      resetCache: opts.resetCache,
      cacheKey: [
        'react-packager-cache',
        version,
        opts.cacheVersion,
        opts.projectRoots.join(',').split(path.sep).join('-'),
        mtime
      ].join('$'),
    });

    this._resolver = new Resolver({
      projectRoots: opts.projectRoots,
      blacklistRE: opts.blacklistRE,
      polyfillModuleNames: opts.polyfillModuleNames,
      moduleFormat: opts.moduleFormat,
      assetRoots: opts.assetRoots,
      fileWatcher: opts.fileWatcher,
      assetExts: opts.assetExts,
      cache: this._cache,
      getModuleId: this._getModuleId,
    });

    this._bundlesLayout = new BundlesLayout({
      dependencyResolver: this._resolver,
      resetCache: opts.resetCache,
      cacheVersion: opts.cacheVersion,
      projectRoots: opts.projectRoots,
    });

    this._transformer = new Transformer({
      projectRoots: opts.projectRoots,
      blacklistRE: opts.blacklistRE,
      cache: this._cache,
      transformModulePath: opts.transformModulePath,
      disableInternalTransforms: opts.disableInternalTransforms,
    });

    this._projectRoots = opts.projectRoots;
    this._assetServer = opts.assetServer;

    if (opts.getTransformOptionsModulePath) {
      this._getTransformOptionsModule = require(opts.getTransformOptionsModulePath);
    }
  }

  kill() {
    this._transformer.kill();
    return this._cache.end();
  }

  getLayout(main, isDev) {
    return this._bundlesLayout.generateLayout(main, isDev);
  }

  bundle(options) {
    return this._bundle({
      bundle: new Bundle(options.sourceMapUrl),
      includeSystemDependencies: true,
      ...options,
    });
  }

  bundleForHMR(options) {
    return this._bundle({
      bundle: new HMRBundle(),
      hot: true,
      ...options,
    });
  }

  _bundle({
    bundle,
    modules,
    entryFile,
    runModule: runMainModule,
    runBeforeMainModule,
    dev: isDev,
    includeSystemDependencies,
    platform,
    unbundle: isUnbundle,
    hot: hot,
  }) {
    const findEventId = Activity.startEvent('find dependencies');
    let transformEventId;

    if (isDev) {
      // `require` calls int  the require polyfill itself are not analyzed and
      // replaced so that they use numeric module IDs. Therefore, we include
      // the Systrace module before any other module, and it will set itself
      // as property on the require function.
      // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
      runBeforeMainModule = ['Systrace'].concat(runBeforeMainModule);
    }

    const modulesByName = Object.create(null);
    return this.getDependencies(entryFile, isDev, platform).then((response) => {
      Activity.endEvent(findEventId);
      bundle.setMainModuleId(this._getModuleId(response.getMainModule()));
      transformEventId = Activity.startEvent('transform');

      const moduleSystemDeps = includeSystemDependencies
        ? this._resolver.getModuleSystemDependencies(
          { dev: isDev, platform, isUnbundle }
        )
        : [];

      const modulesToProcess = modules || response.dependencies;
      const dependencies = moduleSystemDeps.concat(modulesToProcess);

      bundle.setNumPrependedModules && bundle.setNumPrependedModules(
        response.numPrependedDependencies + moduleSystemDeps.length
      );

      let bar;
      if (process.stdout.isTTY) {
        bar = new ProgressBar('transforming [:bar] :percent :current/:total', {
          complete: '=',
          incomplete: ' ',
          width: 40,
          total: dependencies.length,
        });
      }

      return Promise.all(
        dependencies.map(
          module => {
            return this._transformModule(
              bundle,
              response,
              module,
              platform,
              hot,
            ).then(transformed => {
              return module.getName().then(name => {
                modulesByName[name] = module;
                return transformed;
              });
            }).then(transformed => {
              if (bar) {
                bar.tick();
              }

              return {
                module,
                transformed,
              };
            });
          }
        )
      ).then(transformedModules => Promise.all(
        transformedModules.map(({module, transformed}) => {
          return bundle.addModule(
            this._resolver,
            response,
            module,
            transformed,
          );
        })
      ));
    }).then(() => {
      Activity.endEvent(transformEventId);
      const runBeforeIds = runBeforeMainModule
        .map(name => modulesByName[name])
        .filter(Boolean)
        .map(this._getModuleId, this);
      bundle.finalize({runBeforeMainModule: runBeforeIds, runMainModule});
      return bundle;
    });
  }

  prepackBundle({
    entryFile,
    runModule: runMainModule,
    runBeforeMainModule,
    sourceMapUrl,
    dev: isDev,
    platform,
  }) {
    const bundle = new PrepackBundle(sourceMapUrl);
    const findEventId = Activity.startEvent('find dependencies');
    let transformEventId;
    let mainModuleId;

    return this.getDependencies(entryFile, isDev, platform).then((response) => {
      Activity.endEvent(findEventId);
      transformEventId = Activity.startEvent('transform');

      let bar;
      if (process.stdout.isTTY) {
        bar = new ProgressBar('transforming [:bar] :percent :current/:total', {
          complete: '=',
          incomplete: ' ',
          width: 40,
          total: response.dependencies.length,
        });
      }

      mainModuleId = response.mainModuleId;

      return Promise.all(
        response.dependencies.map(
          module => this._transformModule(
            bundle,
            response,
            module,
            platform
          ).then(transformed => {
            if (bar) {
              bar.tick();
            }

            var deps = Object.create(null);
            var pairs = response.getResolvedDependencyPairs(module);
            if (pairs) {
              pairs.forEach(pair => {
                deps[pair[0]] = pair[1].path;
              });
            }

            return module.getName().then(name => {
              bundle.addModule(name, transformed, deps, module.isPolyfill());
            });
          })
        )
      );
    }).then(() => {
      Activity.endEvent(transformEventId);
      bundle.finalize({runBeforeMainModule, runMainModule, mainModuleId });
      return bundle;
    });
  }

  _transformModuleForHMR(module, platform) {
    if (module.isAsset()) {
      return this._generateAssetObjAndCode(module, platform).then(
        ({asset, code}) => {
          return {
            code,
          };
        }
      );
    } else {
      return this._transformer.loadFileAndTransform(
        module.path,
        // TODO(martinb): pass non null main (t9527509)
        this._getTransformOptions({main: null}, {hot: true}),
      );
    }
  }

  invalidateFile(filePath) {
    this._transformer.invalidateFile(filePath);
  }

  getShallowDependencies(entryFile) {
    return this._resolver.getShallowDependencies(entryFile);
  }

  stat(filePath) {
    return this._resolver.stat(filePath);
  }

  getModuleForPath(entryFile) {
    return this._resolver.getModuleForPath(entryFile);
  }

  getDependencies(main, isDev, platform) {
    return this._resolver.getDependencies(main, { dev: isDev, platform });
  }

  getOrderedDependencyPaths({ entryFile, dev, platform }) {
    return this.getDependencies(entryFile, dev, platform).then(
      ({ dependencies }) => {
        const ret = [];
        const promises = [];
        const placeHolder = {};
        dependencies.forEach(dep => {
          if (dep.isAsset()) {
            const relPath = getPathRelativeToRoot(
              this._projectRoots,
              dep.path
            );
            promises.push(
              this._assetServer.getAssetData(relPath, platform)
            );
            ret.push(placeHolder);
          } else {
            ret.push(dep.path);
          }
        });

        return Promise.all(promises).then(assetsData => {
          assetsData.forEach(({ files }) => {
            const index = ret.indexOf(placeHolder);
            ret.splice(index, 1, ...files);
          });
          return ret;
        });
      }
    );
  }

  _transformModule(bundle, response, module, platform = null, hot = false) {
    if (module.isAsset_DEPRECATED()) {
      return this._generateAssetModule_DEPRECATED(bundle, module);
    } else if (module.isAsset()) {
      return this._generateAssetModule(bundle, module, platform);
    } else if (module.isJSON()) {
      return generateJSONModule(module);
    } else {
      return this._transformer.loadFileAndTransform(
        path.resolve(module.path),
        this._getTransformOptions(
          {bundleEntry: bundle.getMainModuleId(), modulePath: module.path},
          {hot: hot},
        ),
      );
    }
  }

  getGraphDebugInfo() {
    return this._resolver.getDebugInfo();
  }

  _generateAssetModule_DEPRECATED(bundle, module) {
    return Promise.all([
      sizeOf(module.path),
      module.getName(),
    ]).then(([dimensions, id]) => {
      const img = {
        __packager_asset: true,
        path: module.path,
        uri: id.replace(/^[^!]+!/, ''),
        width: dimensions.width / module.resolution,
        height: dimensions.height / module.resolution,
        deprecated: true,
      };

      bundle.addAsset(img);

      const code = 'module.exports = ' + JSON.stringify(img) + ';';

      return new ModuleTransport({
        code: code,
        sourceCode: code,
        sourcePath: module.path,
        virtual: true,
      });
    });
  }

  _generateAssetObjAndCode(module, platform = null) {
    const relPath = getPathRelativeToRoot(this._projectRoots, module.path);
    var assetUrlPath = path.join('/assets', path.dirname(relPath));

    // On Windows, change backslashes to slashes to get proper URL path from file path.
    if (path.sep === '\\') {
      assetUrlPath = assetUrlPath.replace(/\\/g, '/');
    }

    return Promise.all([
      sizeOf(module.path),
      this._assetServer.getAssetData(relPath, platform),
    ]).then(function(res) {
      const dimensions = res[0];
      const assetData = res[1];
      const asset = {
        __packager_asset: true,
        fileSystemLocation: path.dirname(module.path),
        httpServerLocation: assetUrlPath,
        width: dimensions.width / module.resolution,
        height: dimensions.height / module.resolution,
        scales: assetData.scales,
        files: assetData.files,
        hash: assetData.hash,
        name: assetData.name,
        type: assetData.type,
      };

      const code = module.getCode(asset);

      return {asset, code};
    });
  }


  _generateAssetModule(bundle, module, platform = null) {
    return this._generateAssetObjAndCode(module, platform).then(({asset, code}) => {
      bundle.addAsset(asset);
      return new ModuleTransport({
        code: code,
        sourceCode: code,
        sourcePath: module.path,
        virtual: true,
      });
    });
  }

  _getTransformOptions(config, options) {
    const transformerOptions = this._getTransformOptionsModule
      ? this._getTransformOptionsModule(config)
      : null;

    return {...options, ...transformerOptions};
  }
}

function generateJSONModule(module) {
  return readFile(module.path).then(function(data) {
    const code = 'module.exports = ' + data.toString('utf8') + ';';

    return new ModuleTransport({
      code: code,
      sourceCode: code,
      sourcePath: module.path,
      virtual: true,
    });
  });
}

function getPathRelativeToRoot(roots, absPath) {
  for (let i = 0; i < roots.length; i++) {
    const relPath = path.relative(roots[i], absPath);
    if (relPath[0] !== '.') {
      return relPath;
    }
  }

  throw new Error(
    'Expected root module to be relative to one of the project roots'
  );
}

function verifyRootExists(root) {
  // Verify that the root exists.
  assert(fs.statSync(root).isDirectory(), 'Root has to be a valid directory');
}


function createModuleIdGetter() {
  const fileToIdMap = Object.create(null);
  let nextId = 0;
  return (
    ({path}) => {
      if (!(path in fileToIdMap)) {
        // can't be a number for now, since we also replace in import / export
        // we can change that when we eventually change to analyzing dependencies
        // on transformed modules
        fileToIdMap[path] = String(nextId++);
      }
      return fileToIdMap[path];
    }
  );
}

module.exports = Bundler;

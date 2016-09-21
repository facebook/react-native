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
const Cache = require('../node-haste').Cache;
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

const noop = () => {};

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
  extraNodeModules: {
    type: 'object',
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
  silent: {
    type: 'boolean',
    default: false,
  },
  allowBundleUpdates: {
    type: 'boolean',
    default: false,
  },
});

const assetPropertyBlacklist = new Set([
  'files',
  'fileSystemLocation',
  'path',
]);

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

    const cacheKeyParts =  [
      'react-packager-cache',
      version,
      opts.cacheVersion,
      opts.projectRoots.join(',').split(path.sep).join('-'),
      mtime,
    ];

    this._getModuleId = createModuleIdFactory();

    if (opts.transformModulePath) {
      const transformer = require(opts.transformModulePath);
      if (typeof transformer.cacheKey !== 'undefined') {
        cacheKeyParts.push(transformer.cacheKey);
      }
    }

    this._cache = new Cache({
      resetCache: opts.resetCache,
      cacheKey: cacheKeyParts.join('$'),
    });

    this._transformer = new Transformer({
      transformModulePath: opts.transformModulePath,
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
      transformCode:
        (module, code, options) =>
          this._transformer.transformFile(module.path, code, options),
      extraNodeModules: opts.extraNodeModules,
      minifyCode: this._transformer.minify,
    });

    this._projectRoots = opts.projectRoots;
    this._assetServer = opts.assetServer;

    if (opts.getTransformOptionsModulePath) {
      this._transformOptionsModule = require(
        opts.getTransformOptionsModulePath
      );
    }
  }

  kill() {
    this._transformer.kill();
    return this._cache.end();
  }

  bundle(options) {
    const {dev, minify, unbundle} = options;
    const moduleSystemDeps =
      this._resolver.getModuleSystemDependencies({dev, unbundle});
    return this._bundle({
      ...options,
      bundle: new Bundle({dev, minify, sourceMapUrl: options.sourceMapUrl}),
      moduleSystemDeps,
    });
  }

  _sourceHMRURL(platform, path) {
    return this._hmrURL(
      '',
      platform,
      'bundle',
      path,
    );
  }

  _sourceMappingHMRURL(platform, path) {
    // Chrome expects `sourceURL` when eval'ing code
    return this._hmrURL(
      '\/\/# sourceURL=',
      platform,
      'map',
      path,
    );
  }

  _hmrURL(prefix, platform, extensionOverride, filePath) {
    const matchingRoot = this._projectRoots.find(root => filePath.startsWith(root));

    if (!matchingRoot) {
      throw new Error('No matching project root for ', filePath);
    }

    // Replaces '\' with '/' for Windows paths.
    if (path.sep === '\\') {
      filePath = filePath.replace(/\\/g, '/');
    }

    const extensionStart = filePath.lastIndexOf('.');
    let resource = filePath.substring(
      matchingRoot.length,
      extensionStart !== -1 ? extensionStart : undefined,
    );

    return (
      prefix + resource +
      '.' + extensionOverride + '?' +
      'platform=' + platform + '&runModule=false&entryModuleOnly=true&hot=true'
    );
  }

  hmrBundle(options, host, port) {
    return this._bundle({
      ...options,
      bundle: new HMRBundle({
        sourceURLFn: this._sourceHMRURL.bind(this, options.platform),
        sourceMappingURLFn: this._sourceMappingHMRURL.bind(
          this,
          options.platform,
        ),
      }),
      hot: true,
      dev: true,
    });
  }

  _bundle({
    bundle,
    entryFile,
    runModule: runMainModule,
    runBeforeMainModule,
    dev,
    minify,
    platform,
    moduleSystemDeps = [],
    hot,
    unbundle,
    entryModuleOnly,
    resolutionResponse,
    isolateModuleIDs,
    generateSourceMaps,
    assetPlugins,
  }) {
    const onResolutionResponse = response => {
      bundle.setMainModuleId(response.getModuleId(getMainModule(response)));
      if (entryModuleOnly) {
        response.dependencies = response.dependencies.filter(module =>
          module.path.endsWith(entryFile)
        );
      } else {
        response.dependencies = moduleSystemDeps.concat(response.dependencies);
      }
    };
    const finalizeBundle = ({bundle, transformedModules, response, modulesByName}) =>
      Promise.all(
        transformedModules.map(({module, transformed}) =>
          bundle.addModule(this._resolver, response, module, transformed)
        )
      ).then(() => {
        const runBeforeMainModuleIds = Array.isArray(runBeforeMainModule)
          ? runBeforeMainModule
              .map(name => modulesByName[name])
              .filter(Boolean)
              .map(response.getModuleId)
          : undefined;

        bundle.finalize({
          runMainModule,
          runBeforeMainModule: runBeforeMainModuleIds,
          allowUpdates: this._opts.allowBundleUpdates,
        });
        return bundle;
      });

    return this._buildBundle({
      entryFile,
      dev,
      minify,
      platform,
      bundle,
      hot,
      unbundle,
      resolutionResponse,
      onResolutionResponse,
      finalizeBundle,
      isolateModuleIDs,
      generateSourceMaps,
      assetPlugins,
    });
  }

  prepackBundle({
    entryFile,
    runModule: runMainModule,
    runBeforeMainModule,
    sourceMapUrl,
    dev,
    platform,
    assetPlugins,
  }) {
    const onModuleTransformed = ({module, transformed, response, bundle}) => {
      const deps = Object.create(null);
      const pairs = response.getResolvedDependencyPairs(module);
      if (pairs) {
        pairs.forEach(pair => {
          deps[pair[0]] = pair[1].path;
        });
      }

      return module.getName().then(name => {
        bundle.addModule(name, transformed, deps, module.isPolyfill());
      });
    };
    const finalizeBundle = ({bundle, response}) => {
      const {mainModuleId} = response;
      bundle.finalize({runBeforeMainModule, runMainModule, mainModuleId});
      return bundle;
    };

    return this._buildBundle({
      entryFile,
      dev,
      platform,
      onModuleTransformed,
      finalizeBundle,
      minify: false,
      bundle: new PrepackBundle(sourceMapUrl),
      assetPlugins,
    });
  }

  _buildBundle({
    entryFile,
    dev,
    minify,
    platform,
    bundle,
    hot,
    unbundle,
    resolutionResponse,
    isolateModuleIDs,
    generateSourceMaps,
    assetPlugins,
    onResolutionResponse = noop,
    onModuleTransformed = noop,
    finalizeBundle = noop,
  }) {
    const findEventId = Activity.startEvent(
      'Finding dependencies',
      null,
      {
        telemetric: true,
      },
    );
    const modulesByName = Object.create(null);

    if (!resolutionResponse) {
      let onProgress = noop;
      if (process.stdout.isTTY && !this._opts.silent) {
        const bar = new ProgressBar('transformed :current/:total (:percent)', {
          complete: '=',
          incomplete: ' ',
          width: 40,
          total: 1,
        });
        onProgress = debouncedTick(bar);
      }

      resolutionResponse = this.getDependencies({
        entryFile,
        dev,
        platform,
        hot,
        onProgress,
        minify,
        isolateModuleIDs,
        generateSourceMaps: unbundle || generateSourceMaps,
      });
    }

    return Promise.resolve(resolutionResponse).then(response => {
      bundle.setRamGroups(response.transformOptions.transform.ramGroups);

      Activity.endEvent(findEventId);
      onResolutionResponse(response);

      // get entry file complete path (`entryFile` is relative to roots)
      let entryFilePath;
      if (response.dependencies.length > 1) { // skip HMR requests
        const numModuleSystemDependencies =
          this._resolver.getModuleSystemDependencies({dev, unbundle}).length;


        const dependencyIndex = (response.numPrependedDependencies || 0) + numModuleSystemDependencies;
        if (dependencyIndex in response.dependencies) {
          entryFilePath = response.dependencies[dependencyIndex].path;
        }
      }

      const toModuleTransport = module =>
        this._toModuleTransport({
          module,
          bundle,
          entryFilePath,
          assetPlugins,
          transformOptions: response.transformOptions,
          getModuleId: response.getModuleId,
          dependencyPairs: response.getResolvedDependencyPairs(module),
        }).then(transformed => {
          modulesByName[transformed.name] = module;
          onModuleTransformed({
            module,
            response,
            bundle,
            transformed,
          });
          return {module, transformed};
        });

      return Promise.all(response.dependencies.map(toModuleTransport))
        .then(transformedModules =>
          Promise.resolve(
            finalizeBundle({bundle, transformedModules, response, modulesByName})
          ).then(() => bundle)
        );
    });
  }

  invalidateFile(filePath) {
    this._cache.invalidate(filePath);
  }

  getShallowDependencies({
    entryFile,
    platform,
    dev = true,
    minify = !dev,
    hot = false,
    generateSourceMaps = false,
  }) {
    return this.getTransformOptions(
      entryFile,
      {
        dev,
        platform,
        hot,
        generateSourceMaps,
        projectRoots: this._projectRoots,
      },
    ).then(transformSpecificOptions => {
      const transformOptions = {
        minify,
        dev,
        platform,
        transform: transformSpecificOptions,
      };

      return this._resolver.getShallowDependencies(entryFile, transformOptions);
    });
  }

  stat(filePath) {
    return this._resolver.stat(filePath);
  }

  getModuleForPath(entryFile) {
    return this._resolver.getModuleForPath(entryFile);
  }

  getDependencies({
    entryFile,
    platform,
    dev = true,
    minify = !dev,
    hot = false,
    recursive = true,
    generateSourceMaps = false,
    isolateModuleIDs = false,
    onProgress,
  }) {
    return this.getTransformOptions(
      entryFile,
      {
        dev,
        platform,
        hot,
        generateSourceMaps,
        projectRoots: this._projectRoots,
      },
    ).then(transformSpecificOptions => {
      const transformOptions = {
        minify,
        dev,
        platform,
        transform: transformSpecificOptions,
      };

      return this._resolver.getDependencies(
        entryFile,
        {dev, platform, recursive},
        transformOptions,
        onProgress,
        isolateModuleIDs ? createModuleIdFactory() : this._getModuleId,
      );
    });
  }

  getOrderedDependencyPaths({ entryFile, dev, platform }) {
    return this.getDependencies({entryFile, dev, platform}).then(
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

  _toModuleTransport({
    module,
    bundle,
    entryFilePath,
    transformOptions,
    getModuleId,
    dependencyPairs,
    assetPlugins,
  }) {
    let moduleTransport;
    const moduleId = getModuleId(module);

    if (module.isAsset_DEPRECATED()) {
      moduleTransport =
        this._generateAssetModule_DEPRECATED(bundle, module, moduleId);
    } else if (module.isAsset()) {
      moduleTransport = this._generateAssetModule(
        bundle, module, moduleId, assetPlugins, transformOptions.platform);
    }

    if (moduleTransport) {
      return Promise.resolve(moduleTransport);
    }

    return Promise.all([
      module.getName(),
      module.read(transformOptions),
    ]).then((
      [name, {code, dependencies, dependencyOffsets, map, source}]
    ) => {
      const {preloadedModules} = transformOptions.transform;
      const preloaded =
        module.path === entryFilePath ||
        module.isPolyfill() ||
        preloadedModules && preloadedModules.hasOwnProperty(module.path);

      return new ModuleTransport({
        name,
        id: moduleId,
        code,
        map,
        meta: {dependencies, dependencyOffsets, preloaded, dependencyPairs},
        sourceCode: source,
        sourcePath: module.path
      });
    });
  }

  _generateAssetModule_DEPRECATED(bundle, module, moduleId) {
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

      const code =
        'module.exports=' +
        JSON.stringify(filterObject(img, assetPropertyBlacklist))
        + ';';

      return new ModuleTransport({
        name: id,
        id: moduleId,
        code: code,
        sourceCode: code,
        sourcePath: module.path,
        virtual: true,
      });
    });
  }

  _generateAssetObjAndCode(module, assetPlugins, platform = null) {
    const relPath = getPathRelativeToRoot(this._projectRoots, module.path);
    var assetUrlPath = path.join('/assets', path.dirname(relPath));

    // On Windows, change backslashes to slashes to get proper URL path from file path.
    if (path.sep === '\\') {
      assetUrlPath = assetUrlPath.replace(/\\/g, '/');
    }

    // Test extension against all types supported by image-size module.
    // If it's not one of these, we won't treat it as an image.
    let isImage = [
      'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'
    ].indexOf(path.extname(module.path).slice(1)) !== -1;

    return Promise.all([
      isImage ? sizeOf(module.path) : null,
      this._assetServer.getAssetData(relPath, platform),
    ]).then((res) => {
      const dimensions = res[0];
      const assetData = res[1];
      const asset = {
        __packager_asset: true,
        fileSystemLocation: path.dirname(module.path),
        httpServerLocation: assetUrlPath,
        width: dimensions ? dimensions.width / module.resolution : undefined,
        height: dimensions ? dimensions.height / module.resolution : undefined,
        scales: assetData.scales,
        files: assetData.files,
        hash: assetData.hash,
        name: assetData.name,
        type: assetData.type,
      };

      return this._applyAssetPlugins(assetPlugins, asset);
    }).then((asset) => {
      const json =  JSON.stringify(filterObject(asset, assetPropertyBlacklist));
      const assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';
      const code =
        `module.exports = require(${JSON.stringify(assetRegistryPath)}).registerAsset(${json});`;
      const dependencies = [assetRegistryPath];
      const dependencyOffsets = [code.indexOf(assetRegistryPath) - 1];

      return {
        asset,
        code,
        meta: {dependencies, dependencyOffsets}
      };
    });
  }

  _applyAssetPlugins(assetPlugins, asset) {
    if (!assetPlugins.length) {
      return asset;
    }

    let [currentAssetPlugin, ...remainingAssetPlugins] = assetPlugins;
    let assetPluginFunction = require(currentAssetPlugin);
    let result = assetPluginFunction(asset);

    // If the plugin was an async function, wait for it to fulfill before
    // applying the remaining plugins
    if (typeof result.then === 'function') {
      return result.then(resultAsset =>
        this._applyAssetPlugins(remainingAssetPlugins, resultAsset)
      );
    } else {
      return this._applyAssetPlugins(remainingAssetPlugins, result);
    }
  }

  _generateAssetModule(bundle, module, moduleId, assetPlugins = [], platform = null) {
    return Promise.all([
      module.getName(),
      this._generateAssetObjAndCode(module, assetPlugins, platform),
    ]).then(([name, {asset, code, meta}]) => {
      bundle.addAsset(asset);
      return new ModuleTransport({
        name,
        id: moduleId,
        code,
        meta: meta,
        sourceCode: code,
        sourcePath: module.path,
        virtual: true,
      });
    });
  }

  getTransformOptions(mainModuleName, options) {
    const extraOptions = this._transformOptionsModule
      ? this._transformOptionsModule(mainModuleName, options, this)
      : null;
    return Promise.resolve(extraOptions)
      .then(extraOptions => Object.assign(options, extraOptions));
  }

  getResolver() {
    return this._resolver;
  }
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

function createModuleIdFactory() {
  const fileToIdMap = Object.create(null);
  let nextId = 0;
  return ({path}) => {
    if (!(path in fileToIdMap)) {
      fileToIdMap[path] = nextId;
      nextId += 1;
    }
    return fileToIdMap[path];
  };
}

function getMainModule({dependencies, numPrependedDependencies = 0}) {
  return dependencies[numPrependedDependencies];
}

function debouncedTick(progressBar) {
  let n = 0;
  let start, total;

  return (_, t) => {
    total = t;
    n += 1;
    if (start) {
      if (progressBar.curr + n >= total || Date.now() - start > 200) {
        progressBar.total = total;
        progressBar.tick(n);
        start = n = 0;
      }
    } else {
      start = Date.now();
    }
  };
}

function filterObject(object, blacklist) {
  const copied = Object.assign({}, object);
  for (const key of blacklist) {
    delete copied[key];
  }
  return copied;
}

module.exports = Bundler;

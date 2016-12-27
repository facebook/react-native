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

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const Cache = require('../node-haste').Cache;
const Transformer = require('../JSTransformer');
const Resolver = require('../Resolver');
const Bundle = require('./Bundle');
const HMRBundle = require('./HMRBundle');
const ModuleTransport = require('../lib/ModuleTransport');
const declareOpts = require('../lib/declareOpts');
const imageSize = require('image-size');
const path = require('path');
const version = require('../../../../package.json').version;
const denodeify = require('denodeify');
const defaults = require('../../../defaults');

const {
  sep: pathSeparator,
  join: joinPath,
  relative: relativePath,
  dirname: pathDirname,
  extname,
} = require('path');

import type AssetServer from '../AssetServer';
import type Module from '../node-haste/Module';
import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {Reporter} from '../lib/reporting';

export type GetTransformOptions<T> = (
  string,
  Object,
  string => Promise<Array<string>>,
) => T | Promise<T>;

const sizeOf = denodeify(imageSize);

const noop = () => {};

const {
  createActionStartEntry,
  createActionEndEntry,
  log,
} = require('../Logger');

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
  assetExts: {
    type: 'array',
    default: ['png'],
  },
  platforms: {
    type: 'array',
    default: defaults.platforms,
  },
  watch: {
    type: 'boolean',
    default: false,
  },
  assetServer: {
    type: 'object',
    required: true,
  },
  transformTimeoutInterval: {
    type: 'number',
    required: false,
  },
  allowBundleUpdates: {
    type: 'boolean',
    default: false,
  },
  reporter: {
    type: 'object',
  },
});

const assetPropertyBlacklist = new Set([
  'files',
  'fileSystemLocation',
  'path',
]);

type Options = {
  allowBundleUpdates: boolean,
  assetExts: Array<string>,
  assetServer: AssetServer,
  blacklistRE: RegExp,
  cacheVersion: string,
  extraNodeModules: {},
  getTransformOptions?: GetTransformOptions<*>,
  moduleFormat: string,
  platforms: Array<string>,
  polyfillModuleNames: Array<string>,
  projectRoots: Array<string>,
  reporter: Reporter,
  resetCache: boolean,
  transformModulePath: string,
  transformTimeoutInterval: ?number,
  watch: boolean,
};

class Bundler {

  _opts: Options;
  _getModuleId: (opts: Module) => number;
  _cache: Cache;
  _transformer: Transformer;
  _resolver: Resolver;
  _projectRoots: Array<string>;
  _assetServer: AssetServer;
  _getTransformOptions: void | GetTransformOptions<*>;

  constructor(options: Options) {
    const opts = this._opts = validateOpts(options);

    opts.projectRoots.forEach(verifyRootExists);

    let transformModuleHash;
    try {
      const transformModuleStr = fs.readFileSync(opts.transformModulePath);
      transformModuleHash =
        crypto.createHash('sha1').update(transformModuleStr).digest('hex');
    } catch (error) {
      transformModuleHash = '';
    }

    const stableProjectRoots = opts.projectRoots.map(p => {
      return path.relative(path.join(__dirname, '../../../..'), p);
    });

    const cacheKeyParts =  [
      'react-packager-cache',
      version,
      opts.cacheVersion,
      stableProjectRoots.join(',').split(pathSeparator).join('-'),
      transformModuleHash,
    ];

    this._getModuleId = createModuleIdFactory();

    if (opts.transformModulePath) {
      /* $FlowFixMe: dynamic requires prevent static typing :'(  */
      const transformer = require(opts.transformModulePath);
      if (typeof transformer.cacheKey !== 'undefined') {
        cacheKeyParts.push(transformer.cacheKey);
      }
    }

    const transformCacheKey = crypto.createHash('sha1').update(
      cacheKeyParts.join('$'),
    ).digest('hex');

    this._cache = new Cache({
      resetCache: opts.resetCache,
      cacheKey: transformCacheKey,
    });

    this._transformer = new Transformer({
      transformModulePath: opts.transformModulePath,
    });

    this._resolver = new Resolver({
      assetExts: opts.assetExts,
      blacklistRE: opts.blacklistRE,
      cache: this._cache,
      extraNodeModules: opts.extraNodeModules,
      minifyCode: this._transformer.minify,
      moduleFormat: opts.moduleFormat,
      platforms: opts.platforms,
      polyfillModuleNames: opts.polyfillModuleNames,
      projectRoots: opts.projectRoots,
      reporter: options.reporter,
      resetCache: opts.resetCache,
      transformCacheKey,
      transformCode:
        (module, code, transformCodeOptions) => this._transformer.transformFile(
          module.path,
          code,
          transformCodeOptions,
        ),
      watch: opts.watch,
    });

    this._projectRoots = opts.projectRoots;
    this._assetServer = opts.assetServer;

    this._getTransformOptions = opts.getTransformOptions;
  }

  end() {
    this._transformer.kill();
    return Promise.all([
      this._cache.end(),
      this.getResolver().getDependencyGraph().getWatcher().end(),
    ]);
  }

  bundle(options: {
    dev: boolean,
    minify: boolean,
    unbundle: boolean,
    sourceMapUrl: string,
  }) {
    const {dev, minify, unbundle} = options;
    const moduleSystemDeps =
      this._resolver.getModuleSystemDependencies({dev, unbundle});
    return this._bundle({
      ...options,
      bundle: new Bundle({dev, minify, sourceMapUrl: options.sourceMapUrl}),
      moduleSystemDeps,
    });
  }

  _sourceHMRURL(platform, hmrpath) {
    return this._hmrURL(
      '',
      platform,
      'bundle',
      hmrpath,
    );
  }

  _sourceMappingHMRURL(platform, hmrpath) {
    // Chrome expects `sourceURL` when eval'ing code
    return this._hmrURL(
      '\/\/# sourceURL=',
      platform,
      'map',
      hmrpath,
    );
  }

  _hmrURL(prefix, platform, extensionOverride, filePath) {
    const matchingRoot = this._projectRoots.find(root => filePath.startsWith(root));

    if (!matchingRoot) {
      throw new Error('No matching project root for ', filePath);
    }

    // Replaces '\' with '/' for Windows paths.
    if (pathSeparator === '\\') {
      filePath = filePath.replace(/\\/g, '/');
    }

    const extensionStart = filePath.lastIndexOf('.');
    const resource = filePath.substring(
      matchingRoot.length,
      extensionStart !== -1 ? extensionStart : undefined,
    );

    return (
      prefix + resource +
      '.' + extensionOverride + '?' +
      'platform=' + platform + '&runModule=false&entryModuleOnly=true&hot=true'
    );
  }

  hmrBundle(options: {platform: ?string}, host: string, port: number) {
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
    onProgress,
  }) {
    const onResolutionResponse = (response: ResolutionResponse) => {
      /* $FlowFixMe: looks like ResolutionResponse is monkey-patched
       * with `getModuleId`. */
      bundle.setMainModuleId(response.getModuleId(getMainModule(response)));
      if (entryModuleOnly) {
        response.dependencies = response.dependencies.filter(module =>
          module.path.endsWith(entryFile)
        );
      } else {
        response.dependencies = moduleSystemDeps.concat(response.dependencies);
      }
    };
    const finalizeBundle = ({bundle: finalBundle, transformedModules, response, modulesByName}: {
      bundle: Bundle,
      transformedModules: Array<{module: Module, transformed: ModuleTransport}>,
      response: ResolutionResponse,
      modulesByName: {[name: string]: Module},
    }) =>
      Promise.all(
        transformedModules.map(({module, transformed}) =>
          finalBundle.addModule(this._resolver, response, module, transformed)
        )
      ).then(() => {
        const runBeforeMainModuleIds = Array.isArray(runBeforeMainModule)
          ? runBeforeMainModule
              .map(name => modulesByName[name])
              .filter(Boolean)
              .map(response.getModuleId)
          : undefined;

        finalBundle.finalize({
          runMainModule,
          runBeforeMainModule: runBeforeMainModuleIds,
          allowUpdates: this._opts.allowBundleUpdates,
        });
        return finalBundle;
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
      onProgress,
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
    onProgress = noop,
  }: *) {
    const transformingFilesLogEntry =
      log(createActionStartEntry({
        action_name: 'Transforming files',
        entry_point: entryFile,
        environment: dev ? 'dev' : 'prod',
      }));

    const modulesByName = Object.create(null);

    if (!resolutionResponse) {
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

      log(createActionEndEntry(transformingFilesLogEntry));
      onResolutionResponse(response);

      // get entry file complete path (`entryFile` is relative to roots)
      let entryFilePath;
      if (response.dependencies.length > 1) { // skip HMR requests
        const numModuleSystemDependencies =
          this._resolver.getModuleSystemDependencies({dev, unbundle}).length;

        const dependencyIndex =
          (response.numPrependedDependencies || 0) + numModuleSystemDependencies;

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
          /* $FlowFixMe: `getModuleId` is monkey-patched */
          getModuleId: (response.getModuleId: () => number),
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

  invalidateFile(filePath: string) {
    this._cache.invalidate(filePath);
  }

  getShallowDependencies({
    entryFile,
    platform,
    dev = true,
    minify = !dev,
    hot = false,
    generateSourceMaps = false,
  }: {
    entryFile: string,
    platform: string,
    dev?: boolean,
    minify?: boolean,
    hot?: boolean,
    generateSourceMaps?: boolean,
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

  getModuleForPath(entryFile: string) {
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
  }: {
    entryFile: string,
    platform: string,
    dev?: boolean,
    minify?: boolean,
    hot?: boolean,
    recursive?: boolean,
    generateSourceMaps?: boolean,
    isolateModuleIDs?: boolean,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
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

  getOrderedDependencyPaths({ entryFile, dev, platform }: {
    entryFile: string,
    dev: boolean,
    platform: string,
  }) {
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
  }: {
    module: Module,
    bundle: Bundle,
    entryFilePath: string,
    transformOptions: TransformOptions,
    getModuleId: () => number,
    dependencyPairs: Array<[mixed, {path: string}]>,
    assetPlugins: Array<string>,
  }): Promise<ModuleTransport> {
    let moduleTransport;
    const moduleId = getModuleId(module);

    if (module.isAsset()) {
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

  _generateAssetObjAndCode(module, assetPlugins, platform: ?string = null) {
    const relPath = getPathRelativeToRoot(this._projectRoots, module.path);
    var assetUrlPath = joinPath('/assets', pathDirname(relPath));

    // On Windows, change backslashes to slashes to get proper URL path from file path.
    if (pathSeparator === '\\') {
      assetUrlPath = assetUrlPath.replace(/\\/g, '/');
    }

    // Test extension against all types supported by image-size module.
    // If it's not one of these, we won't treat it as an image.
    const isImage = [
      'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'
    ].indexOf(extname(module.path).slice(1)) !== -1;

    return this._assetServer.getAssetData(relPath, platform).then((assetData) => {
      return Promise.all([isImage ? sizeOf(assetData.files[0]) : null, assetData]);
    }).then((res) => {
      const dimensions = res[0];
      const assetData = res[1];
      const scale = assetData.scales[0];
      const asset = {
        __packager_asset: true,
        fileSystemLocation: pathDirname(module.path),
        httpServerLocation: assetUrlPath,
        width: dimensions ? dimensions.width / scale : undefined,
        height: dimensions ? dimensions.height / scale : undefined,
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

    const [currentAssetPlugin, ...remainingAssetPlugins] = assetPlugins;
    /* $FlowFixMe: dynamic requires prevent static typing :'(  */
    const assetPluginFunction = require(currentAssetPlugin);
    const result = assetPluginFunction(asset);

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

  _generateAssetModule(
    bundle: Bundle,
    module: Module,
    moduleId: number,
    assetPlugins: Array<string> = [],
    platform: ?string = null,
  ) {
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

  getTransformOptions(
    mainModuleName: string,
    options: {
      dev?: boolean,
      platform: string,
      hot?: boolean,
      generateSourceMaps?: boolean,
    },
  ) {
    const getDependencies = (entryFile: string) =>
      this.getDependencies({...options, entryFile})
        .then(r => r.dependencies.map(d => d.path));
    const extraOptions = this._getTransformOptions
      ? this._getTransformOptions(mainModuleName, options, getDependencies)
      : null;
    return Promise.resolve(extraOptions)
      .then(extraOpts => Object.assign(options, extraOpts));
  }

  getResolver() {
    return this._resolver;
  }
}

function getPathRelativeToRoot(roots, absPath) {
  for (let i = 0; i < roots.length; i++) {
    const relPath = relativePath(roots[i], absPath);
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
  return ({path: modulePath}) => {
    if (!(modulePath in fileToIdMap)) {
      fileToIdMap[modulePath] = nextId;
      nextId += 1;
    }
    return fileToIdMap[modulePath];
  };
}

function getMainModule({dependencies, numPrependedDependencies = 0}) {
  return dependencies[numPrependedDependencies];
}

function filterObject(object, blacklist) {
  const copied = Object.assign({}, object);
  for (const key of blacklist) {
    delete copied[key];
  }
  return copied;
}

module.exports = Bundler;

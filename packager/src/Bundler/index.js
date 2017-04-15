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
const debug = require('debug')('RNP:Bundler');
const fs = require('fs');
const Cache = require('../node-haste').Cache;
const Transformer = require('../JSTransformer');
const Resolver = require('../Resolver');
const Bundle = require('./Bundle');
const HMRBundle = require('./HMRBundle');
const ModuleTransport = require('../lib/ModuleTransport');
const imageSize = require('image-size');
const path = require('path');
const denodeify = require('denodeify');
const defaults = require('../../defaults');
const os = require('os');
const invariant = require('fbjs/lib/invariant');

const {
  sep: pathSeparator,
  join: joinPath,
  relative: relativePath,
  dirname: pathDirname,
  extname,
} = require('path');

const VERSION = require('../../package.json').version;

import type AssetServer from '../AssetServer';
import type Module, {HasteImpl} from '../node-haste/Module';
import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type {
  Options as JSTransformerOptions,
  TransformOptions,
} from '../JSTransformer/worker/worker';
import type {Reporter} from '../lib/reporting';
import type {GlobalTransformCache} from '../lib/GlobalTransformCache';

export type ExtraTransformOptions = {
  +inlineRequires?: {+blacklist: {[string]: true}} | boolean,
  +preloadedModules?: Array<string> | false,
  +ramGroups?: Array<string>,
};

export type GetTransformOptions = (
  mainModuleName: string,
  options: {},
  getDependencies: string => Promise<Array<string>>,
) => ExtraTransformOptions | Promise<ExtraTransformOptions>;

type Asset = {
  __packager_asset: boolean,
  fileSystemLocation: string,
  httpServerLocation: string,
  width: ?number,
  height: ?number,
  scales: number,
  files: Array<string>,
  hash: string,
  name: string,
  type: string,
};

const sizeOf = denodeify(imageSize);

const noop = () => {};

const {
  createActionStartEntry,
  createActionEndEntry,
  log,
} = require('../Logger');

const assetPropertyBlacklist = new Set([
  'files',
  'fileSystemLocation',
  'path',
]);

type Options = {|
  +allowBundleUpdates: boolean,
  +assetExts: Array<string>,
  +assetServer: AssetServer,
  +blacklistRE?: RegExp,
  +cacheVersion: string,
  +extraNodeModules: {},
  +getTransformOptions?: GetTransformOptions,
  +globalTransformCache: ?GlobalTransformCache,
  +hasteImpl?: HasteImpl,
  +platforms: Array<string>,
  +polyfillModuleNames: Array<string>,
  +projectRoots: Array<string>,
  +providesModuleNodeModules?: Array<string>,
  +reporter: Reporter,
  +resetCache: boolean,
  +transformModulePath?: string,
  +transformTimeoutInterval: ?number,
  +watch: boolean,
|};

class Bundler {

  _opts: Options;
  _getModuleId: (opts: Module) => number;
  _cache: Cache;
  _transformer: Transformer;
  _resolverPromise: Promise<Resolver>;
  _projectRoots: Array<string>;
  _assetServer: AssetServer;
  _getTransformOptions: void | GetTransformOptions;

  constructor(opts: Options) {
    this._opts = opts;

    opts.projectRoots.forEach(verifyRootExists);

    let transformModuleHash;
    try {
      /* $FlowFixMe: if transformModulePath is null it'll just be caught */
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
      VERSION,
      opts.cacheVersion,
      stableProjectRoots.join(',').split(pathSeparator).join('-'),
      transformModuleHash,
    ];

    this._getModuleId = createModuleIdFactory();

    let getCacheKey = () => '';
    if (opts.transformModulePath) {
      /* $FlowFixMe: dynamic requires prevent static typing :'(  */
      const transformer = require(opts.transformModulePath);
      if (typeof transformer.getCacheKey !== 'undefined') {
        getCacheKey = transformer.getCacheKey;
      }
    }

    const transformCacheKey = crypto.createHash('sha1').update(
      cacheKeyParts.join('$'),
    ).digest('hex');

    debug(`Using transform cache key "${transformCacheKey}"`);

    this._cache = new Cache({
      resetCache: opts.resetCache,
      cacheKey: transformCacheKey,
    });

    const maxWorkerCount = Bundler.getMaxWorkerCount();

    /* $FlowFixMe: in practice it's always here. */
    this._transformer = new Transformer(opts.transformModulePath, maxWorkerCount);

    const getTransformCacheKey = (src, filename, options) => {
      return transformCacheKey + getCacheKey(src, filename, options);
    };

    this._resolverPromise = Resolver.load({
      assetExts: opts.assetExts,
      blacklistRE: opts.blacklistRE,
      cache: this._cache,
      extraNodeModules: opts.extraNodeModules,
      getTransformCacheKey,
      globalTransformCache: opts.globalTransformCache,
      hasteImpl: opts.hasteImpl,
      maxWorkerCount,
      minifyCode: this._transformer.minify,
      platforms: new Set(opts.platforms),
      polyfillModuleNames: opts.polyfillModuleNames,
      projectRoots: opts.projectRoots,
      providesModuleNodeModules:
        opts.providesModuleNodeModules || defaults.providesModuleNodeModules,
      reporter: opts.reporter,
      resetCache: opts.resetCache,
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
      this._resolverPromise.then(
        resolver => resolver.getDependencyGraph().getWatcher().end(),
      ),
    ]);
  }

  bundle(options: {
    dev: boolean,
    minify: boolean,
    unbundle: boolean,
    sourceMapUrl: ?string,
  }): Promise<Bundle> {
    const {dev, minify, unbundle} = options;
    return this._resolverPromise.then(
      resolver => resolver.getModuleSystemDependencies({dev, unbundle}),
    ).then(moduleSystemDeps => this._bundle({
      ...options,
      bundle: new Bundle({dev, minify, sourceMapUrl: options.sourceMapUrl}),
      moduleSystemDeps,
    }));
  }

  _sourceHMRURL(platform: ?string, hmrpath: string) {
    return this._hmrURL(
      '',
      platform,
      'bundle',
      hmrpath,
    );
  }

  _sourceMappingHMRURL(platform: ?string, hmrpath: string) {
    // Chrome expects `sourceURL` when eval'ing code
    return this._hmrURL(
      '\/\/# sourceURL=',
      platform,
      'map',
      hmrpath,
    );
  }

  _hmrURL(prefix: string, platform: ?string, extensionOverride: string, filePath: string) {
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
      'platform=' + (platform || '') + '&runModule=false&entryModuleOnly=true&hot=true'
    );
  }

  hmrBundle(options: {platform: ?string}, host: string, port: number): Promise<HMRBundle> {
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
    assetPlugins,
    bundle,
    dev,
    entryFile,
    entryModuleOnly,
    generateSourceMaps,
    hot,
    isolateModuleIDs,
    minify,
    moduleSystemDeps = [],
    onProgress,
    platform,
    resolutionResponse,
    runBeforeMainModule,
    runModule,
    unbundle,
  }: {
    assetPlugins?: Array<string>,
    bundle: Bundle,
    dev: boolean,
    entryFile?: string,
    entryModuleOnly?: boolean,
    generateSourceMaps?: boolean,
    hot?: boolean,
    isolateModuleIDs?: boolean,
    minify?: boolean,
    moduleSystemDeps?: Array<Module>,
    onProgress?: () => void,
    platform?: ?string,
    resolutionResponse?: ResolutionResponse<Module>,
    runBeforeMainModule?: boolean,
    runModule?: boolean,
    unbundle?: boolean,
  }) {
    const onResolutionResponse = (response: ResolutionResponse<Module>) => {
      /* $FlowFixMe: looks like ResolutionResponse is monkey-patched
       * with `getModuleId`. */
      bundle.setMainModuleId(response.getModuleId(getMainModule(response)));
      if (entryModuleOnly && entryFile) {
        response.dependencies = response.dependencies.filter(module =>
          module.path.endsWith(entryFile || '')
        );
      } else {
        response.dependencies = moduleSystemDeps.concat(response.dependencies);
      }
    };
    const finalizeBundle = ({bundle: finalBundle, transformedModules, response, modulesByName}: {
      bundle: Bundle,
      transformedModules: Array<{module: Module, transformed: ModuleTransport}>,
      response: ResolutionResponse<Module>,
      modulesByName: {[name: string]: Module},
    }) =>
      this._resolverPromise.then(resolver => Promise.all(
        transformedModules.map(({module, transformed}) =>
          finalBundle.addModule(resolver, response, module, transformed)
        )
      )).then(() => {
        const runBeforeMainModuleIds = Array.isArray(runBeforeMainModule)
          ? runBeforeMainModule
              .map(name => modulesByName[name])
              .filter(Boolean)
              .map(response.getModuleId)
          : undefined;

        finalBundle.finalize({
          runModule,
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
        generateSourceMaps: unbundle || minify || generateSourceMaps,
      });
    }

    return Promise.all(
      [this._resolverPromise, resolutionResponse],
    ).then(([resolver, response]) => {
      bundle.setRamGroups(response.transformOptions.transform.ramGroups);

      log(createActionEndEntry(transformingFilesLogEntry));
      onResolutionResponse(response);

      // get entry file complete path (`entryFile` is relative to roots)
      let entryFilePath;
      if (response.dependencies.length > 1) { // skip HMR requests
        const numModuleSystemDependencies =
          resolver.getModuleSystemDependencies({dev, unbundle}).length;

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
  }): Promise<Array<Module>> {
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

      return this._resolverPromise.then(
        resolver => resolver.getShallowDependencies(entryFile, transformOptions),
      );
    });
  }

  getModuleForPath(entryFile: string): Promise<Module> {
    return this._resolverPromise.then(resolver => resolver.getModuleForPath(entryFile));
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

      return this._resolverPromise.then(resolver => resolver.getDependencies(
        entryFile,
        {dev, platform, recursive},
        transformOptions,
        onProgress,
        isolateModuleIDs ? createModuleIdFactory() : this._getModuleId,
      ));
    });
  }

  getOrderedDependencyPaths({entryFile, dev, platform}: {
    entryFile: string,
    dev: boolean,
    platform: string,
  }) {
    return this.getDependencies({entryFile, dev, platform}).then(
      ({dependencies}) => {
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
          assetsData.forEach(({files}) => {
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
    transformOptions: JSTransformerOptions,
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
        sourcePath: module.path,
      });
    });
  }

  _generateAssetObjAndCode(
    module: Module,
    assetPlugins: Array<string>,
    platform: ?string = null,
  ) {
    const relPath = getPathRelativeToRoot(this._projectRoots, module.path);
    var assetUrlPath = joinPath('/assets', pathDirname(relPath));

    // On Windows, change backslashes to slashes to get proper URL path from file path.
    if (pathSeparator === '\\') {
      assetUrlPath = assetUrlPath.replace(/\\/g, '/');
    }

    // Test extension against all types supported by image-size module.
    // If it's not one of these, we won't treat it as an image.
    const isImage = [
      'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff',
    ].indexOf(extname(module.path).slice(1)) !== -1;

    return this._assetServer.getAssetData(relPath, platform).then(assetData => {
      return Promise.all([isImage ? sizeOf(assetData.files[0]) : null, assetData]);
    }).then(res => {
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
    }).then(asset => {
      const json =  JSON.stringify(filterObject(asset, assetPropertyBlacklist));
      const assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';
      const code =
        `module.exports = require(${JSON.stringify(assetRegistryPath)}).registerAsset(${json});`;
      const dependencies = [assetRegistryPath];
      const dependencyOffsets = [code.indexOf(assetRegistryPath) - 1];

      return {
        asset,
        code,
        meta: {dependencies, dependencyOffsets},
      };
    });
  }

  _applyAssetPlugins(
    assetPlugins: Array<string>,
    asset: Asset,
  ) {
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
        meta,
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
      generateSourceMaps?: boolean,
      hot?: boolean,
      platform: string,
      projectRoots: Array<string>,
    },
  ): Promise<TransformOptions> {
    const getDependencies = (entryFile: string) =>
      this.getDependencies({...options, entryFile})
        .then(r => r.dependencies.map(d => d.path));
    const extraOptions = this._getTransformOptions
      ? this._getTransformOptions(mainModuleName, options, getDependencies)
      : null;
    return Promise.resolve(extraOptions)
      .then(extraOpts => {
        return {...options, ...extraOpts};
      });
  }

  getResolver(): Promise<Resolver> {
    return this._resolverPromise;
  }

  /**
   * Unless overriden, we use a diminishing amount of workers per core, because
   * using more and more of them does not scale much. Ex. 6 workers for 8
   * cores, or 14 workers for 24 cores.
   */
  static getMaxWorkerCount() {
    const cores = os.cpus().length;
    const envStr = process.env.REACT_NATIVE_MAX_WORKERS;
    if (envStr == null) {
      return Math.max(1, Math.ceil(cores * (0.5 + 0.5 * Math.exp(-cores * 0.07)) - 1));
    }
    const envCount = parseInt(process.env.REACT_NATIVE_MAX_WORKERS, 10);
    invariant(
      Number.isInteger(envCount),
      'environment variable `REACT_NATIVE_MAX_WORKERS` must be a valid integer',
    );
    return Math.min(cores, envCount);
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

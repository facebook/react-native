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
const emptyFunction = require('fbjs/lib/emptyFunction');
const fs = require('fs');
const Transformer = require('../JSTransformer');
const Resolver = require('../Resolver');
const Bundle = require('./Bundle');
const HMRBundle = require('./HMRBundle');
const ModuleTransport = require('../lib/ModuleTransport');
const imageSize = require('image-size');
const path = require('path');
const denodeify = require('denodeify');
const defaults = require('../defaults');
const os = require('os');
const invariant = require('fbjs/lib/invariant');
const toLocalPath = require('../node-haste/lib/toLocalPath');

const {generateAssetTransformResult, isAssetTypeAnImage} = require('./util');

const {
  sep: pathSeparator,
  join: joinPath,
  dirname: pathDirname,
  extname,
} = require('path');

const VERSION = require('../../package.json').version;

import type AssetServer from '../AssetServer';
import type Module, {HasteImpl} from '../node-haste/Module';
import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type {MappingsMap} from '../lib/SourceMap';
import type {Options as JSTransformerOptions} from '../JSTransformer/worker';
import type {Reporter} from '../lib/reporting';
import type {TransformCache} from '../lib/TransformCaching';
import type {GlobalTransformCache} from '../lib/GlobalTransformCache';

export type BundlingOptions = {|
  +preloadedModules: ?{[string]: true} | false,
  +ramGroups: ?Array<string>,
  +transformer: JSTransformerOptions,
|};

export type ExtraTransformOptions = {
  +preloadedModules?: {[path: string]: true} | false,
  +ramGroups?: Array<string>,
  +transform?: {+inlineRequires?: {+blacklist: {[string]: true}} | boolean},
};

export type GetTransformOptionsOpts = {|
  dev: boolean,
  hot: boolean,
  platform: ?string,
|};

export type GetTransformOptions = (
  mainModuleName: string,
  options: GetTransformOptionsOpts,
  getDependenciesOf: string => Promise<Array<string>>,
) => Promise<ExtraTransformOptions>;

export type AssetDescriptor = {
  +__packager_asset: boolean,
  +httpServerLocation: string,
  +width: ?number,
  +height: ?number,
  +scales: Array<number>,
  +hash: string,
  +name: string,
  +type: string,
};

export type ExtendedAssetDescriptor = AssetDescriptor & {
  +fileSystemLocation: string,
  +files: Array<string>,
};

const sizeOf = denodeify(imageSize);

const {
  createActionStartEntry,
  createActionEndEntry,
  log,
} = require('../Logger');

export type PostProcessModulesOptions = {|
  dev: boolean,
  minify: boolean,
  platform: string,
|};

export type PostProcessModules = (
  modules: Array<ModuleTransport>,
  entryFile: string,
  options: PostProcessModulesOptions,
) => Array<ModuleTransport>;

export type PostMinifyProcess = ({
  code: string,
  map: MappingsMap,
}) => {code: string, map: MappingsMap};

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
  +postMinifyProcess: PostMinifyProcess,
  +postProcessModules?: PostProcessModules,
  +projectRoots: $ReadOnlyArray<string>,
  +providesModuleNodeModules?: Array<string>,
  +reporter: Reporter,
  +resetCache: boolean,
  +sourceExts: Array<string>,
  +transformCache: TransformCache,
  +transformModulePath: string,
  +transformTimeoutInterval: ?number,
  +watch: boolean,
  +workerPath: ?string,
|};

const {hasOwnProperty} = Object;

class Bundler {

  _opts: Options;
  _getModuleId: (opts: Module) => number;
  _transformer: Transformer;
  _resolverPromise: Promise<Resolver>;
  _projectRoots: $ReadOnlyArray<string>;
  _assetServer: AssetServer;
  _getTransformOptions: void | GetTransformOptions;

  constructor(opts: Options) {
    this._opts = opts;

    opts.projectRoots.forEach(verifyRootExists);

    const transformModuleStr = fs.readFileSync(opts.transformModulePath);
    const transformModuleHash =
      crypto.createHash('sha1').update(transformModuleStr).digest('hex');

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

    let getCacheKey = (options: mixed) => '';
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

    const maxWorkerCount = Bundler.getMaxWorkerCount();

    this._transformer = new Transformer(
      opts.transformModulePath,
      maxWorkerCount,
      {
        stdoutChunk: chunk => opts.reporter.update({type: 'worker_stdout_chunk', chunk}),
        stderrChunk: chunk => opts.reporter.update({type: 'worker_stderr_chunk', chunk}),
      },
      opts.workerPath,
    );

    const getTransformCacheKey = options => {
      return transformCacheKey + getCacheKey(options);
    };

    this._resolverPromise = Resolver.load({
      assetExts: opts.assetExts,
      blacklistRE: opts.blacklistRE,
      extraNodeModules: opts.extraNodeModules,
      getTransformCacheKey,
      globalTransformCache: opts.globalTransformCache,
      hasteImpl: opts.hasteImpl,
      maxWorkerCount,
      minifyCode: this._transformer.minify,
      postMinifyProcess: this._opts.postMinifyProcess,
      platforms: new Set(opts.platforms),
      polyfillModuleNames: opts.polyfillModuleNames,
      projectRoots: opts.projectRoots,
      providesModuleNodeModules:
        opts.providesModuleNodeModules || defaults.providesModuleNodeModules,
      reporter: opts.reporter,
      resetCache: opts.resetCache,
      sourceExts: opts.sourceExts,
      transformCode:
        (module, code, transformCodeOptions) => this._transformer.transformFile(
          module.path,
          module.localPath,
          code,
          transformCodeOptions,
        ),
      transformCache: opts.transformCache,
      watch: opts.watch,
    });

    this._projectRoots = opts.projectRoots;
    this._assetServer = opts.assetServer;

    this._getTransformOptions = opts.getTransformOptions;
  }

  end() {
    this._transformer.kill();
    return this._resolverPromise.then(
      resolver => resolver.getDependencyGraph().getWatcher().end(),
    );
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
      throw new Error('No matching project root for ' + filePath);
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
    bundle: Bundle | HMRBundle,
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
    resolutionResponse?: ResolutionResponse<Module, BundlingOptions>,
    runBeforeMainModule?: boolean,
    runModule?: boolean,
    unbundle?: boolean,
  }) {
    const onResolutionResponse = (response: ResolutionResponse<Module, BundlingOptions>) => {
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
      response: ResolutionResponse<Module, BundlingOptions>,
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
    onResolutionResponse = emptyFunction,
    onModuleTransformed = emptyFunction,
    finalizeBundle = emptyFunction,
    onProgress = emptyFunction,
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
      bundle.setRamGroups(response.options.ramGroups);

      log(createActionEndEntry(transformingFilesLogEntry));
      onResolutionResponse(response);

      // get entry file complete path (`entryFile` is a local path, i.e. relative to roots)
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

      const modulesByTransport: Map<ModuleTransport, Module> = new Map();
      const toModuleTransport: Module => Promise<ModuleTransport> =
        module =>
          this._toModuleTransport({
            module,
            bundle,
            entryFilePath,
            assetPlugins,
            options: response.options,
            /* $FlowFixMe: `getModuleId` is monkey-patched */
            getModuleId: (response.getModuleId: () => number),
            dependencyPairs: response.getResolvedDependencyPairs(module),
          }).then(transformed => {
            modulesByTransport.set(transformed, module);
            modulesByName[transformed.name] = module;
            onModuleTransformed({
              module,
              response,
              bundle,
              transformed,
            });
            return transformed;
          });

      const p = this._opts.postProcessModules;
      const postProcess = p
        ? modules => p(modules, entryFile, {dev, minify, platform})
        : null;

      return Promise.all(response.dependencies.map(toModuleTransport))
        .then(postProcess)
        .then(moduleTransports => {
          const transformedModules = moduleTransports.map(transformed => ({
            module: modulesByTransport.get(transformed),
            transformed,
          }));
          return finalizeBundle({bundle, transformedModules, response, modulesByName});
        }).then(() => bundle);
    });
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
    platform: ?string,
    dev?: boolean,
    minify?: boolean,
    hot?: boolean,
    generateSourceMaps?: boolean,
  }): Promise<Array<Module>> {
    return this.getTransformOptions(
      entryFile,
      {
        dev,
        generateSourceMaps,
        hot,
        minify,
        platform,
        projectRoots: this._projectRoots,
      },
    ).then(bundlingOptions =>
      this._resolverPromise.then(resolver =>
        resolver.getShallowDependencies(entryFile, bundlingOptions.transformer),
      )
    );
  }

  getModuleForPath(entryFile: string): Promise<Module> {
    return this._resolverPromise.then(resolver => resolver.getModuleForPath(entryFile));
  }

  async getDependencies({
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
    platform: ?string,
    dev?: boolean,
    minify?: boolean,
    hot?: boolean,
    recursive?: boolean,
    generateSourceMaps?: boolean,
    isolateModuleIDs?: boolean,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
  }): Promise<ResolutionResponse<Module, BundlingOptions>> {
    const bundlingOptions: BundlingOptions = await this.getTransformOptions(
      entryFile,
      {
        dev,
        platform,
        hot,
        generateSourceMaps,
        minify,
        projectRoots: this._projectRoots,
      },
    );

    const resolver = await this._resolverPromise;
    const response = await resolver.getDependencies(
      entryFile,
      {dev, platform, recursive},
      bundlingOptions,
      onProgress,
      isolateModuleIDs ? createModuleIdFactory() : this._getModuleId,
    );
    return response;
  }

  getOrderedDependencyPaths({entryFile, dev, platform, minify, generateSourceMaps}: {
    +entryFile: string,
    +dev: boolean,
    +platform: string,
    +minify: boolean,
    +generateSourceMaps: boolean,
  }) {
    return this.getDependencies({entryFile, dev, platform, minify, generateSourceMaps}).then(
      ({dependencies}) => {
        const ret = [];
        const promises = [];
        const placeHolder = {};
        dependencies.forEach(dep => {
          if (dep.isAsset()) {
            const localPath = toLocalPath(
              this._projectRoots,
              dep.path
            );
            promises.push(
              this._assetServer.getAssetData(localPath, platform)
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
    options,
    getModuleId,
    dependencyPairs,
    assetPlugins,
  }: {
    module: Module,
    bundle: Bundle,
    entryFilePath: string,
    options: BundlingOptions,
    getModuleId: (module: Module) => number,
    dependencyPairs: Array<[string, Module]>,
    assetPlugins: Array<string>,
  }): Promise<ModuleTransport> {
    let moduleTransport;
    const moduleId = getModuleId(module);
    const transformOptions = options.transformer;

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
      const {preloadedModules} = options;
      const isPolyfill = module.isPolyfill();
      const preloaded =
        module.path === entryFilePath ||
        isPolyfill ||
        preloadedModules && hasOwnProperty.call(preloadedModules, module.path);

      return new ModuleTransport({
        name,
        id: moduleId,
        code,
        map,
        meta: {dependencies, dependencyOffsets, preloaded, dependencyPairs},
        polyfill: isPolyfill,
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
    const localPath = toLocalPath(this._projectRoots, module.path);
    var assetUrlPath = joinPath('/assets', pathDirname(localPath));

    // On Windows, change backslashes to slashes to get proper URL path from file path.
    if (pathSeparator === '\\') {
      assetUrlPath = assetUrlPath.replace(/\\/g, '/');
    }

    const isImage = isAssetTypeAnImage(extname(module.path).slice(1));

    return this._assetServer.getAssetData(localPath, platform).then(assetData => {
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
      const {code, dependencies, dependencyOffsets} = generateAssetTransformResult(asset);
      return {
        asset,
        code,
        meta: {dependencies, dependencyOffsets, preloaded: null},
      };
    });
  }

  _applyAssetPlugins(
    assetPlugins: Array<string>,
    asset: ExtendedAssetDescriptor,
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

  async getTransformOptions(
    mainModuleName: string,
    options: {|
      dev: boolean,
      generateSourceMaps: boolean,
      hot: boolean,
      minify: boolean,
      platform: ?string,
      projectRoots: $ReadOnlyArray<string>,
    |},
    ): Promise<BundlingOptions> {
    const getDependencies = (entryFile: string) =>
      this.getDependencies({...options, entryFile})
        .then(r => r.dependencies.map(d => d.path));

    const {dev, hot, platform} = options;
    const extraOptions: ExtraTransformOptions = this._getTransformOptions
      ? await this._getTransformOptions(mainModuleName, {dev, hot, platform}, getDependencies)
      : {};

    const {transform = {}} = extraOptions;

    return {
      transformer: {
        dev,
        minify: options.minify,
        platform,
        transform: {
          dev,
          generateSourceMaps: options.generateSourceMaps,
          hot,
          inlineRequires: transform.inlineRequires || false,
          platform,
          projectRoot: options.projectRoots[0],
        },
      },
      preloadedModules: extraOptions.preloadedModules,
      ramGroups: extraOptions.ramGroups,
    };
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

module.exports = Bundler;

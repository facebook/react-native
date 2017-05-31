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

const DependencyGraph = require('../node-haste/DependencyGraph');

const defaults = require('../defaults');
const pathJoin = require('path').join;

import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type Module, {HasteImpl, TransformCode} from '../node-haste/Module';
import type {MappingsMap} from '../lib/SourceMap';
import type {PostMinifyProcess} from '../Bundler';
import type {Options as JSTransformerOptions} from '../JSTransformer/worker';
import type {Reporter} from '../lib/reporting';
import type {TransformCache, GetTransformCacheKey} from '../lib/TransformCaching';
import type {GlobalTransformCache} from '../lib/GlobalTransformCache';

type MinifyCode = (filePath: string, code: string, map: MappingsMap) =>
  Promise<{code: string, map: MappingsMap}>;

type ContainsTransformerOptions = {+transformer: JSTransformerOptions}

type Options = {|
  +assetExts: Array<string>,
  +blacklistRE?: RegExp,
  +extraNodeModules: ?{},
  +getTransformCacheKey: GetTransformCacheKey,
  +globalTransformCache: ?GlobalTransformCache,
  +hasteImpl?: HasteImpl,
  +maxWorkerCount: number,
  +minifyCode: MinifyCode,
  +postMinifyProcess: PostMinifyProcess,
  +platforms: Set<string>,
  +polyfillModuleNames?: Array<string>,
  +projectRoots: $ReadOnlyArray<string>,
  +providesModuleNodeModules: Array<string>,
  +reporter: Reporter,
  +resetCache: boolean,
  +sourceExts: Array<string>,
  +transformCache: TransformCache,
  +transformCode: TransformCode,
  +watch: boolean,
|};

class Resolver {

  _depGraph: DependencyGraph;
  _minifyCode: MinifyCode;
  _postMinifyProcess: PostMinifyProcess;
  _polyfillModuleNames: Array<string>;

  constructor(opts: Options, depGraph: DependencyGraph) {
    this._minifyCode = opts.minifyCode;
    this._postMinifyProcess = opts.postMinifyProcess;
    this._polyfillModuleNames = opts.polyfillModuleNames || [];
    this._depGraph = depGraph;
  }

  static async load(opts: Options): Promise<Resolver> {
    const depGraphOpts = Object.assign(Object.create(opts), {
      assetDependencies: ['react-native/Libraries/Image/AssetRegistry'],
      forceNodeFilesystemAPI: false,
      ignoreFilePath(filepath) {
        return filepath.indexOf('__tests__') !== -1 ||
          (opts.blacklistRE != null && opts.blacklistRE.test(filepath));
      },
      moduleOptions: {
        hasteImpl: opts.hasteImpl,
        resetCache: opts.resetCache,
        transformCache: opts.transformCache,
      },
      preferNativePlatform: true,
      roots: opts.projectRoots,
      useWatchman: true,
    });
    const depGraph = await DependencyGraph.load(depGraphOpts);
    return new Resolver(opts, depGraph);
  }

  getShallowDependencies(
    entryFile: string,
    transformOptions: JSTransformerOptions,
  ): Promise<Array<Module>> {
    return this._depGraph.getShallowDependencies(entryFile, transformOptions);
  }

  getModuleForPath(entryFile: string): Module {
    return this._depGraph.getModuleForPath(entryFile);
  }

  getDependencies<T: ContainsTransformerOptions>(
    entryPath: string,
    options: {platform: ?string, recursive?: boolean},
    bundlingOptions: T,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
    getModuleId: mixed,
  ): Promise<ResolutionResponse<Module, T>> {
    const {platform, recursive = true} = options;
    return this._depGraph.getDependencies({
      entryPath,
      platform,
      options: bundlingOptions,
      recursive,
      onProgress,
    }).then(resolutionResponse => {
      this._getPolyfillDependencies().reverse().forEach(
        polyfill => resolutionResponse.prependDependency(polyfill)
      );

      /* $FlowFixMe: monkey patching */
      resolutionResponse.getModuleId = getModuleId;
      return resolutionResponse.finalize();
    });
  }

  getModuleSystemDependencies({dev = true}: {dev?: boolean}): Array<Module> {

    const prelude = dev
        ? pathJoin(__dirname, 'polyfills/prelude_dev.js')
        : pathJoin(__dirname, 'polyfills/prelude.js');

    const moduleSystem = defaults.moduleSystem;

    return [
      prelude,
      moduleSystem,
    ].map(moduleName => this._depGraph.createPolyfill({
      file: moduleName,
      id: moduleName,
      dependencies: [],
    }));
  }

  _getPolyfillDependencies(): Array<Module> {
    const polyfillModuleNames = defaults.polyfills.concat(this._polyfillModuleNames);

    return polyfillModuleNames.map(
      (polyfillModuleName, idx) => this._depGraph.createPolyfill({
        file: polyfillModuleName,
        id: polyfillModuleName,
        dependencies: polyfillModuleNames.slice(0, idx),
      })
    );
  }

  resolveRequires<T: ContainsTransformerOptions>(
    resolutionResponse: ResolutionResponse<Module, T>,
    module: Module,
    code: string,
    dependencyOffsets: Array<number> = [],
  ): string {
    const resolvedDeps = Object.create(null);

    // here, we build a map of all require strings (relative and absolute)
    // to the canonical ID of the module they reference
    resolutionResponse.getResolvedDependencyPairs(module)
      .forEach(([depName, depModule]) => {
        if (depModule) {
          /* $FlowFixMe: `getModuleId` is monkey-patched so may not exist */
          resolvedDeps[depName] = resolutionResponse.getModuleId(depModule);
        }
      });

    // if we have a canonical ID for the module imported here,
    // we use it, so that require() is always called with the same
    // id for every module.
    // Example:
    // -- in a/b.js:
    //    require('./c') => require(3);
    // -- in b/index.js:
    //    require('../a/c') => require(3);
    return dependencyOffsets.reduceRight(
      ([unhandled, handled], offset) => [
        unhandled.slice(0, offset),
        replaceDependencyID(unhandled.slice(offset) + handled, resolvedDeps),
      ],
      [code, ''],
    ).join('');
  }

  wrapModule<T: ContainsTransformerOptions>({
    resolutionResponse,
    module,
    name,
    map,
    code,
    meta = {},
    dev = true,
    minify = false,
  }: {
    resolutionResponse: ResolutionResponse<Module, T>,
    module: Module,
    name: string,
    map: MappingsMap,
    code: string,
    meta?: {
      dependencyOffsets?: Array<number>,
    },
    dev?: boolean,
    minify?: boolean,
  }) {
    if (module.isJSON()) {
      code = `module.exports = ${code}`;
    }

    if (module.isPolyfill()) {
      code = definePolyfillCode(code);
    } else {
      /* $FlowFixMe: `getModuleId` is monkey-patched so may not exist */
      const moduleId = resolutionResponse.getModuleId(module);
      code = this.resolveRequires(
        resolutionResponse,
        module,
        code,
        meta.dependencyOffsets
      );
      code = defineModuleCode(moduleId, code, name, dev);
    }

    return minify
      ? this._minifyCode(module.path, code, map).then(this._postMinifyProcess)
      : Promise.resolve({code, map});
  }

  minifyModule(
    {path, code, map}: {path: string, code: string, map: MappingsMap},
  ): Promise<{code: string, map: MappingsMap}> {
    return this._minifyCode(path, code, map);
  }

  getDependencyGraph(): DependencyGraph {
    return this._depGraph;
  }
}

function defineModuleCode(moduleName, code, verboseName = '', dev = true) {
  return [
    `__d(/* ${verboseName} */`,
    'function(global, require, module, exports) {', // module factory
    code,
    '\n}, ',
    `${JSON.stringify(moduleName)}`, // module id, null = id map. used in ModuleGraph
    dev ? `, null, ${JSON.stringify(verboseName)}` : '',
    ');',
  ].join('');
}

function definePolyfillCode(code) {
  return [
    '(function(global) {',
    code,
    `\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);`,
  ].join('');
}

const reDepencencyString = /^(['"])([^'"']*)\1/;
function replaceDependencyID(stringWithDependencyIDAtStart, resolvedDeps) {
  const match = reDepencencyString.exec(stringWithDependencyIDAtStart);
  const dependencyName = match && match[2];
  if (match != null && dependencyName in resolvedDeps) {
    const {length} = match[0];
    const id = String(resolvedDeps[dependencyName]);
    return (
      padRight(id, length) +
      stringWithDependencyIDAtStart
        .slice(length)
        .replace(/$/m, ` // ${id} = ${dependencyName}`)
    );
  } else {
    return stringWithDependencyIDAtStart;
  }
}

function padRight(string, length) {
  return string.length < length
    ? string + Array(length - string.length + 1).join(' ')
    : string;
}

module.exports = Resolver;

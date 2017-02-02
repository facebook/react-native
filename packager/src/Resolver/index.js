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

const DependencyGraph = require('../node-haste');

const defaults = require('../../defaults');
const pathJoin = require('path').join;

import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type Module from '../node-haste/Module';
import type {SourceMap} from '../lib/SourceMap';
import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {Reporter} from '../lib/reporting';
import type {TransformCode} from '../node-haste/Module';
import type Cache from '../node-haste/Cache';
import type GlobalTransformCache from '../lib/GlobalTransformCache';

type MinifyCode = (filePath: string, code: string, map: SourceMap) =>
  Promise<{code: string, map: SourceMap}>;

type Options = {
  assetExts: Array<string>,
  blacklistRE?: RegExp,
  cache: Cache,
  extraNodeModules?: {},
  globalTransformCache: ?GlobalTransformCache,
  minifyCode: MinifyCode,
  platforms: Array<string>,
  polyfillModuleNames?: Array<string>,
  projectRoots: Array<string>,
  providesModuleNodeModules?: Array<string>,
  reporter: Reporter,
  resetCache: boolean,
  transformCacheKey: string,
  transformCode: TransformCode,
  watch?: boolean,
};

class Resolver {

  _depGraph: DependencyGraph;
  _minifyCode: MinifyCode;
  _polyfillModuleNames: Array<string>;

  constructor(opts: Options) {
    this._depGraph = new DependencyGraph({
      assetDependencies: ['react-native/Libraries/Image/AssetRegistry'],
      assetExts: opts.assetExts,
      cache: opts.cache,
      extraNodeModules: opts.extraNodeModules,
      globalTransformCache: opts.globalTransformCache,
      ignoreFilePath: function(filepath) {
        return filepath.indexOf('__tests__') !== -1 ||
          (opts.blacklistRE != null && opts.blacklistRE.test(filepath));
      },
      moduleOptions: {
        cacheTransformResults: true,
        resetCache: opts.resetCache,
      },
      platforms: opts.platforms,
      preferNativePlatform: true,
      providesModuleNodeModules: opts.providesModuleNodeModules || defaults.providesModuleNodeModules,
      reporter: opts.reporter,
      resetCache: opts.resetCache,
      roots: opts.projectRoots,
      transformCacheKey: opts.transformCacheKey,
      transformCode: opts.transformCode,
      watch: opts.watch || false,
    });

    this._minifyCode = opts.minifyCode;
    this._polyfillModuleNames = opts.polyfillModuleNames || [];

    this._depGraph.load().catch(err => {
      console.error(err.message + '\n' + err.stack);
      process.exit(1);
    });
  }

  getShallowDependencies(
    entryFile: string,
    transformOptions: TransformOptions,
  ): Array<string> {
    return this._depGraph.getShallowDependencies(entryFile, transformOptions);
  }

  getModuleForPath(entryFile: string): Module {
    return this._depGraph.getModuleForPath(entryFile);
  }

  getDependencies(
    entryPath: string,
    options: {platform: string, recursive?: boolean},
    transformOptions: TransformOptions,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
    getModuleId: mixed,
  ): Promise<ResolutionResponse> {
    const {platform, recursive = true} = options;
    return this._depGraph.getDependencies({
      entryPath,
      platform,
      transformOptions,
      recursive,
      onProgress,
    }).then(resolutionResponse => {
      this._getPolyfillDependencies().reverse().forEach(
        polyfill => resolutionResponse.prependDependency(polyfill)
      );

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

  resolveRequires(
    resolutionResponse: ResolutionResponse,
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

  wrapModule({
    resolutionResponse,
    module,
    name,
    map,
    code,
    meta = {},
    dev = true,
    minify = false,
  }: {
    resolutionResponse: ResolutionResponse,
    module: Module,
    name: string,
    map: SourceMap,
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
      ? this._minifyCode(module.path, code, map)
      : Promise.resolve({code, map});
  }

  minifyModule(
    {path, code, map}: {path: string, code: string, map: SourceMap},
  ): Promise<{code: string, map: SourceMap}> {
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

function definePolyfillCode(code,) {
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

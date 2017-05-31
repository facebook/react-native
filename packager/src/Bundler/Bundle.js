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

const BundleBase = require('./BundleBase');
const ModuleTransport = require('../lib/ModuleTransport');

const _ = require('lodash');
const crypto = require('crypto');
const debug = require('debug')('RNP:Bundle');
const invariant = require('fbjs/lib/invariant');

const {createRamBundleGroups} = require('./util');
const {fromRawMappings} = require('./source-map');
const {isMappingsMap} = require('../lib/SourceMap');

import type {IndexMap, MappingsMap, SourceMap} from '../lib/SourceMap';
import type {GetSourceOptions, FinalizeOptions} from './BundleBase';

export type Unbundle = {
  startupModules: Array<*>,
  lazyModules: Array<*>,
  groups: Map<number, Set<number>>,
};

type SourceMapFormat = 'undetermined' | 'indexed' | 'flattened';

const SOURCEMAPPING_URL = '\n\/\/# sourceMappingURL=';

class Bundle extends BundleBase {

  _dev: boolean | void;
  _inlineSourceMap: string | void;
  _minify: boolean | void;
  _numRequireCalls: number;
  _ramBundle: Unbundle | null;
  _ramGroups: ?Array<string>;
  _sourceMap: string | null;
  _sourceMapFormat: SourceMapFormat;
  _sourceMapUrl: ?string;

  constructor({sourceMapUrl, dev, minify, ramGroups}: {
    sourceMapUrl: ?string,
    dev?: boolean,
    minify?: boolean,
    ramGroups?: Array<string>,
  } = {}) {
    super();
    this._sourceMap = null;
    this._sourceMapFormat = 'undetermined';
    this._sourceMapUrl = sourceMapUrl;
    this._numRequireCalls = 0;
    this._dev = dev;
    this._minify = minify;

    this._ramGroups = ramGroups;
    this._ramBundle = null; // cached RAM Bundle
  }

  addModule(
    /**
     * $FlowFixMe: this code is inherently incorrect, because it modifies the
     * signature of the base class function "addModule". That means callsites
     * using an instance typed as the base class would be broken. This must be
     * refactored.
     */
    resolver: {wrapModule: (options: any) => Promise<{code: any, map: any}>},
    resolutionResponse: mixed,
    module: mixed,
    /* $FlowFixMe: erroneous change of signature. */
    moduleTransport: ModuleTransport,
    /* $FlowFixMe: erroneous change of signature. */
  ): Promise<void> {
    const index = super.addModule(moduleTransport);
    return resolver.wrapModule({
      resolutionResponse,
      module,
      name: moduleTransport.name,
      code: moduleTransport.code,
      map: moduleTransport.map,
      meta: moduleTransport.meta,
      minify: this._minify,
      dev: this._dev,
    }).then(({code, map}) => {
      // If we get a map from the transformer we'll switch to a mode
      // were we're combining the source maps as opposed to
      if (map) {
        const usesRawMappings = isRawMappings(map);

        if (this._sourceMapFormat === 'undetermined') {
          this._sourceMapFormat = usesRawMappings ? 'flattened' : 'indexed';
        } else if (usesRawMappings && this._sourceMapFormat === 'indexed') {
          throw new Error(
            `Got at least one module with a full source map, but ${
            moduleTransport.sourcePath} has raw mappings`
          );
        } else if (!usesRawMappings && this._sourceMapFormat === 'flattened') {
          throw new Error(
            `Got at least one module with raw mappings, but ${
            moduleTransport.sourcePath} has a full source map`
          );
        }
      }

      this.replaceModuleAt(
        index, new ModuleTransport({...moduleTransport, code, map}));
    });
  }

  finalize(options: FinalizeOptions) {
    options = options || {};
    if (options.runModule) {
      /* $FlowFixMe: this is unsound, as nothing enforces runBeforeMainModule
       * to be available if `runModule` is true. Refactor. */
      options.runBeforeMainModule.forEach(this._addRequireCall, this);
      /* $FlowFixMe: this is unsound, as nothing enforces the module ID to have
       * been set beforehand. */
      this._addRequireCall(this.getMainModuleId());
    }

    super.finalize(options);
  }

  _addRequireCall(moduleId: string) {
    const code = `;require(${JSON.stringify(moduleId)});`;
    const name = 'require-' + moduleId;
    super.addModule(new ModuleTransport({
      name,
      id: -this._numRequireCalls - 1,
      code,
      virtual: true,
      sourceCode: code,
      sourcePath: name + '.js',
      meta: {preloaded: true},
    }));
    this._numRequireCalls += 1;
  }

  _getInlineSourceMap(dev: ?boolean) {
    if (this._inlineSourceMap == null) {
      const sourceMap = this.getSourceMapString({excludeSource: true, dev});
      /*eslint-env node*/
      const encoded = new Buffer(sourceMap).toString('base64');
      this._inlineSourceMap = 'data:application/json;base64,' + encoded;
    }
    return this._inlineSourceMap;
  }

  getSource(options: GetSourceOptions) {
    this.assertFinalized();

    options = options || {};

    let source = super.getSource(options);

    if (options.inlineSourceMap) {
      source += SOURCEMAPPING_URL + this._getInlineSourceMap(options.dev);
    } else if (this._sourceMapUrl) {
      source += SOURCEMAPPING_URL + this._sourceMapUrl;
    }

    return source;
  }

  getUnbundle(): Unbundle {
    this.assertFinalized();
    if (!this._ramBundle) {
      const modules = this.getModules().slice();

      // separate modules we need to preload from the ones we don't
      const [startupModules, lazyModules] = partition(modules, shouldPreload);

      const ramGroups = this._ramGroups;
      let groups;
      this._ramBundle = {
        startupModules,
        lazyModules,
        get groups() {
          if (!groups) {
            groups = createRamBundleGroups(ramGroups || [], lazyModules, subtree);
          }
          return groups;
        },
      };
    }

    return this._ramBundle;
  }

  invalidateSource() {
    debug('invalidating bundle');
    super.invalidateSource();
    this._sourceMap = null;
  }

  /**
   * Combine each of the sourcemaps multiple modules have into a single big
   * one. This works well thanks to a neat trick defined on the sourcemap spec
   * that makes use of of the `sections` field to combine sourcemaps by adding
   * an offset. This is supported only by Chrome for now.
   */
  _getCombinedSourceMaps(options: {excludeSource?: boolean}): IndexMap {
    const result = {
      version: 3,
      file: this._getSourceMapFile(),
      sections: [],
    };

    let line = 0;
    this.getModules().forEach(module => {
      invariant(
        !Array.isArray(module.map),
        `Unexpected raw mappings for ${module.sourcePath}`,
      );
      let map: SourceMap = module.map == null || module.virtual
        ? generateSourceMapForVirtualModule(module)
        : module.map;


      if (options.excludeSource && isMappingsMap(map)) {
        map = {...map, sourcesContent: []};
      }

      result.sections.push({
        offset: {line, column: 0},
        map,
      });
      line += module.code.split('\n').length;
    });

    return result;
  }

  getSourceMap(options: {excludeSource?: boolean}): SourceMap {
    this.assertFinalized();

    return this._sourceMapFormat === 'indexed'
      ? this._getCombinedSourceMaps(options)
      : fromRawMappings(this.getModules()).toMap();
  }

  getSourceMapString(options: {excludeSource?: boolean}): string {
    if (this._sourceMapFormat === 'indexed') {
      return JSON.stringify(this.getSourceMap(options));
    }

    // The following code is an optimization specific to the development server:
    // 1. generator.toSource() is faster than JSON.stringify(generator.toMap()).
    // 2. caching the source map unless there are changes saves time in
    //    development settings.
    let map = this._sourceMap;
    if (map == null) {
      debug('Start building flat source map');
      map = this._sourceMap = fromRawMappings(this.getModules()).toString();
      debug('End building flat source map');
    } else {
      debug('Returning cached source map');
    }
    return map;
  }

  getEtag() {
    /* $FlowFixMe: we must pass options, or rename the
     * base `getSource` function, as it does not actually need options. */
    var eTag = crypto.createHash('md5').update(this.getSource()).digest('hex');
    return eTag;
  }

  _getSourceMapFile() {
    return this._sourceMapUrl
      ? this._sourceMapUrl.replace('.map', '.bundle')
      : 'bundle.js';
  }

  getJSModulePaths() {
    return this.getModules()
      // Filter out non-js files. Like images etc.
      .filter(module => !module.virtual)
      .map(module => module.sourcePath);
  }

  getDebugInfo() {
    return [
      /* $FlowFixMe: this is unsound as the module ID could be unset. */
      '<div><h3>Main Module:</h3> ' + this.getMainModuleId() + '</div>',
      '<style>',
      'pre.collapsed {',
      '  height: 10px;',
      '  width: 100px;',
      '  display: block;',
      '  text-overflow: ellipsis;',
      '  overflow: hidden;',
      '  cursor: pointer;',
      '}',
      '</style>',
      '<h3> Module paths and transformed code: </h3>',
      this.getModules().map(function(m) {
        return '<div> <h4> Path: </h4>' + m.sourcePath + '<br/> <h4> Source: </h4>' +
               '<code><pre class="collapsed" onclick="this.classList.remove(\'collapsed\')">' +
               _.escape(m.code) + '</pre></code></div>';
      }).join('\n'),
    ].join('\n');
  }

  setRamGroups(ramGroups: ?Array<string>) {
    this._ramGroups = ramGroups;
  }
}

function generateSourceMapForVirtualModule(module): MappingsMap {
  // All lines map 1-to-1
  let mappings = 'AAAA;';

  for (let i = 1; i < module.code.split('\n').length; i++) {
    mappings +=  'AACA;';
  }

  return {
    version: 3,
    sources: [module.sourcePath],
    names: [],
    mappings,
    file: module.sourcePath,
    sourcesContent: [module.sourceCode],
  };
}

function shouldPreload({meta}) {
  return meta && meta.preloaded;
}

function partition(array, predicate) {
  const included = [];
  const excluded = [];
  array.forEach(item => (predicate(item) ? included : excluded).push(item));
  return [included, excluded];
}

function * subtree(
  moduleTransport: ModuleTransport,
  moduleTransportsByPath: Map<string, ModuleTransport>,
  seen = new Set(),
) {
  seen.add(moduleTransport.id);
  const {meta} = moduleTransport;
  invariant(
    meta != null,
    'Unexpected module transport without meta information: ' + moduleTransport.sourcePath,
  );
  for (const [, {path}] of meta.dependencyPairs || []) {
    const dependency = moduleTransportsByPath.get(path);
    if (dependency && !seen.has(dependency.id)) {
      yield dependency.id;
      yield * subtree(dependency, moduleTransportsByPath, seen);
    }
  }
}

const isRawMappings = Array.isArray;

module.exports = Bundle;

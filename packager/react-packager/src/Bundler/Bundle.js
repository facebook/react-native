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
const base64VLQ = require('./base64-vlq');
const crypto = require('crypto');

import type {SourceMap, CombinedSourceMap, MixedSourceMap} from '../lib/SourceMap';
import type {GetSourceOptions, FinalizeOptions} from './BundleBase';

export type Unbundle = {
  startupModules: Array<*>,
  lazyModules: Array<*>,
  groups: Map<number, Set<number>>,
};

const SOURCEMAPPING_URL = '\n\/\/# sourceMappingURL=';

class Bundle extends BundleBase {

  _dev: boolean | void;
  _inlineSourceMap: string | void;
  _minify: boolean | void;
  _numRequireCalls: number;
  _ramBundle: Unbundle | null;
  _ramGroups: Array<string> | void;
  _shouldCombineSourceMaps: boolean;
  _sourceMap: boolean;
  _sourceMapUrl: string | void;

  constructor({sourceMapUrl, dev, minify, ramGroups}: {
    sourceMapUrl?: string,
    dev?: boolean,
    minify?: boolean,
    ramGroups?: Array<string>,
  } = {}) {
    super();
    this._sourceMap = false;
    this._sourceMapUrl = sourceMapUrl;
    this._shouldCombineSourceMaps = false;
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
      if (!this._shouldCombineSourceMaps && map != null) {
        this._shouldCombineSourceMaps = true;
      }

      this.replaceModuleAt(
        index, new ModuleTransport({...moduleTransport, code, map}));
    });
  }

  finalize(options: FinalizeOptions) {
    options = options || {};
    if (options.runMainModule) {
      /* $FlowFixMe: this is unsound, as nothing enforces runBeforeMainModule
       * to be available if `runMainModule` is true. Refactor. */
      options.runBeforeMainModule.forEach(this._addRequireCall, this);
      /* $FlowFixMe: this is unsound, as nothing enforces the module ID to have
       * been set beforehand. */
      this._addRequireCall(super.getMainModuleId());
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

  _getInlineSourceMap(dev) {
    if (this._inlineSourceMap == null) {
      const sourceMap = this.getSourceMap({excludeSource: true, dev});
      /*eslint-env node*/
      const encoded = new Buffer(JSON.stringify(sourceMap)).toString('base64');
      this._inlineSourceMap = 'data:application/json;base64,' + encoded;
    }
    return this._inlineSourceMap;
  }

  getSource(options: GetSourceOptions) {
    super.assertFinalized();

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
            groups = createGroups(ramGroups || [], lazyModules);
          }
          return groups;
        },
      };
    }

    return this._ramBundle;
  }

  /**
   * Combine each of the sourcemaps multiple modules have into a single big
   * one. This works well thanks to a neat trick defined on the sourcemap spec
   * that makes use of of the `sections` field to combine sourcemaps by adding
   * an offset. This is supported only by Chrome for now.
   */
  _getCombinedSourceMaps(options): CombinedSourceMap {
    const result = {
      version: 3,
      file: this._getSourceMapFile(),
      sections: [],
    };

    let line = 0;
    this.getModules().forEach(module => {
      let map = module.map;

      if (module.virtual) {
        map = generateSourceMapForVirtualModule(module);
      }

      if (options.excludeSource) {
        /* $FlowFixMe: assume the map is not empty if we got here. */
        if (map.sourcesContent && map.sourcesContent.length) {
          map = Object.assign({}, map, {sourcesContent: []});
        }
      }

      result.sections.push({
        offset: { line: line, column: 0 },
        /* $FlowFixMe: assume the map is not empty if we got here. */
        map: map,
      });
      line += module.code.split('\n').length;
    });

    return result;
  }

  getSourceMap(options: {excludeSource?: boolean}): MixedSourceMap {
    super.assertFinalized();

    if (this._shouldCombineSourceMaps) {
      return this._getCombinedSourceMaps(options);
    }

    const mappings = this._getMappings();
    const modules = this.getModules();
    const map = {
      file: this._getSourceMapFile(),
      sources: modules.map(module => module.sourcePath),
      version: 3,
      names: [],
      mappings: mappings,
      sourcesContent: options.excludeSource
        ? [] : modules.map(module => module.sourceCode),
    };
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

  _getMappings() {
    const modules = super.getModules();

    // The first line mapping in our package is basically the base64vlq code for
    // zeros (A).
    const firstLine = 'AAAA';

    // Most other lines in our mappings are all zeros (for module, column etc)
    // except for the lineno mappinp: curLineno - prevLineno = 1; Which is C.
    const line = 'AACA';

    const moduleLines = Object.create(null);
    let mappings = '';
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const code = module.code;
      let lastCharNewLine  = false;
      moduleLines[module.sourcePath] = 0;
      for (let t = 0; t < code.length; t++) {
        if (t === 0 && i === 0) {
          mappings += firstLine;
        } else if (t === 0) {
          mappings += 'AC';

          // This is the only place were we actually don't know the mapping ahead
          // of time. When it's a new module (and not the first) the lineno
          // mapping is 0 (current) - number of lines in prev module.
          mappings += base64VLQ.encode(
            0 - moduleLines[modules[i - 1].sourcePath]
          );
          mappings += 'A';
        } else if (lastCharNewLine) {
          moduleLines[module.sourcePath]++;
          mappings += line;
        }
        lastCharNewLine = code[t] === '\n';
        if (lastCharNewLine) {
          mappings += ';';
        }
      }
      if (i !== modules.length - 1) {
        mappings += ';';
      }
    }
    return mappings;
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
      '<div><h3>Main Module:</h3> ' + super.getMainModuleId() + '</div>',
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

  setRamGroups(ramGroups: Array<string>) {
    this._ramGroups = ramGroups;
  }

  toJSON() {
    this.assertFinalized('Cannot serialize bundle unless finalized');

    return {
      ...super.toJSON(),
      sourceMapUrl: this._sourceMapUrl,
      numRequireCalls: this._numRequireCalls,
      shouldCombineSourceMaps: this._shouldCombineSourceMaps,
    };
  }

  static fromJSON(json) {
    const bundle = new Bundle({sourceMapUrl: json.sourceMapUrl});

    bundle._sourceMapUrl = json.sourceMapUrl;
    bundle._numRequireCalls = json.numRequireCalls;
    bundle._shouldCombineSourceMaps = json.shouldCombineSourceMaps;

    BundleBase.fromJSON(bundle, json);

    /* $FlowFixMe: this modifies BundleBase#fromJSON() signature. */
    return bundle;
  }
}

function generateSourceMapForVirtualModule(module): SourceMap {
  // All lines map 1-to-1
  let mappings = 'AAAA;';

  for (let i = 1; i < module.code.split('\n').length; i++) {
    mappings +=  'AACA;';
  }

  return {
    version: 3,
    sources: [ module.sourcePath ],
    names: [],
    mappings: mappings,
    file: module.sourcePath,
    sourcesContent: [ module.sourceCode ],
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

function * filter(iterator, predicate) {
  for (const value of iterator) {
    if (predicate(value)) {
      yield value;
    }
  }
}

function * subtree(moduleTransport: ModuleTransport, moduleTransportsByPath, seen = new Set()) {
  seen.add(moduleTransport.id);
  /* $FlowFixMe: there may not be a `meta` object */
  for (const [, {path}] of moduleTransport.meta.dependencyPairs || []) {
    const dependency = moduleTransportsByPath.get(path);
    if (dependency && !seen.has(dependency.id)) {
      yield dependency.id;
      yield * subtree(dependency, moduleTransportsByPath, seen);
    }
  }
}

class ArrayMap extends Map {
  get(key) {
    let array = super.get(key);
    if (!array) {
      array = [];
      this.set(key, array);
    }
    return array;
  }
}

function createGroups(ramGroups: Array<string>, lazyModules) {
  // build two maps that allow to lookup module data
  // by path or (numeric) module id;
  const byPath = new Map();
  const byId = new Map();
  lazyModules.forEach(m => {
    byPath.set(m.sourcePath, m);
    byId.set(m.id, m.sourcePath);
  });

  // build a map of group root IDs to an array of module IDs in the group
  const result: Map<number, Set<number>> = new Map(
    ramGroups
      .map(modulePath => {
        const root = byPath.get(modulePath);
        if (!root) {
          throw Error(`Group root ${modulePath} is not part of the bundle`);
        }
        return [
          root.id,
          // `subtree` yields the IDs of all transitive dependencies of a module
          /* $FlowFixMe: assumes the module is always in the Map */
          new Set(subtree(byPath.get(root.sourcePath), byPath)),
        ];
      })
  );

  if (ramGroups.length > 1) {
    // build a map of all grouped module IDs to an array of group root IDs
    const all = new ArrayMap();
    for (const [parent, children] of result) {
      for (const module of children) {
        all.get(module).push(parent);
      }
    }

    // find all module IDs that are part of more than one group
    const doubles = filter(all, ([, parents]) => parents.length > 1);
    for (const [moduleId, parents] of doubles) {
      // remove them from their groups
      /* $FlowFixMe: this assumes the element exists. */
      parents.forEach(p => result.get(p).delete(moduleId));

      // print a warning for each removed module
      const parentNames = parents.map(byId.get, byId);
      const lastName = parentNames.pop();
      console.warn(
        /* $FlowFixMe: this assumes the element exists. */
        `Module ${byId.get(moduleId)} belongs to groups ${
          parentNames.join(', ')}, and ${lastName
          }. Removing it from all groups.`
      );
    }
  }

  return result;
}

module.exports = Bundle;

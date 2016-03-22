/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const _ = require('lodash');
const base64VLQ = require('./base64-vlq');
const BundleBase = require('./BundleBase');
const ModuleTransport = require('../lib/ModuleTransport');
const crypto = require('crypto');

const SOURCEMAPPING_URL = '\n\/\/# sourceMappingURL=';

class Bundle extends BundleBase {
  constructor({sourceMapUrl, minify} = {}) {
    super();
    this._sourceMap = false;
    this._sourceMapUrl = sourceMapUrl;
    this._shouldCombineSourceMaps = false;
    this._numPrependedModules = 0;
    this._numRequireCalls = 0;
    this._minify = minify;
  }

  addModule(resolver, resolutionResponse, module, moduleTransport) {
    const index = super.addModule(moduleTransport);
    return resolver.wrapModule({
      resolutionResponse,
      module,
      name: moduleTransport.name,
      code: moduleTransport.code,
      map: moduleTransport.map,
      meta: moduleTransport.meta,
      minify: this._minify,
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

  setNumPrependedModules(n) {
    this._numPrependedModules = n;
  }

  finalize(options) {
    options = options || {};
    if (options.runMainModule) {
      options.runBeforeMainModule.forEach(this._addRequireCall, this);
      this._addRequireCall(super.getMainModuleId());
    }

    super.finalize();
  }

  _addRequireCall(moduleId) {
    const code = `;require(${JSON.stringify(moduleId)});`;
    const name = 'require-' + moduleId;
    super.addModule(new ModuleTransport({
      name,
      id: this._numRequireCalls - 1,
      code,
      virtual: true,
      sourceCode: code,
      sourcePath: name + '.js',
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

  getSource(options) {
    super.assertFinalized();

    options = options || {};

    let source = super.getSource();

    if (options.inlineSourceMap) {
      source += SOURCEMAPPING_URL + this._getInlineSourceMap(options.dev);
    } else if (this._sourceMapUrl) {
      source += SOURCEMAPPING_URL + this._sourceMapUrl;
    }

    return source;
  }

  getUnbundle() {
    const allModules = this.getModules().slice();
    const prependedModules = this._numPrependedModules;
    const requireCalls = this._numRequireCalls;

    const modules =
      allModules
        .splice(prependedModules, allModules.length - requireCalls - prependedModules);
    const startupCode = allModules.map(({code}) => code).join('\n');

    return {
      startupCode,
      startupModules: allModules,
      modules,
    };
  }

  /**
   * Combine each of the sourcemaps multiple modules have into a single big
   * one. This works well thanks to a neat trick defined on the sourcemap spec
   * that makes use of of the `sections` field to combine sourcemaps by adding
   * an offset. This is supported only by Chrome for now.
   */
  _getCombinedSourceMaps(options) {
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
        if (map.sourcesContent && map.sourcesContent.length) {
          map = Object.assign({}, map, {sourcesContent: []});
        }
      }

      result.sections.push({
        offset: { line: line, column: 0 },
        map: map,
      });
      line += module.code.split('\n').length;
    });

    return result;
  }

  getSourceMap(options) {
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
        ? [] : modules.map(module => module.sourceCode)
    };
    return map;
  }

  getEtag() {
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

  toJSON() {
    this.assertFinalized('Cannot serialize bundle unless finalized');

    return {
      ...super.toJSON(),
      sourceMapUrl: this._sourceMapUrl,
      numPrependedModules: this._numPrependedModules,
      numRequireCalls: this._numRequireCalls,
      shouldCombineSourceMaps: this._shouldCombineSourceMaps,
    };
  }

  static fromJSON(json) {
    const bundle = new Bundle({sourceMapUrl: json.sourceMapUrl});

    bundle._sourceMapUrl = json.sourceMapUrl;
    bundle._numPrependedModules = json.numPrependedModules;
    bundle._numRequireCalls = json.numRequireCalls;
    bundle._shouldCombineSourceMaps = json.shouldCombineSourceMaps;

    BundleBase.fromJSON(bundle, json);

    return bundle;
  }
}

function generateSourceMapForVirtualModule(module) {
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

module.exports = Bundle;

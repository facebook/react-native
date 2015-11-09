/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const _ = require('underscore');
const base64VLQ = require('./base64-vlq');
const UglifyJS = require('uglify-js');
const ModuleTransport = require('../lib/ModuleTransport');
const Activity = require('../Activity');

const SOURCEMAPPING_URL = '\n\/\/@ sourceMappingURL=';

class Bundle {
  constructor(sourceMapUrl) {
    this._finalized = false;
    this._modules = [];
    this._assets = [];
    this._sourceMapUrl = sourceMapUrl;
    this._shouldCombineSourceMaps = false;
  }

  setMainModuleId(moduleId) {
    this._mainModuleId = moduleId;
  }

  addModule(module) {
    if (!(module instanceof ModuleTransport)) {
      throw new Error('Expeceted a ModuleTransport object');
    }

    // If we get a map from the transformer we'll switch to a mode
    // were we're combining the source maps as opposed to
    if (!this._shouldCombineSourceMaps && module.map != null) {
      this._shouldCombineSourceMaps = true;
    }

    this._modules.push(module);
  }

  getModules() {
    return this._modules;
  }

  addAsset(asset) {
    this._assets.push(asset);
  }

  finalize(options) {
    options = options || {};
    if (options.runMainModule) {
      options.runBeforeMainModule.forEach(this._addRequireCall, this);
      this._addRequireCall(this._mainModuleId);
    }

    Object.freeze(this._modules);
    Object.seal(this._modules);
    Object.freeze(this._assets);
    Object.seal(this._assets);
    this._finalized = true;
  }

  _addRequireCall(moduleId) {
    const code = ';require("' + moduleId + '");';
    const name = 'require-' + moduleId;
    this.addModule(new ModuleTransport({
      name,
      code,
      virtual: true,
      sourceCode: code,
      sourcePath: name + '.js',
    }));
  }

  _assertFinalized() {
    if (!this._finalized) {
      throw new Error('Bundle needs to be finalized before getting any source');
    }
  }

  _getSource() {
    if (this._source == null) {
      this._source = _.pluck(this._modules, 'code').join('\n');
    }
    return this._source;
  }

  _getInlineSourceMap() {
    if (this._inlineSourceMap == null) {
      const sourceMap = this.getSourceMap({excludeSource: true});
      /*eslint-env node*/
      const encoded = new Buffer(JSON.stringify(sourceMap)).toString('base64');
      this._inlineSourceMap = 'data:application/json;base64,' + encoded;
    }
    return this._inlineSourceMap;
  }

  getSource(options) {
    this._assertFinalized();

    options = options || {};

    if (options.minify) {
      return this.getMinifiedSourceAndMap().code;
    }

    let source = this._getSource();

    if (options.inlineSourceMap) {
      source += SOURCEMAPPING_URL + this._getInlineSourceMap();
    } else if (this._sourceMapUrl) {
      source += SOURCEMAPPING_URL + this._sourceMapUrl;
    }

    return source;
  }

  getMinifiedSourceAndMap() {
    this._assertFinalized();

    if (this._minifiedSourceAndMap) {
      return this._minifiedSourceAndMap;
    }

    const source = this._getSource();
    try {
      const minifyActivity = Activity.startEvent('minify');
      this._minifiedSourceAndMap = UglifyJS.minify(source, {
        fromString: true,
        outSourceMap: 'bundle.js',
        inSourceMap: this.getSourceMap(),
        output: {ascii_only: true},
      });
      Activity.endEvent(minifyActivity);
      return this._minifiedSourceAndMap;
    } catch(e) {
      // Sometimes, when somebody is using a new syntax feature that we
      // don't yet have transform for, the untransformed line is sent to
      // uglify, and it chokes on it. This code tries to print the line
      // and the module for easier debugging
      let errorMessage = 'Error while minifying JS\n';
      if (e.line) {
        errorMessage += 'Transformed code line: "' +
                        source.split('\n')[e.line - 1] + '"\n';
      }
      if (e.pos) {
        let fromIndex = source.lastIndexOf('__d(\'', e.pos);
        if (fromIndex > -1) {
          fromIndex += '__d(\''.length;
          const toIndex = source.indexOf('\'', fromIndex);
          errorMessage += 'Module name (best guess): ' +
                          source.substring(fromIndex, toIndex) + '\n';
        }
      }
      errorMessage += e.toString();
      throw new Error(errorMessage);
    }
  }

  /**
   * I found a neat trick in the sourcemap spec that makes it easy
   * to concat sourcemaps. The `sections` field allows us to combine
   * the sourcemap easily by adding an offset. Tested on chrome.
   * Seems like it's not yet in Firefox but that should be fine for
   * now.
   */
  _getCombinedSourceMaps(options) {
    const result = {
      version: 3,
      file: 'bundle.js',
      sections: [],
    };

    let line = 0;
    this._modules.forEach(function(module) {
      let map = module.map;
      if (module.virtual) {
        map = generateSourceMapForVirtualModule(module);
      }

      if (options.excludeSource) {
        map = _.extend({}, map, {sourcesContent: []});
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
    this._assertFinalized();

    options = options || {};

    if (options.minify) {
      return this.getMinifiedSourceAndMap().map;
    }

    if (this._shouldCombineSourceMaps) {
      return this._getCombinedSourceMaps(options);
    }

    const mappings = this._getMappings();
    const map = {
      file: 'bundle.js',
      sources: _.pluck(this._modules, 'sourcePath'),
      version: 3,
      names: [],
      mappings: mappings,
      sourcesContent: options.excludeSource
    ? [] : _.pluck(this._modules, 'sourceCode')
    };
    return map;
  }

  getAssets() {
    return this._assets;
  }

  _getMappings() {
    const modules = this._modules;

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
    return this._modules.filter(function(module) {
      // Filter out non-js files. Like images etc.
      return !module.virtual;
    }).map(function(module) {
      return module.sourcePath;
    });
  }

  getDebugInfo() {
    return [
      '<div><h3>Main Module:</h3> ' + this._mainModuleId + '</div>',
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
      this._modules.map(function(m) {
        return '<div> <h4> Path: </h4>' + m.sourcePath + '<br/> <h4> Source: </h4>' +
               '<code><pre class="collapsed" onclick="this.classList.remove(\'collapsed\')">' +
               _.escape(m.code) + '</pre></code></div>';
      }).join('\n'),
    ].join('\n');
  }

  toJSON() {
    if (!this._finalized) {
      throw new Error('Cannot serialize bundle unless finalized');
    }

    return {
      modules: this._modules,
      assets: this._assets,
      sourceMapUrl: this._sourceMapUrl,
      shouldCombineSourceMaps: this._shouldCombineSourceMaps,
      mainModuleId: this._mainModuleId,
    };
  }

  static fromJSON(json) {
    const bundle = new Bundle(json.sourceMapUrl);
    bundle._mainModuleId = json.mainModuleId;
    bundle._assets = json.assets;
    bundle._modules = json.modules;
    bundle._sourceMapUrl = json.sourceMapUrl;

    Object.freeze(bundle._modules);
    Object.seal(bundle._modules);
    Object.freeze(bundle._assets);
    Object.seal(bundle._assets);
    bundle._finalized = true;

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

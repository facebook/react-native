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
const BundleBase = require('./BundleBase');
const UglifyJS = require('uglify-js');
const ModuleTransport = require('../lib/ModuleTransport');
const Activity = require('../Activity');
const crypto = require('crypto');

const SOURCEMAPPING_URL = '\n\/\/# sourceMappingURL=';

const minifyCode = code =>
  UglifyJS.minify(code, {fromString: true, ascii_only: true}).code;
const getCode = x => x.code;
const getMinifiedCode = x => minifyCode(x.code);
const getNameAndCode = ({name, code}) => ({name, code});
const getNameAndMinifiedCode =
  ({name, code}) => ({name, code: minifyCode(code)});

class Bundle extends BundleBase {
  constructor(sourceMapUrl) {
    super();
    this._sourceMap = false;
    this._sourceMapUrl = sourceMapUrl;
    this._shouldCombineSourceMaps = false;
    this._numPrependedModules = 0;
    this._numRequireCalls = 0;
  }

  addModule(resolver, response, module, transformed) {
    return resolver.wrapModule(
      response,
      module,
      transformed.code
    ).then(({code, name}) => {
      const moduleTransport = new ModuleTransport({
        code,
        name,
        map: transformed.map,
        sourceCode: transformed.sourceCode,
        sourcePath: transformed.sourcePath,
        virtual: transformed.virtual,
      });

      // If we get a map from the transformer we'll switch to a mode
      // were we're combining the source maps as opposed to
      if (!this._shouldCombineSourceMaps && moduleTransport.map != null) {
        this._shouldCombineSourceMaps = true;
      }

      super.addModule(moduleTransport);
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
    const code = ';require("' + moduleId + '");';
    const name = 'require-' + moduleId;
    super.addModule(new ModuleTransport({
      name,
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

    if (options.minify) {
      return this.getMinifiedSourceAndMap(options.dev).code;
    }

    let source = super.getSource();

    if (options.inlineSourceMap) {
      source += SOURCEMAPPING_URL + this._getInlineSourceMap(options.dev);
    } else if (this._sourceMapUrl) {
      source += SOURCEMAPPING_URL + this._sourceMapUrl;
    }

    return source;
  }

  getUnbundle({minify}) {
    const allModules = super.getModules().slice();
    const prependedModules = this._numPrependedModules;
    const requireCalls = this._numRequireCalls;

    const modules =
      allModules
        .splice(prependedModules, allModules.length - requireCalls - prependedModules);
    const startupCode =
      allModules
        .map(minify ? getMinifiedCode : getCode)
        .join('\n');

    return {
      startupCode,
      modules:
        modules.map(minify ? getNameAndMinifiedCode : getNameAndCode)
    };
  }

  getMinifiedSourceAndMap(dev) {
    super.assertFinalized();

    if (this._minifiedSourceAndMap) {
      return this._minifiedSourceAndMap;
    }

    let source = this.getSource();
    let map = this.getSourceMap();

    if (!dev) {
      const wpoActivity = Activity.startEvent('Whole Program Optimisations');
      const wpoResult = require('babel-core').transform(source, {
        retainLines: true,
        compact: true,
        plugins: require('../transforms/whole-program-optimisations'),
        inputSourceMap: map,
      });
      Activity.endEvent(wpoActivity);

      source = wpoResult.code;
      map = wpoResult.map;
    }

    try {
      const minifyActivity = Activity.startEvent('minify');
      this._minifiedSourceAndMap = UglifyJS.minify(source, {
        fromString: true,
        outSourceMap: this._sourceMapUrl,
        inSourceMap: map,
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
      file: this._getSourceMapFile(),
      sections: [],
    };

    let line = 0;
    super.getModules().forEach(function(module) {
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
    super.assertFinalized();

    options = options || {};

    if (options.minify) {
      return this.getMinifiedSourceAndMap(options.dev).map;
    }

    if (this._shouldCombineSourceMaps) {
      return this._getCombinedSourceMaps(options);
    }

    const mappings = this._getMappings();
    const map = {
      file: this._getSourceMapFile(),
      sources: _.pluck(super.getModules(), 'sourcePath'),
      version: 3,
      names: [],
      mappings: mappings,
      sourcesContent: options.excludeSource
    ? [] : _.pluck(super.getModules(), 'sourceCode')
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
    return super.getModules().filter(function(module) {
      // Filter out non-js files. Like images etc.
      return !module.virtual;
    }).map(function(module) {
      return module.sourcePath;
    });
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
      super.getModules().map(function(m) {
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
    };
  }

  static fromJSON(json) {
    const bundle = new Bundle(json.sourceMapUrl);

    bundle._sourceMapUrl = json.sourceMapUrl;
    bundle._numPrependedModules = json.numPrependedModules;
    bundle._numRequireCalls = json.numRequireCalls;

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

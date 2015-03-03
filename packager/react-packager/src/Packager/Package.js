'use strict';

var _ = require('underscore');
var base64VLQ = require('./base64-vlq');
var UglifyJS = require('uglify-js');

module.exports = Package;

function Package(sourceMapUrl) {
  this._modules = [];
  this._sourceMapUrl = sourceMapUrl;
}

Package.prototype.setMainModuleId = function(moduleId) {
  this._mainModuleId = moduleId;
};

Package.prototype.addModule = function(
  transformedCode,
  sourceCode,
  sourcePath
) {
  this._modules.push({
    transformedCode: transformedCode,
    sourceCode: sourceCode,
    sourcePath: sourcePath
  });
};

Package.prototype.finalize = function(options) {
  options = options || {};
  if (options.runMainModule) {
    var runCode = ';require("' + this._mainModuleId + '");';
    this.addModule(
      runCode,
      runCode,
      'RunMainModule.js'
    );
  }

  Object.freeze(this._modules);
  Object.seal(this._modules);
};

Package.prototype.getSource = function(options) {
  if (!this._source) {
    options = options || {};
    this._source = _.pluck(this._modules, 'transformedCode').join('\n');
    if (options.inlineSourceMap) {
      var sourceMap = this.getSourceMap({excludeSource: true});
      this._source += '\nRAW_SOURCE_MAP = ' + JSON.stringify(sourceMap) + ';';
    }
    this._source += '\n\/\/@ sourceMappingURL=' + this._sourceMapUrl;
  }
  return this._source;
};

Package.prototype.getMinifiedSourceAndMap = function() {
  var source = this.getSource({inlineSourceMap: false});
  try {
    return UglifyJS.minify(source, {
      fromString: true,
      outSourceMap: 'bundle.js',
      inSourceMap: this.getSourceMap(),
    });
  } catch(e) {
    // Sometimes, when somebody is using a new syntax feature that we
    // don't yet have transform for, the untransformed line is sent to
    // uglify, and it chokes on it. This code tries to print the line
    // and the module for easier debugging
    var errorMessage = 'Error while minifying JS\n';
    if (e.line) {
      errorMessage += 'Transformed code line: "' +
        source.split('\n')[e.line - 1] + '"\n';
    }
    if (e.pos) {
      var fromIndex = source.lastIndexOf('__d(\'', e.pos);
      if (fromIndex > -1) {
        fromIndex += '__d(\''.length;
        var toIndex = source.indexOf('\'', fromIndex);
        errorMessage += 'Module name (best guess): ' +
          source.substring(fromIndex, toIndex) + '\n';
      }
    }
    errorMessage += e.toString();
    throw new Error(errorMessage);
  }
};

Package.prototype.getSourceMap = function(options) {
  options = options || {};
  var mappings = this._getMappings();
  var map = {
    file: 'bundle.js',
    sources: _.pluck(this._modules, 'sourcePath'),
    version: 3,
    names: [],
    mappings: mappings,
    sourcesContent: options.excludeSource
      ? [] : _.pluck(this._modules, 'sourceCode')
  };
  return map;
};


Package.prototype._getMappings = function() {
  var modules = this._modules;

  // The first line mapping in our package is basically the base64vlq code for
  // zeros (A).
  var firstLine = 'AAAA';

  // Most other lines in our mappings are all zeros (for module, column etc)
  // except for the lineno mappinp: curLineno - prevLineno = 1; Which is C.
  var line = 'AACA';

  var mappings = '';
  for (var i = 0; i < modules.length; i++) {
    var module = modules[i];
    var transformedCode = module.transformedCode;
    var lastCharNewLine  = false;
    module.lines = 0;
    for (var t = 0; t < transformedCode.length; t++) {
      if (t === 0 && i === 0) {
        mappings += firstLine;
      } else if (t === 0) {
        mappings += 'AC';

        // This is the only place were we actually don't know the mapping ahead
        // of time. When it's a new module (and not the first) the lineno
        // mapping is 0 (current) - number of lines in prev module.
        mappings += base64VLQ.encode(0 - modules[i - 1].lines);
        mappings += 'A';
      } else if (lastCharNewLine) {
        module.lines++;
        mappings += line;
       }
      lastCharNewLine = transformedCode[t] === '\n';
      if (lastCharNewLine) {
        mappings += ';';
      }
    }
    if (i !== modules.length - 1) {
      mappings += ';';
    }
  }
  return mappings;
};

Package.prototype.getDebugInfo = function() {
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
        _.escape(m.transformedCode) + '</pre></code></div>';
    }).join('\n'),
  ].join('\n');
};

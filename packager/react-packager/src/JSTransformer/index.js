
'use strict';

var os = require('os');
var fs = require('fs');
var q = require('q');
var Cache = require('./Cache');
var _ = require('underscore');
var workerFarm = require('worker-farm');

var readFile = q.nfbind(fs.readFile);

module.exports = Transformer;
Transformer.TransformError = TransformError;

function Transformer(projectConfig) {
  this._cache = new Cache(projectConfig);
  this._workers = workerFarm(
    {autoStart: true},
    projectConfig.transformModulePath
  );
}

Transformer.prototype.kill = function() {
  workerFarm.end(this._workers);
  return this._cache.end();
};

Transformer.prototype.invalidateFile = function(filePath) {
  this._cache.invalidate(filePath);
  //TODO: We can read the file and put it into the cache right here
  //      This would simplify some caching logic as we can be sure that the cache is up to date
}

Transformer.prototype.loadFileAndTransform = function(
  transformSets,
  filePath,
  options
) {
  var workers = this._workers;
  return this._cache.get(filePath, function() {
    return readFile(filePath)
      .then(function(buffer) {
        var sourceCode = buffer.toString();
        var opts = _.extend({}, options, {filename: filePath});
        return q.nfbind(workers)({
          transformSets: transformSets,
          sourceCode: sourceCode,
          options: opts,
        }).then(
          function(res) {
            if (res.error) {
              throw formatEsprimaError(res.error, filePath, sourceCode);
            }

            return {
              code: res.code,
              sourcePath: filePath,
              sourceCode: sourceCode
            };
          }
        );
      });
  });
};

function TransformError() {}
TransformError.__proto__ = SyntaxError.prototype;

function formatEsprimaError(err, filename, source) {
  if (!(err.lineNumber && err.column)) {
    return err;
  }

  var stack = err.stack.split('\n');
  stack.shift();

  var msg = 'TransformError: ' + err.description + ' ' +  filename + ':' +
    err.lineNumber + ':' + err.column;
  var sourceLine = source.split('\n')[err.lineNumber - 1];
  var snippet = sourceLine + '\n' + new Array(err.column - 1).join(' ') + '^';

  stack.unshift(msg);

  var error = new TransformError();
  error.message = msg;
  error.type = 'TransformError';
  error.stack = stack.join('\n');
  error.snippet = snippet;
  error.filename = filename;
  error.lineNumber = err.lineNumber;
  error.column = err.column;
  error.description = err.description;
  return error;
}

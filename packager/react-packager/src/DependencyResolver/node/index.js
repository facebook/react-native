'use strict';

var Promise = require('q').Promise;
var ModuleDescriptor = require('../ModuleDescriptor');

var mdeps = require('module-deps');
var path = require('path');

exports.getRuntimeCode = function() {};

exports.wrapModule = function(id, source) {
  return Promise.resolve(
    'define(' + JSON.stringify(id) + ',' + ' function(exports, module) {\n'
      + source + '\n});'
  );
};

exports.getDependencies = function(root, fileEntryPath) {
  return new Promise(function(resolve) {
    fileEntryPath = path.join(process.cwd(), root, fileEntryPath);

    var md = mdeps();

    md.end({file: fileEntryPath});

    var deps = [];

    md.on('data', function(data) {
      deps.push(
        new ModuleDescriptor({
          id: data.id,
          deps: data.deps,
          path: data.file,
          entry: data.entry
        })
      );
    });

    md.on('end', function() {
      resolve(deps);
    });
  });
};

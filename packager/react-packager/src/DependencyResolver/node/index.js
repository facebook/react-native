/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var Promise = require('bluebird');
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

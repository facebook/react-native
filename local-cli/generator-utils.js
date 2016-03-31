/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var path = require('path');
var fs = require('fs');

function copyAndReplace(src, dest, replacements) {
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
  } else {
    var content = fs.readFileSync(src, 'utf8');
    Object.keys(replacements).forEach(function(regex) {
      content = content.replace(new RegExp(regex, 'gm'), replacements[regex]);
    });
    fs.writeFileSync(dest, content);
  }
}

function walk(current) {
  if (!fs.lstatSync(current).isDirectory()) {
    return [current];
  }

  var files = fs.readdirSync(current).map(function(child) {
    child = path.join(current, child);
    return walk(child);
  });
  return [].concat.apply([current], files);
}

function validatePackageName(name) {
  if (!name.match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
    console.error(
      '"%s" is not a valid name for a project. Please use a valid identifier ' +
        'name (alphanumeric).',
      name
    );
    process.exit(1);
  }
}

module.exports = {
  copyAndReplace: copyAndReplace,
  walk: walk,
  validatePackageName: validatePackageName
};

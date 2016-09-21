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

module.exports = function resolveSymlink(symlink) {
  var visited = [];

  var linkedPath = symlink;
  while (fs.existsSync(linkedPath) && fs.lstatSync(linkedPath).isSymbolicLink()) {
    var index = visited.indexOf(linkedPath);
    if (index !== -1) {
      throw Error(
        'Infinite symlink recursion detected:\n  ' +
          visited.slice(index).join('\n  ')
      );
    }

    visited.push(linkedPath);
    linkedPath = path.resolve(
      path.dirname(linkedPath),
      fs.readlinkSync(linkedPath)
    );
  }

  return linkedPath;
};

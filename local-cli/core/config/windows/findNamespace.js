/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const glob = require('glob');
const path = require('path');

/**
 * Gets package's namespace
 * by searching for its declaration in all C# files present in the folder
 *
 * @param {String} folder Folder to find C# files
 */
module.exports = function getNamespace(folder) {
  const files = glob.sync('**/*.cs', { cwd: folder });

  const packages = files
    .map(filePath => fs.readFileSync(path.join(folder, filePath), 'utf8'))
    .map(file => file.match(/namespace (.*)[\s\S]+IReactPackage/))
    .filter(match => match);

  return packages.length ? packages[0][1] : null;
};

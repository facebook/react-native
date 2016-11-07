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

function copyAndReplace(srcPath, destPath, replacements) {
  if (fs.lstatSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
  } else {
    let content = fs.readFileSync(srcPath, 'utf8');
    let srcPermissions = fs.statSync(srcPath).mode;
    Object.keys(replacements).forEach(regex =>
      content = content.replace(new RegExp(regex, 'g'), replacements[regex])
    );
    fs.writeFileSync(destPath, content, {
      encoding: 'utf8',
      mode: srcPermissions,
    });
  }
}

module.exports = copyAndReplace;

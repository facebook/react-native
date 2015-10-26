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

function copyAndReplace(src, dest, replacements) {
  console.log('src', src);
  console.log('dest', dest);
  if (fs.lstatSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
  } else {
    let content = fs.readFileSync(src, 'utf8');
    Object.keys(replacements).forEach(regex =>
      content = content.replace(new RegExp(regex, 'g'), replacements[regex])
    );
    fs.writeFileSync(dest, content);
  }
}

module.exports = copyAndReplace;


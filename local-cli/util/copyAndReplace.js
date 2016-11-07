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
const path = require('path');

// Binary files, don't process these (avoid decoding as utf8)
const binaryExtensions = ['.png', '.jar'];

/**
 * Copy a file to given destination, replacing parts of its contents.
 * @param srcPath Path to a file to be copied.
 * @param destPath Destination path.
 * @param replacements: e.g. {'TextToBeReplaced': 'Replacement'}
 */
function copyAndReplace(srcPath, destPath, replacements) {
  if (fs.lstatSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
  } else {
    const extension = path.extname(srcPath);
    if (binaryExtensions.indexOf(extension) !== -1) {
      // Binary file
      copyFile(srcPath, destPath, (err) => {
        if (err) throw err;
      });
    } else {
      // Text file
      const srcPermissions = fs.statSync(srcPath).mode;
      let content = fs.readFileSync(srcPath, 'utf8');
      Object.keys(replacements).forEach(regex =>
        content = content.replace(new RegExp(regex, 'g'), replacements[regex])
      );
      fs.writeFileSync(destPath, content, {
        encoding: 'utf8',
        mode: srcPermissions,
      });
    }
  }
}

/**
 * Same as 'cp' on Unix. Don't do any replacements.
 */
function copyFile(srcPath, destPath, cb) {
  let cbCalled = false;
  const srcPermissions = fs.statSync(srcPath).mode;
  const readStream = fs.createReadStream(srcPath);
  readStream.on('error', function(err) {
    done(err);
  });
  const writeStream = fs.createWriteStream(destPath, {
    mode: srcPermissions
  });
  writeStream.on('error', function(err) {
    done(err);
  });
  writeStream.on('close', function(ex) {
    done();
  });
  readStream.pipe(writeStream);
  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

module.exports = copyAndReplace;

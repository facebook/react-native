/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = jest.genMockFromModule('fs');

fs.realpath.mockImpl(function(filepath, callback) {
  var node;
  try {
    node = getToNode(filepath);
  } catch (e) {
    return callback(e);
  }
  if (node && typeof node === 'object' && node.SYMLINK != null) {
    return callback(null, node.SYMLINK);
  }
  callback(null, filepath);
});

fs.readdir.mockImpl(function(filepath, callback) {
  var node;
  try {
    node = getToNode(filepath);
    if (node && typeof node === 'object' && node.SYMLINK != null) {
      node = getToNode(node.SYMLINK);
    }
  } catch (e) {
    return callback(e);
  }

  if (!(node && typeof node === 'object' && node.SYMLINK == null)) {
    return callback(new Error(filepath + ' is not a directory.'));
  }

  callback(null, Object.keys(node));
});

fs.readFile.mockImpl(function(filepath, encoding, callback) {
  try {
    var node = getToNode(filepath);
    // dir check
    if (node && typeof node === 'object' && node.SYMLINK == null) {
      callback(new Error('Trying to read a dir, ESIDR, or whatever'));
    }
    return callback(null, node);
  } catch (e) {
    return callback(e);
  }
});

fs.lstat.mockImpl(function(filepath, callback) {
  var node;
  try {
    node = getToNode(filepath);
  } catch (e) {
    return callback(e);
  }

  if (node && typeof node === 'object' && node.SYMLINK == null) {
    callback(null, {
      isDirectory: function() {
        return true;
      },
      isSymbolicLink: function() {
        return false;
      }
    });
  } else {
    callback(null, {
      isDirectory: function() {
        return false;
      },
      isSymbolicLink: function() {
        if (typeof node === 'object' && node.SYMLINK) {
          return true;
        }
        return false;
      }
    });
  }
});

var filesystem;

fs.__setMockFilesystem = function(object) {
  filesystem = object;
  return filesystem;
};

function getToNode(filepath) {
  var parts = filepath.split('/');
  if (parts[0] !== '') {
    throw new Error('Make sure all paths are absolute.');
  }
  var node = filesystem;
  parts.slice(1).forEach(function(part) {
    node = node[part];
  });

  return node;
}

module.exports = fs;

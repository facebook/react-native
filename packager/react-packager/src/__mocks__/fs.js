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

function asyncCallback(callback) {
  return function() {
    setImmediate(() => callback.apply(this, arguments));
  };
}

fs.realpath.mockImpl(function(filepath, callback) {
  callback = asyncCallback(callback);
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
  callback = asyncCallback(callback);
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
  callback = asyncCallback(callback);
  if (arguments.length === 2) {
    callback = encoding;
    encoding = null;
  }

  try {
    var node = getToNode(filepath);
    // dir check
    if (node && typeof node === 'object' && node.SYMLINK == null) {
      callback(new Error('Error readFile a dir: ' + filepath));
    }
    return callback(null, node);
  } catch (e) {
    return callback(e);
  }
});

fs.stat.mockImpl(function(filepath, callback) {
  callback = asyncCallback(callback);
  var node;
  try {
    node = getToNode(filepath);
  } catch (e) {
    callback(e);
    return;
  }

  var mtime = {
    getTime: function() {
      return Math.ceil(Math.random() * 10000000);
    }
  };

  if (node.SYMLINK) {
    fs.stat(node.SYMLINK, callback);
    return;
  }

  if (node && typeof node === 'object') {
    callback(null, {
      isDirectory: function() {
        return true;
      },
      isSymbolicLink: function() {
        return false;
      },
      mtime: mtime,
    });
  } else {
    callback(null, {
      isDirectory: function() {
        return false;
      },
      isSymbolicLink: function() {
        return false;
      },
      mtime: mtime,
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
    if (node && node.SYMLINK) {
      node = getToNode(node.SYMLINK);
    }
    node = node[part];
  });

  return node;
}

module.exports = fs;

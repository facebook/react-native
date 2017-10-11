/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

const asyncify = require('async/asyncify');
const {EventEmitter} = require('events');
const {dirname} = require.requireActual('path');
const fs = jest.genMockFromModule('fs');
const invariant = require('fbjs/lib/invariant');
const path = require('path');
const stream = require.requireActual('stream');

const noop = () => {};

function asyncCallback(cb) {
  return function() {
    setImmediate(() => cb.apply(this, arguments));
  };
}

const mtime = {
  getTime: () => Math.ceil(Math.random() * 10000000),
};

fs.realpath.mockImplementation((filepath, callback) => {
  callback = asyncCallback(callback);
  let node;
  try {
    node = getToNode(filepath);
  } catch (e) {
    return callback(e);
  }
  if (node && typeof node === 'object' && node.SYMLINK != null) {
    return callback(null, node.SYMLINK);
  }
  return callback(null, filepath);
});

fs.readdirSync.mockImplementation(filepath => Object.keys(getToNode(filepath)));

fs.readdir.mockImplementation((filepath, callback) => {
  callback = asyncCallback(callback);
  let node;
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

  return callback(null, Object.keys(node));
});

fs.readFile.mockImplementation(function(filepath, encoding, callback) {
  callback = asyncCallback(callback);
  if (arguments.length === 2) {
    callback = encoding;
    encoding = null;
  }

  let node;
  try {
    node = getToNode(filepath);
    if (isDirNode(node)) {
      callback(new Error('Error readFile a dir: ' + filepath));
    }
    if (node == null) {
      return callback(Error('No such file: ' + filepath));
    } else {
      return callback(null, node);
    }
  } catch (e) {
    return callback(e);
  }
});

fs.readFileSync.mockImplementation(function(filepath, encoding) {
  const node = getToNode(filepath);
  if (isDirNode(node)) {
    throw new Error('Error readFileSync a dir: ' + filepath);
  }
  if (Buffer.isBuffer(node) && typeof encoding !== 'undefined') {
    return node.toString();
  }
  return node;
});

fs.writeFile.mockImplementation(asyncify(fs.writeFileSync));

fs.writeFileSync.mockImplementation((filePath, content, options) => {
  if (options == null || typeof options === 'string') {
    options = {encoding: options};
  }
  invariant(
    options.encoding == null || options.encoding === 'utf8',
    '`options` argument supports only `null` or `"utf8"`',
  );
  const dirPath = path.dirname(filePath);
  const node = getToNode(dirPath);
  if (!isDirNode(node)) {
    throw fsError('ENOTDIR', 'not a directory: ' + dirPath);
  }
  node[path.basename(filePath)] = content;
});

fs.mkdir.mockImplementation(asyncify(fs.mkdirSync));

fs.mkdirSync.mockImplementation((dirPath, mode) => {
  const parentPath = path.dirname(dirPath);
  const node = getToNode(parentPath);
  if (!isDirNode(node)) {
    throw fsError('ENOTDIR', 'not a directory: ' + parentPath);
  }
  node[path.basename(dirPath)] = {};
});

function fsError(code, message) {
  const error = new Error(code + ': ' + message);
  error.code = code;
  return error;
}

function isDirNode(node) {
  return (
    node &&
    typeof node === 'object' &&
    node.SYMLINK == null &&
    Buffer.isBuffer(node) === false
  );
}

function readlinkSync(filepath) {
  const node = getToNode(filepath);
  if (node !== null && typeof node === 'object' && !!node.SYMLINK) {
    return node.SYMLINK;
  } else {
    throw new Error(`EINVAL: invalid argument, readlink '${filepath}'`);
  }
}

fs.readlink.mockImplementation((filepath, callback) => {
  callback = asyncCallback(callback);
  let result;
  try {
    result = readlinkSync(filepath);
  } catch (e) {
    callback(e);
    return;
  }
  callback(null, result);
});

fs.readlinkSync.mockImplementation(readlinkSync);

function existsSync(filepath) {
  try {
    const node = getToNode(filepath);
    return node !== null;
  } catch (e) {
    return false;
  }
}

fs.exists.mockImplementation((filepath, callback) => {
  callback = asyncCallback(callback);
  let result;
  try {
    result = existsSync(filepath);
  } catch (e) {
    callback(e);
    return;
  }
  callback(null, result);
});

fs.existsSync.mockImplementation(existsSync);

function makeStatResult(node) {
  const isSymlink = node != null && node.SYMLINK != null;
  return {
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isDirectory: () => node != null && typeof node === 'object' && !isSymlink,
    isFIFO: () => false,
    isFile: () => node != null && typeof node === 'string',
    isSocket: () => false,
    isSymbolicLink: () => isSymlink,
    mtime,
  };
}

function statSync(filepath) {
  const node = getToNode(filepath);
  if (node != null && node.SYMLINK) {
    return statSync(node.SYMLINK);
  }
  return makeStatResult(node);
}

fs.stat.mockImplementation((filepath, callback) => {
  callback = asyncCallback(callback);
  let result;
  try {
    result = statSync(filepath);
  } catch (e) {
    callback(e);
    return;
  }
  callback(null, result);
});

fs.statSync.mockImplementation(statSync);

function lstatSync(filepath) {
  const node = getToNode(filepath);
  return makeStatResult(node);
}

fs.lstat.mockImplementation((filepath, callback) => {
  callback = asyncCallback(callback);
  let result;
  try {
    result = lstatSync(filepath);
  } catch (e) {
    callback(e);
    return;
  }
  callback(null, result);
});

fs.lstatSync.mockImplementation(lstatSync);

fs.open.mockImplementation(function(filepath) {
  const callback = arguments[arguments.length - 1] || noop;
  let data, error, fd;
  try {
    data = getToNode(filepath);
  } catch (e) {
    error = e;
  }

  if (error || data == null) {
    error = Error(`ENOENT: no such file or directory, open ${filepath}`);
  }
  if (data != null) {
    /* global Buffer: true */
    fd = {buffer: new Buffer(data, 'utf8'), position: 0};
  }

  callback(error, fd);
});

fs.read.mockImplementation(
  (fd, buffer, writeOffset, length, position, callback = noop) => {
    let bytesWritten;
    try {
      if (position == null || position < 0) {
        ({position} = fd);
      }
      bytesWritten = fd.buffer.copy(
        buffer,
        writeOffset,
        position,
        position + length,
      );
      fd.position = position + bytesWritten;
    } catch (e) {
      callback(Error('invalid argument'));
      return;
    }
    callback(null, bytesWritten, buffer);
  },
);

fs.close.mockImplementation((fd, callback = noop) => {
  try {
    fd.buffer = fs.position = undefined;
  } catch (e) {
    callback(Error('invalid argument'));
    return;
  }
  callback(null);
});

let filesystem = {};

fs.mock = {
  clear() {
    filesystem = {};
  },
};

fs.createReadStream.mockImplementation(filepath => {
  if (!filepath.startsWith('/')) {
    throw Error('Cannot open file ' + filepath);
  }

  const parts = filepath.split('/').slice(1);
  let file = filesystem;

  for (const part of parts) {
    file = file[part];
    if (!file) {
      break;
    }
  }

  if (typeof file !== 'string') {
    throw Error('Cannot open file ' + filepath);
  }

  return new stream.Readable({
    read() {
      this.push(file, 'utf8');
      this.push(null);
    },
  });
});

fs.createWriteStream.mockImplementation(file => {
  let node;
  try {
    node = getToNode(dirname(file));
  } finally {
    if (typeof node === 'object') {
      const writeStream = new stream.Writable({
        write(chunk) {
          this.__chunks.push(chunk);
        },
      });
      writeStream.__file = file;
      writeStream.__chunks = [];
      writeStream.end = jest.fn(writeStream.end);
      fs.createWriteStream.mock.returned.push(writeStream);
      return writeStream;
    } else {
      throw new Error('Cannot open file ' + file);
    }
  }
});
fs.createWriteStream.mock.returned = [];

fs.__setMockFilesystem = object => (filesystem = object);

const watcherListByPath = new Map();

fs.watch.mockImplementation((filename, options, listener) => {
  if (options.recursive) {
    throw new Error('recursive watch not implemented');
  }
  let watcherList = watcherListByPath.get(filename);
  if (watcherList == null) {
    watcherList = [];
    watcherListByPath.set(filename, watcherList);
  }
  const fsWatcher = new EventEmitter();
  fsWatcher.on('change', listener);
  fsWatcher.close = () => {
    watcherList.splice(watcherList.indexOf(fsWatcher), 1);
    fsWatcher.close = () => {
      throw new Error('FSWatcher is already closed');
    };
  };
  watcherList.push(fsWatcher);
});

fs.__triggerWatchEvent = (eventType, filename) => {
  const directWatchers = watcherListByPath.get(filename) || [];
  directWatchers.forEach(wtc => wtc.emit('change', eventType));
  const dirPath = path.dirname(filename);
  const dirWatchers = watcherListByPath.get(dirPath) || [];
  dirWatchers.forEach(wtc =>
    wtc.emit('change', eventType, path.relative(dirPath, filename)),
  );
};

function getToNode(filepath) {
  // Ignore the drive for Windows paths.
  if (filepath.match(/^[a-zA-Z]:\\/)) {
    filepath = filepath.substring(2);
  }

  if (filepath.endsWith(path.sep)) {
    filepath = filepath.slice(0, -1);
  }
  const parts = filepath.split(/[\/\\]/);
  if (parts[0] !== '') {
    throw new Error('Make sure all paths are absolute.');
  }
  let node = filesystem;
  parts.slice(1).forEach(part => {
    if (node && node.SYMLINK) {
      node = getToNode(node.SYMLINK);
    }
    node = node[part];
    if (node == null) {
      const err = new Error('ENOENT: no such file or directory');
      err.code = 'ENOENT';
      throw err;
    }
  });

  return node;
}

module.exports = fs;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Promise = require('promise');
const {EventEmitter} = require('events');

const fs = require('graceful-fs');
const path = require('path');

// workaround for https://github.com/isaacs/node-graceful-fs/issues/56
// fs.close is patched, whereas graceful-fs.close is not.
const fsClose = require('fs').close;

const readFile = Promise.denodeify(fs.readFile);
const stat = Promise.denodeify(fs.stat);

const hasOwn = Object.prototype.hasOwnProperty;

const NOT_FOUND_IN_ROOTS = 'NotFoundInRootsError';

class Fastfs extends EventEmitter {
  constructor(name, roots, fileWatcher, {ignore, crawling, activity}) {
    super();
    this._name = name;
    this._fileWatcher = fileWatcher;
    this._ignore = ignore;
    this._roots = roots.map(root => new File(root, { isDir: true }));
    this._fastPaths = Object.create(null);
    this._crawling = crawling;
    this._activity = activity;
  }

  build() {
    const rootsPattern = new RegExp(
      '^(' + this._roots.map(root => escapeRegExp(root.path)).join('|') + ')'
    );

    return this._crawling.then(files => {
      let fastfsActivity;
      const activity = this._activity;
      if (activity) {
        fastfsActivity = activity.startEvent('Building in-memory fs for ' + this._name);
      }
      files.forEach(filePath => {
        if (filePath.match(rootsPattern)) {
          const newFile = new File(filePath, { isDir: false });
          const parent = this._fastPaths[path.dirname(filePath)];
          if (parent) {
            parent.addChild(newFile);
          } else {
            this._add(newFile);
            for (let file = newFile; file; file = file.parent) {
              if (!this._fastPaths[file.path]) {
                this._fastPaths[file.path] = file;
              }
            }
          }
        }
      });
      if (activity) {
        activity.endEvent(fastfsActivity);
      }
      this._fileWatcher.on('all', this._processFileChange.bind(this));
    });
  }

  stat(filePath) {
    return Promise.resolve().then(() => {
      const file = this._getFile(filePath);
      return file.stat();
    });
  }

  getAllFiles() {
    // one-level-deep flatten of files
    return [].concat(...this._roots.map(root => root.getFiles()));
  }

  findFilesByExt(ext, { ignore } = {}) {
    return this.findFilesByExts([ext], {ignore});
  }

  findFilesByExts(exts, { ignore } = {}) {
    return this.getAllFiles()
      .filter(file => (
        exts.indexOf(file.ext()) !== -1 && (!ignore || !ignore(file.path))
      ))
      .map(file => file.path);
  }

  findFilesByName(name, { ignore } = {}) {
    return this.getAllFiles()
      .filter(
        file => path.basename(file.path) === name &&
          (!ignore || !ignore(file.path))
      )
      .map(file => file.path);
  }

  matchFilesByPattern(pattern) {
    return this.getAllFiles()
      .filter(file => file.path.match(pattern))
      .map(file => file.path);
  }

  readFile(filePath) {
    const file = this._getFile(filePath);
    if (!file) {
      throw new Error(`Unable to find file with path: ${filePath}`);
    }
    return file.read();
  }

  readWhile(filePath, predicate) {
    const file = this._getFile(filePath);
    if (!file) {
      throw new Error(`Unable to find file with path: ${filePath}`);
    }
    return file.readWhile(predicate);
  }

  closest(filePath, name) {
    for (let file = this._getFile(filePath).parent;
         file;
         file = file.parent) {
      if (file.children[name]) {
        return file.children[name].path;
      }
    }
    return null;
  }

  fileExists(filePath) {
    let file;
    try {
      file = this._getFile(filePath);
    } catch (e) {
      if (e.type === NOT_FOUND_IN_ROOTS) {
        return false;
      }
      throw e;
    }

    return file && !file.isDir;
  }

  dirExists(filePath) {
    let file;
    try {
      file = this._getFile(filePath);
    } catch (e) {
      if (e.type === NOT_FOUND_IN_ROOTS) {
        return false;
      }
      throw e;
    }

    return file && file.isDir;
  }

  matches(dir, pattern) {
    const dirFile = this._getFile(dir);
    if (!dirFile.isDir) {
      throw new Error(`Expected file ${dirFile.path} to be a directory`);
    }

    return Object.keys(dirFile.children)
      .filter(name => name.match(pattern))
      .map(name => path.join(dirFile.path, name));
  }

  _getRoot(filePath) {
    for (let i = 0; i < this._roots.length; i++) {
      const possibleRoot = this._roots[i];
      if (isDescendant(possibleRoot.path, filePath)) {
        return possibleRoot;
      }
    }
    return null;
  }

  _getAndAssertRoot(filePath) {
    const root = this._getRoot(filePath);
    if (!root) {
      const error = new Error(`File ${filePath} not found in any of the roots`);
      error.type = NOT_FOUND_IN_ROOTS;
      throw error;
    }
    return root;
  }

  _getFile(filePath) {
    filePath = path.normalize(filePath);
    if (!hasOwn.call(this._fastPaths, filePath)) {
      this._fastPaths[filePath] = this._getAndAssertRoot(filePath).getFileFromPath(filePath);
    }

    return this._fastPaths[filePath];
  }

  _add(file) {
    this._getAndAssertRoot(file.path).addChild(file);
  }

  _processFileChange(type, filePath, root, fstat) {
    const absPath = path.join(root, filePath);
    if (this._ignore(absPath) || (fstat && fstat.isDirectory())) {
      return;
    }

    // Make sure this event belongs to one of our roots.
    if (!this._getRoot(absPath)) {
      return;
    }

    if (type === 'delete' || type === 'change') {
      const file = this._getFile(absPath);
      if (file) {
        file.remove();
      }
    }

    delete this._fastPaths[path.normalize(absPath)];

    if (type !== 'delete') {
      this._add(new File(absPath, { isDir: false }));
    }

    this.emit('change', type, filePath, root, fstat);
  }
}

class File {
  constructor(filePath, { isDir }) {
    this.path = filePath;
    this.isDir = Boolean(isDir);
    if (this.isDir) {
      this.children = Object.create(null);
    }
  }

  read() {
    if (!this._read) {
      this._read = readFile(this.path, 'utf8');
    }
    return this._read;
  }

  readWhile(predicate) {
    return readWhile(this.path, predicate).then(({result, completed}) => {
      if (completed && !this._read) {
        this._read = Promise.resolve(result);
      }
      return result;
    });
  }

  stat() {
    if (!this._stat) {
      this._stat = stat(this.path);
    }

    return this._stat;
  }

  addChild(file) {
    const parts = path.relative(this.path, file.path).split(path.sep);

    if (parts.length === 0) {
      return;
    }

    if (parts.length === 1) {
      this.children[parts[0]] = file;
      file.parent = this;
    } else if (this.children[parts[0]]) {
      this.children[parts[0]].addChild(file);
    } else {
      const dir = new File(path.join(this.path, parts[0]), { isDir: true });
      dir.parent = this;
      this.children[parts[0]] = dir;
      dir.addChild(file);
    }
  }

  getFileFromPath(filePath) {
    const parts = path.relative(this.path, filePath)
            .split(path.sep);

    /*eslint consistent-this:0*/
    let file = this;
    for (let i = 0; i < parts.length; i++) {
      const fileName = parts[i];
      if (!fileName) {
        continue;
      }

      if (!file || !file.isDir) {
        // File not found.
        return null;
      }

      file = file.children[fileName];
    }

    return file;
  }

  getFiles() {
    let files = [];
    Object.keys(this.children).forEach(key => {
      const file = this.children[key];
      if (file.isDir) {
        files = files.concat(file.getFiles());
      } else {
        files.push(file);
      }
    });
    return files;
  }

  ext() {
    return path.extname(this.path).replace(/^\./, '');
  }

  remove() {
    if (!this.parent) {
      throw new Error(`No parent to delete ${this.path} from`);
    }

    delete this.parent.children[path.basename(this.path)];
  }
}

function readWhile(filePath, predicate) {
  return new Promise((resolve, reject) => {
    fs.open(filePath, 'r', (openError, fd) => {
      if (openError) {
        reject(openError);
        return;
      }

      read(
        fd,
        /*global Buffer: true*/
        new Buffer(512),
        makeReadCallback(fd, predicate, (readError, result, completed) => {
          if (readError) {
            reject(readError);
          } else {
            resolve({result, completed});
          }
        })
      );
    });
  });
}

function read(fd, buffer, callback) {
  fs.read(fd, buffer, 0, buffer.length, -1, callback);
}

function close(fd, error, result, complete, callback) {
  fsClose(fd, closeError => callback(error || closeError, result, complete));
}

function makeReadCallback(fd, predicate, callback) {
  let result = '';
  let index = 0;
  return function readCallback(error, bytesRead, buffer) {
    if (error) {
      close(fd, error, undefined, false, callback);
      return;
    }

    const completed = bytesRead === 0;
    const chunk = completed ? '' : buffer.toString('utf8', 0, bytesRead);
    result += chunk;
    if (completed || !predicate(chunk, index++, result)) {
      close(fd, null, result, completed, callback);
    } else {
      read(fd, buffer, readCallback);
    }
  };
}

function isDescendant(root, child) {
  return path.relative(root, child).indexOf('..') !== 0;
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

module.exports = Fastfs;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const denodeify = require('denodeify');
const {EventEmitter} = require('events');

const fs = require('graceful-fs');
const path = require('./fastpath');

const readFile = denodeify(fs.readFile);
const stat = denodeify(fs.stat);

const NOT_FOUND_IN_ROOTS = 'NotFoundInRootsError';

class Fastfs extends EventEmitter {
  constructor(name, roots, fileWatcher, {ignore, crawling, activity}) {
    super();
    this._name = name;
    this._fileWatcher = fileWatcher;
    this._ignore = ignore;
    this._roots = roots.map(root => {
      // If the path ends in a separator ("/"), remove it to make string
      // operations on paths safer.
      if (root.endsWith(path.sep)) {
        root = root.substr(0, root.length - 1);
      }

      root = path.resolve(root);

      return new File(root, true);
    });
    this._fastPaths = Object.create(null);
    this._crawling = crawling;
    this._activity = activity;
  }

  build() {
    return this._crawling.then(files => {
      let fastfsActivity;
      const activity = this._activity;
      if (activity) {
        fastfsActivity = activity.startEvent(
          'Building in-memory fs for ' + this._name,
          null,
          {
            telemetric: true,
          },
        );
      }
      files.forEach(filePath => {
        const root = this._getRoot(filePath);
        if (root) {
          const newFile = new File(filePath, false);
          const dirname = filePath.substr(0, filePath.lastIndexOf(path.sep));
          const parent = this._fastPaths[dirname];
          this._fastPaths[filePath] = newFile;
          if (parent) {
            parent.addChild(newFile, this._fastPaths);
          } else {
            root.addChild(newFile, this._fastPaths);
          }
        }
      });
      if (activity) {
        activity.endEvent(fastfsActivity);
      }

      if (this._fileWatcher) {
        this._fileWatcher.on('all', this._processFileChange.bind(this));
      }
    });
  }

  stat(filePath) {
    return Promise.resolve().then(() => this._getFile(filePath).stat());
  }

  getAllFiles() {
    return Object.keys(this._fastPaths)
      .filter(filePath => !this._fastPaths[filePath].isDir);
  }

  findFilesByExts(exts, { ignore } = {}) {
    return this.getAllFiles()
      .filter(filePath => (
        exts.indexOf(path.extname(filePath).substr(1)) !== -1 &&
        (!ignore || !ignore(filePath))
      ));
  }

  matchFilesByPattern(pattern) {
    return this.getAllFiles().filter(file => file.match(pattern));
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
    filePath = path.resolve(filePath);
    if (!this._fastPaths[filePath]) {
      const file = this._getAndAssertRoot(filePath).getFileFromPath(filePath);
      if (file) {
        this._fastPaths[filePath] = file;
      }
    }

    return this._fastPaths[filePath];
  }

  _processFileChange(type, filePath, rootPath, fstat) {
    const absPath = path.join(rootPath, filePath);
    if (this._ignore(absPath) || (fstat && fstat.isDirectory())) {
      return;
    }

    // Make sure this event belongs to one of our roots.
    const root = this._getRoot(absPath);
    if (!root) {
      return;
    }

    if (type === 'delete' || type === 'change') {
      const file = this._getFile(absPath);
      if (file) {
        file.remove();
      }
    }

    delete this._fastPaths[path.resolve(absPath)];

    if (type !== 'delete') {
      const file = new File(absPath, false);
      root.addChild(file, this._fastPaths);
    }

    this.emit('change', type, filePath, rootPath, fstat);
  }
}

class File {
  constructor(filePath, isDir) {
    this.path = filePath;
    this.isDir = isDir;
    this.children = this.isDir ? Object.create(null) : null;
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

  addChild(file, fileMap) {
    const parts = file.path.substr(this.path.length + 1).split(path.sep);
    if (parts.length === 1) {
      this.children[parts[0]] = file;
      file.parent = this;
    } else if (this.children[parts[0]]) {
      this.children[parts[0]].addChild(file, fileMap);
    } else {
      const dir = new File(this.path + path.sep + parts[0], true);
      dir.parent = this;
      this.children[parts[0]] = dir;
      fileMap[dir.path] = dir;
      dir.addChild(file, fileMap);
    }
  }

  getFileFromPath(filePath) {
    const parts = path.relative(this.path, filePath).split(path.sep);

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

  ext() {
    return path.extname(this.path).substr(1);
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
  fs.close(fd, closeError => callback(error || closeError, result, complete));
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
  return root === child || child.startsWith(root + path.sep);
}

module.exports = Fastfs;

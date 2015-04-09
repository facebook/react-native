/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var ModuleDescriptor = require('../../ModuleDescriptor');
var Promise = require('bluebird');
var fs = require('fs');
var docblock = require('./docblock');
var replacePatterns = require('../replacePatterns');
var path = require('path');
var isAbsolutePath = require('absolute-path');
var debug = require('debug')('DependecyGraph');
var util = require('util');
var declareOpts = require('../../../lib/declareOpts');

var readFile = Promise.promisify(fs.readFile);
var readDir = Promise.promisify(fs.readdir);
var lstat = Promise.promisify(fs.lstat);
var realpath = Promise.promisify(fs.realpath);

var validateOpts = declareOpts({
  roots: {
    type: 'array',
    required: true,
  },
  ignoreFilePath: {
    type: 'function',
    default: function(){}
  },
  fileWatcher: {
    type: 'object',
    required: true,
  },
  assetRoots_DEPRECATED: {
    type: 'array',
    default: [],
  },
  assetExts: {
    type: 'array',
    default: ['png'],
  }
});

function DependecyGraph(options) {
  var opts = validateOpts(options);

  this._roots = opts.roots;
  this._assetRoots_DEPRECATED = opts.assetRoots_DEPRECATED;
  this._assetExts = opts.assetExts;
  this._ignoreFilePath = opts.ignoreFilePath;
  this._fileWatcher = options.fileWatcher;

  this._loaded = false;
  this._queue = this._roots.slice();
  this._graph = Object.create(null);
  this._packageByRoot = Object.create(null);
  this._packagesById = Object.create(null);
  this._moduleById = Object.create(null);
  this._debugUpdateEvents = [];

  this._moduleExtPattern = new RegExp(
    '\.(' + ['js'].concat(this._assetExts).join('|') + ')$'
  );

  // Kick off the search process to precompute the dependency graph.
  this._init();
}

DependecyGraph.prototype.load = function() {
  if (this._loading != null) {
    return this._loading;
  }

  this._loading = Promise.all([
    this._search(),
    this._buildAssetMap_DEPRECATED(),
  ]);

  return this._loading;
};

/**
 * Given an entry file return an array of all the dependent module descriptors.
 */
DependecyGraph.prototype.getOrderedDependencies = function(entryPath) {
  var absolutePath = this._getAbsolutePath(entryPath);
  if (absolutePath == null) {
    throw new NotFoundError(
      'Cannot find entry file %s in any of the roots: %j',
      entryPath,
      this._roots
    );
  }

  var module = this._graph[absolutePath];
  if (module == null) {
    throw new Error('Module with path "' + entryPath + '" is not in graph');
  }

  var self = this;
  var deps = [];
  var visited = Object.create(null);

  // Node haste sucks. Id's aren't unique. So to make sure our entry point
  // is the thing that ends up in our dependency list.
  var graphMap = Object.create(this._moduleById);
  graphMap[module.id] = module;

  // Recursively collect the dependency list.
  function collect(module) {
    deps.push(module);

    module.dependencies.forEach(function(name) {
      var id = sansExtJs(name);
      var dep = self.resolveDependency(module, id);

      if (dep == null) {
        debug(
          'WARNING: Cannot find required module `%s` from module `%s`.',
          name,
          module.id
        );
        return;
      }

      if (!visited[dep.id]) {
        visited[dep.id] = true;
        collect(dep);
      }
    });
  }

  visited[module.id] = true;
  collect(module);

  return deps;
};

/**
 * Given a module descriptor `fromModule` return the module descriptor for
 * the required module `depModuleId`. It could be top-level or relative,
 * or both.
 */
DependecyGraph.prototype.resolveDependency = function(
  fromModule,
  depModuleId
) {
  if (this._assetMap_DEPRECATED != null) {
    var assetMatch = depModuleId.match(/^image!(.+)/);
    // Process DEPRECATED global asset requires.
    if (assetMatch && assetMatch[1]) {
      if (!this._assetMap_DEPRECATED[assetMatch[1]]) {
        debug('WARINING: Cannot find asset:', assetMatch[1]);
        return null;
      }
      return this._assetMap_DEPRECATED[assetMatch[1]];
    }
  }

  var packageJson, modulePath, dep;

  // Package relative modules starts with '.' or '..'.
  if (depModuleId[0] !== '.') {

    // Check if we need to map the dependency to something else via the
    // `browser` field in package.json
    var fromPackageJson = this._lookupPackage(fromModule.path);
    if (fromPackageJson && fromPackageJson.browser &&
        fromPackageJson.browser[depModuleId]) {
      depModuleId = fromPackageJson.browser[depModuleId];
    }

    // `depModuleId` is simply a top-level `providesModule`.
    // `depModuleId` is a package module but given the full path from the
    //  package, i.e. package_name/module_name
    if (this._moduleById[sansExtJs(depModuleId)]) {
      return this._moduleById[sansExtJs(depModuleId)];
    }

    // `depModuleId` is a package and it's depending on the "main" resolution.
    packageJson = this._packagesById[depModuleId];

    // We are being forgiving here and raising an error because we could be
    // processing a file that uses it's own require system.
    if (packageJson == null) {
      debug(
        'WARNING: Cannot find required module `%s` from module `%s`.',
        depModuleId,
        fromModule.id
      );
      return null;
    }

    var main;

    // We prioritize the `browser` field if it's a module path.
    if (typeof packageJson.browser === 'string') {
      main = packageJson.browser;
    } else {
      main = packageJson.main || 'index';
    }

    // If there is a mapping for main in the `browser` field.
    if (packageJson.browser && typeof packageJson.browser === 'object') {
      var tmpMain = packageJson.browser[main] ||
            packageJson.browser[withExtJs(main)] ||
            packageJson.browser[sansExtJs(main)];
      if (tmpMain) {
        main = tmpMain;
      }
    }

    modulePath = withExtJs(path.join(packageJson._root, main));
    dep = this._graph[modulePath];

    // Some packages use just a dir and rely on an index.js inside that dir.
    if (dep == null) {
      dep = this._graph[path.join(packageJson._root, main, 'index.js')];
    }

    if (dep == null) {
      throw new Error(
        'Cannot find package main file for package: ' + packageJson._root
      );
    }
    return dep;
  } else {

    // `depModuleId` is a module defined in a package relative to `fromModule`.
    packageJson = this._lookupPackage(fromModule.path);

    if (packageJson == null) {
      throw new Error(
        'Expected relative module lookup from ' + fromModule.id + ' to ' +
        depModuleId + ' to be within a package but no package.json found.'
      );
    }

    // Example: depModuleId: ../a/b
    //          fromModule.path: /x/y/z
    //          modulePath: /x/y/a/b
    var dir = path.dirname(fromModule.path);
    modulePath = path.join(dir, depModuleId);

    if (packageJson.browser && typeof packageJson.browser === 'object') {
      var relPath = './' + path.relative(packageJson._root, modulePath);
      var tmpModulePath = packageJson.browser[withExtJs(relPath)] ||
            packageJson.browser[sansExtJs(relPath)];
      if (tmpModulePath) {
        modulePath = path.join(packageJson._root, tmpModulePath);
      }
    }

    // JS modules can be required without extensios.
    if (this._assetExts.indexOf(extname(modulePath)) === -1) {
      modulePath = withExtJs(modulePath);
    }

    dep = this._graph[modulePath];

    // Maybe the dependency is a directory and there is an index.js inside it.
    if (dep == null) {
      modulePath = path.join(dir, depModuleId, 'index.js');
    }

    dep = this._graph[modulePath];

    if (dep == null) {
      debug(
        'WARNING: Cannot find required module `%s` from module `%s`.' +
        ' Inferred required module path is %s',
        depModuleId,
        fromModule.id,
        modulePath
      );
      return null;
    }

    return dep;
  }
};

/**
 * Intiates the filewatcher and kicks off the search process.
 */
DependecyGraph.prototype._init = function() {
  var processChange = this._processFileChange.bind(this);
  var watcher = this._fileWatcher;

  this._loading = this.load().then(function() {
    watcher.on('all', processChange);
  });
};

/**
 * Implements a DFS over the file system looking for modules and packages.
 */
DependecyGraph.prototype._search = function() {
  var self = this;
  var dir = this._queue.shift();

  if (dir == null) {
    return Promise.resolve(this._graph);
  }

  // Steps:
  // 1. Read a dir and stat all the entries.
  // 2. Filter the files and queue up the directories.
  // 3. Process any package.json in the files
  // 4. recur.
  return readAndStatDir(dir)
    .spread(function(files, stats) {
      var modulePaths = files.filter(function(filePath, i) {
        if (self._ignoreFilePath(filePath)) {
          return false;
        }

        if (stats[i].isDirectory()) {
          self._queue.push(filePath);
          return false;
        }

        if (stats[i].isSymbolicLink()) {
          return false;
        }

        return filePath.match(self._moduleExtPattern);
      });

      var processing = self._findAndProcessPackage(files, dir)
        .then(function() {
          return Promise.all(modulePaths.map(self._processModule.bind(self)));
        });

      return Promise.all([
        processing,
        self._search()
      ]);
    })
    .then(function() {
      return self;
    });
};

/**
 * Given a list of files find a `package.json` file, and if found parse it
 * and update indices.
 */
DependecyGraph.prototype._findAndProcessPackage = function(files, root) {
  var self = this;

  var packagePath;
  for (var i = 0; i < files.length ; i++) {
    var file = files[i];
    if (path.basename(file) === 'package.json') {
      packagePath = file;
      break;
    }
  }

  if (packagePath != null) {
    return this._processPackage(packagePath);
  } else {
    return Promise.resolve();
  }
};

DependecyGraph.prototype._processPackage = function(packagePath) {
  var packageRoot = path.dirname(packagePath);
  var self = this;
  return readFile(packagePath, 'utf8')
    .then(function(content) {
      var packageJson;
      try {
        packageJson = JSON.parse(content);
      } catch (e) {
        debug('WARNING: malformed package.json: ', packagePath);
        return Promise.resolve();
      }

      if (packageJson.name == null) {
        debug(
          'WARNING: package.json `%s` is missing a name field',
          packagePath
        );
        return Promise.resolve();
      }

      packageJson._root = packageRoot;
      self._addPackageToIndices(packageJson);

      return packageJson;
    });
};

DependecyGraph.prototype._addPackageToIndices = function(packageJson) {
  this._packageByRoot[packageJson._root] = packageJson;
  this._packagesById[packageJson.name] = packageJson;
};

DependecyGraph.prototype._removePackageFromIndices = function(packageJson) {
  delete this._packageByRoot[packageJson._root];
  delete this._packagesById[packageJson.name];
};

/**
 * Parse a module and update indices.
 */
DependecyGraph.prototype._processModule = function(modulePath) {
  var moduleData = { path: path.resolve(modulePath) };
  var module;

  if (this._assetExts.indexOf(extname(modulePath)) > -1) {
    moduleData.id = this._lookupName(modulePath);
    moduleData.isAsset = true;
    moduleData.dependencies = [];
    module = Promise.resolve(new ModuleDescriptor(moduleData));
    this._updateGraphWithModule(module);
  }

  var self = this;
  return readFile(modulePath, 'utf8')
    .then(function(content) {
      var moduleDocBlock = docblock.parseAsObject(content);
      if (moduleDocBlock.providesModule || moduleDocBlock.provides) {
        moduleData.id =
          moduleDocBlock.providesModule || moduleDocBlock.provides;

        // Incase someone wants to require this module via
        // packageName/path/to/module
        moduleData.altId = self._lookupName(modulePath);
      } else {
        moduleData.id = self._lookupName(modulePath);
      }
      moduleData.dependencies = extractRequires(content);

      module = new ModuleDescriptor(moduleData);
      self._updateGraphWithModule(module);
      return module;
    });
};

/**
 * Compute the name of module relative to a package it may belong to.
 */
DependecyGraph.prototype._lookupName = function(modulePath) {
  var packageJson = this._lookupPackage(modulePath);
  if (packageJson == null) {
    return path.resolve(modulePath);
  } else {
    var relativePath =
      sansExtJs(path.relative(packageJson._root, modulePath));
    return path.join(packageJson.name, relativePath);
  }
};

DependecyGraph.prototype._deleteModule = function(module) {
  delete this._graph[module.path];

  // Others may keep a reference so we mark it as deleted.
  module.deleted = true;

  // Haste allows different module to have the same id.
  if (this._moduleById[module.id] === module) {
    delete this._moduleById[module.id];
  }

  if (module.altId && this._moduleById[module.altId] === module) {
    delete this._moduleById[module.altId];
  }
};

/**
 * Update the graph and indices with the module.
 */
DependecyGraph.prototype._updateGraphWithModule = function(module) {
  if (this._graph[module.path]) {
    this._deleteModule(this._graph[module.path]);
  }

  this._graph[module.path] = module;

  if (this._moduleById[module.id]) {
    debug(
      'WARNING: Top-level module name conflict `%s`.\n' +
      'module with path `%s` will replace `%s`',
      module.id,
      module.path,
      this._moduleById[module.id].path
    );
  }

  this._moduleById[module.id] = module;

  // Some module maybe refrenced by both @providesModule and
  // require(package/moduleName).
  if (module.altId != null && this._moduleById[module.altId] == null) {
    this._moduleById[module.altId] = module;
  }
};

/**
 * Find the nearest package to a module.
 */
DependecyGraph.prototype._lookupPackage = function(modulePath) {
  var packageByRoot = this._packageByRoot;

  /**
   * Auxiliary function to recursively lookup a package.
   */
  function lookupPackage(currDir) {
    // ideally we stop once we're outside root and this can be a simple child
    // dir check. However, we have to support modules that was symlinked inside
    // our project root.
    if (currDir === '/') {
      return null;
    } else {
      var packageJson = packageByRoot[currDir];
      if (packageJson) {
        return packageJson;
      } else {
        return lookupPackage(path.dirname(currDir));
      }
    }
  }

  return lookupPackage(path.dirname(modulePath));
};

/**
 * Process a filewatcher change event.
 */
DependecyGraph.prototype._processFileChange = function(
  eventType,
  filePath,
  root,
  stat
) {
  var absPath = path.join(root, filePath);
  if (this._ignoreFilePath(absPath)) {
    return;
  }

  this._debugUpdateEvents.push({event: eventType, path: filePath});

  if (this._assetExts.indexOf(extname(filePath)) > -1) {
    this._processAssetChange_DEPRECATED(eventType, absPath);
    // Fall through because new-style assets are actually modules.
  }

  var isPackage = path.basename(filePath) === 'package.json';
  if (eventType === 'delete') {
    if (isPackage) {
      var packageJson = this._packageByRoot[path.dirname(absPath)];
      if (packageJson) {
        this._removePackageFromIndices(packageJson);
      }
    } else {
      var module = this._graph[absPath];
      if (module == null) {
        return;
      }

      this._deleteModule(module);
    }
  } else if (!(stat && stat.isDirectory())) {
    var self = this;
    this._loading = this._loading.then(function() {
      if (isPackage) {
        return self._processPackage(absPath);
      }
      return self._processModule(absPath);
    });
  }
};

DependecyGraph.prototype.getDebugInfo = function() {
  return '<h1>FileWatcher Update Events</h1>' +
    '<pre>' + util.inspect(this._debugUpdateEvents) + '</pre>' +
    '<h1> Graph dump </h1>' +
    '<pre>' + util.inspect(this._graph) + '</pre>';
};

/**
 * Searches all roots for the file and returns the first one that has file of
 * the same path.
 */
DependecyGraph.prototype._getAbsolutePath = function(filePath) {
  if (isAbsolutePath(filePath)) {
    return filePath;
  }

  for (var i = 0; i < this._roots.length; i++) {
    var root = this._roots[i];
    var absPath = path.join(root, filePath);
    if (this._graph[absPath]) {
      return absPath;
    }
  }

  return null;
};

DependecyGraph.prototype._buildAssetMap_DEPRECATED = function() {
  if (this._assetRoots_DEPRECATED == null ||
      this._assetRoots_DEPRECATED.length === 0) {
    return Promise.resolve();
  }

  this._assetMap_DEPRECATED = Object.create(null);
  return buildAssetMap_DEPRECATED(
    this._assetRoots_DEPRECATED,
    this._processAsset_DEPRECATED.bind(this)
  );
};

DependecyGraph.prototype._processAsset_DEPRECATED = function(file) {
  var ext = extname(file);
  if (this._assetExts.indexOf(ext) !== -1) {
    var name = assetName(file, ext);
    if (this._assetMap_DEPRECATED[name] != null) {
      debug('Conflcting assets', name);
    }

    this._assetMap_DEPRECATED[name] = new ModuleDescriptor({
      id: 'image!' + name,
      path: path.resolve(file),
      isAsset_DEPRECATED: true,
      dependencies: [],
    });
  }
};

DependecyGraph.prototype._processAssetChange_DEPRECATED = function(eventType, file) {
  if (this._assetMap_DEPRECATED == null) {
    return;
  }

  var name = assetName(file, extname(file));
  if (eventType === 'change' || eventType === 'delete') {
    delete this._assetMap_DEPRECATED[name];
  }

  if (eventType === 'change' || eventType === 'add') {
    this._processAsset_DEPRECATED(file);
  }
};

/**
 * Extract all required modules from a `code` string.
 */
var blockCommentRe = /\/\*(.|\n)*?\*\//g;
var lineCommentRe = /\/\/.+(\n|$)/g;
function extractRequires(code) {
  var deps = [];

  code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '')
    .replace(replacePatterns.IMPORT_RE, function(match, pre, quot, dep, post) {
      deps.push(dep);
      return match;
    })
    .replace(replacePatterns.REQUIRE_RE, function(match, pre, quot, dep, post) {
      deps.push(dep);
    });

  return deps;
}

/**
 * `file` without the .js extension.
 */
function sansExtJs(file) {
  if (file.match(/\.js$/)) {
    return file.slice(0, -3);
  } else {
    return file;
  }
}

/**
 * `file` with the .js extension.
 */
function withExtJs(file) {
  if (file.match(/\.js$/)) {
    return file;
  } else {
    return file + '.js';
  }
}

function handleBrokenLink(e) {
  debug('WARNING: error stating, possibly broken symlink', e.message);
  return Promise.resolve();
}

function readAndStatDir(dir) {
  return readDir(dir)
    .then(function(files){
      return Promise.all(files.map(function(filePath) {
        return realpath(path.join(dir, filePath)).catch(handleBrokenLink);
      }));
    }).then(function(files) {
      files = files.filter(function(f) {
        return !!f;
      });

      var stats = files.map(function(filePath) {
        return lstat(filePath).catch(handleBrokenLink);
      });

      return [
        files,
        Promise.all(stats),
      ];
    });
}

/**
 * Given a list of roots and list of extensions find all the files in
 * the directory with that extension and build a map of those assets.
 */
function buildAssetMap_DEPRECATED(roots, processAsset) {
  var queue = roots.slice(0);

  function search() {
    var root = queue.shift();

    if (root == null) {
      return Promise.resolve();
    }

    return readAndStatDir(root).spread(function(files, stats) {
      files.forEach(function(file, i) {
        if (stats[i].isDirectory()) {
          queue.push(file);
        } else {
          processAsset(file);
        }
      });

      return search();
    });
  }

  return search();
}

function assetName(file, ext) {
  return path.basename(file, '.' + ext).replace(/@[\d\.]+x/, '');
}

function extname(name) {
  return path.extname(name).replace(/^\./, '');
}


function NotFoundError() {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  var msg = util.format.apply(util, arguments);
  this.message = msg;
  this.type = this.name = 'NotFoundError';
  this.status = 404;
}

util.inherits(NotFoundError, Error);

module.exports = DependecyGraph;

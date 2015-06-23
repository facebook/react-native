/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var url = require('url');
var path = require('path');
var declareOpts = require('../lib/declareOpts');
var FileWatcher = require('../FileWatcher');
var Packager = require('../Packager');
var Activity = require('../Activity');
var AssetServer = require('../AssetServer');
var Promise = require('promise');
var _ = require('underscore');
var exec = require('child_process').exec;
var fs = require('fs');

module.exports = Server;

var validateOpts = declareOpts({
  projectRoots: {
    type: 'array',
    required: true,
  },
  blacklistRE: {
    type: 'object', // typeof regex is object
  },
  moduleFormat: {
    type: 'string',
    default: 'haste',
  },
  polyfillModuleNames: {
    type: 'array',
    default: [],
  },
  cacheVersion: {
    type: 'string',
    default: '1.0',
  },
  resetCache: {
    type: 'boolean',
    default: false,
  },
  transformModulePath: {
    type:'string',
    required: false,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
  assetRoots: {
    type: 'array',
    required: false,
  },
  assetExts: {
    type: 'array',
    default: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'],
  },
});

function Server(options) {
  var opts = validateOpts(options);

  this._projectRoots = opts.projectRoots;
  this._packages = Object.create(null);
  this._changeWatchers = [];

  var assetGlobs = opts.assetExts.map(function(ext) {
    return '**/*.' + ext;
  });

  var watchRootConfigs = opts.projectRoots.map(function(dir) {
    return {
      dir: dir,
      globs: [
        '**/*.js',
        '**/*.json',
      ].concat(assetGlobs),
    };
  });

  if (opts.assetRoots != null) {
    watchRootConfigs = watchRootConfigs.concat(
      opts.assetRoots.map(function(dir) {
        return {
          dir: dir,
          globs: assetGlobs,
        };
      })
    );
  }

  this._fileWatcher = options.nonPersistent
    ? FileWatcher.createDummyWatcher()
    : new FileWatcher(watchRootConfigs);

  this._assetServer = new AssetServer({
    projectRoots: opts.projectRoots,
    assetExts: opts.assetExts,
  });

  var packagerOpts = Object.create(opts);
  packagerOpts.fileWatcher = this._fileWatcher;
  packagerOpts.assetServer = this._assetServer;
  this._packager = new Packager(packagerOpts);

  var onFileChange = this._onFileChange.bind(this);
  this._fileWatcher.on('all', onFileChange);

  var self = this;
  this._debouncedFileChangeHandler = _.debounce(function(filePath) {
    self._rebuildPackages(filePath);
    self._informChangeWatchers();
  }, 50);
}

Server.prototype._onFileChange = function(type, filepath, root) {
  var absPath = path.join(root, filepath);
  this._packager.invalidateFile(absPath);
  // Make sure the file watcher event runs through the system before
  // we rebuild the packages.
  this._debouncedFileChangeHandler(absPath);
};

Server.prototype._rebuildPackages = function() {
  var buildPackage = this.buildPackage.bind(this);
  var packages = this._packages;

  Object.keys(packages).forEach(function(optionsJson) {
    var options = JSON.parse(optionsJson);
    // Wait for a previous build (if exists) to finish.
    packages[optionsJson] = (packages[optionsJson] || Promise.resolve()).finally(function() {
      // With finally promise callback we can't change the state of the promise
      // so we need to reassign the promise.
      packages[optionsJson] = buildPackage(options).then(function(p) {
        // Make a throwaway call to getSource to cache the source string.
        p.getSource({
          inlineSourceMap: options.inlineSourceMap,
          minify: options.minify,
        });
        return p;
      });
    });
    return packages[optionsJson];
  });
};

Server.prototype._informChangeWatchers = function() {
  var watchers = this._changeWatchers;
  var headers = {
    'Content-Type': 'application/json; charset=UTF-8',
  };

  watchers.forEach(function(w) {
    w.res.writeHead(205, headers);
    w.res.end(JSON.stringify({ changed: true }));
  });

  this._changeWatchers = [];
};

Server.prototype.end = function() {
  Promise.all([
    this._fileWatcher.end(),
    this._packager.kill(),
  ]);
};

var packageOpts = declareOpts({
  sourceMapUrl: {
    type: 'string',
    required: false,
  },
  entryFile: {
    type: 'string',
    required: true,
  },
  dev: {
    type: 'boolean',
    default: true,
  },
  minify: {
    type: 'boolean',
    default: false,
  },
  runModule: {
    type: 'boolean',
    default: true,
  },
  inlineSourceMap: {
    type: 'boolean',
    default: false,
  },
});

Server.prototype.buildPackage = function(options) {
  var opts = packageOpts(options);

  return this._packager.package(
    opts.entryFile,
    opts.runModule,
    opts.sourceMapUrl,
    opts.dev
  );
};

Server.prototype.buildPackageFromUrl = function(reqUrl) {
  var options = getOptionsFromUrl(reqUrl);
  return this.buildPackage(options);
};

Server.prototype.getDependencies = function(main) {
  return this._packager.getDependencies(main);
};

Server.prototype._processDebugRequest = function(reqUrl, res) {
  var ret = '<!doctype html>';
  var pathname = url.parse(reqUrl).pathname;
  var parts = pathname.split('/').filter(Boolean);
  if (parts.length === 1) {
    ret += '<div><a href="/debug/packages">Cached Packages</a></div>';
    ret += '<div><a href="/debug/graph">Dependency Graph</a></div>';
    res.end(ret);
  } else if (parts[1] === 'packages') {
    ret += '<h1> Cached Packages </h1>';
    Promise.all(Object.keys(this._packages).map(function(optionsJson) {
      return this._packages[optionsJson].then(function(p) {
        ret += '<div><h2>' + optionsJson + '</h2>';
        ret += p.getDebugInfo();
      });
    }, this)).then(
      function() { res.end(ret); },
      function(e) {
        res.writeHead(500);
        res.end('Internal Error');
        console.log(e.stack);
      }
    );
  } else if (parts[1] === 'graph'){
    ret += '<h1> Dependency Graph </h2>';
    ret += this._packager.getGraphDebugInfo();
    res.end(ret);
  } else {
    res.writeHead('404');
    res.end('Invalid debug request');
    return;
  }
};

Server.prototype._processOnChangeRequest = function(req, res) {
  var watchers = this._changeWatchers;

  watchers.push({
    req: req,
    res: res,
  });

  req.on('close', function() {
    for (var i = 0; i < watchers.length; i++) {
      if (watchers[i] && watchers[i].req === req) {
        watchers.splice(i, 1);
        break;
      }
    }
  });
};

Server.prototype._processAssetsRequest = function(req, res) {
  var urlObj = url.parse(req.url, true);
  var assetPath = urlObj.pathname.match(/^\/assets\/(.+)$/);
  this._assetServer.get(assetPath[1])
    .then(
      function(data) {
        res.end(data);
      },
      function(error) {
        console.error(error.stack);
        res.writeHead('404');
        res.end('Asset not found');
      }
    ).done();
};

Server.prototype._processProfile = function(req, res) {
  console.log('Dumping profile information...');
  var dumpName = '/tmp/dump_' + Date.now() + '.json';
  var prefix = process.env.TRACE_VIEWER_PATH || '';
  var cmd = path.join(prefix, 'trace2html') + ' ' + dumpName;
  fs.writeFileSync(dumpName, req.rawBody);
  exec(cmd, function (error) {
    if (error) {
      if (error.code === 127) {
        console.error(
          '\n** Failed executing `' + cmd + '` **\n\n' +
          'Google trace-viewer is required to visualize the data, do you have it installled?\n\n' +
          'You can get it at:\n\n' +
          '  https://github.com/google/trace-viewer\n\n' +
          'If it\'s not in your path,  you can set a custom path with:\n\n' +
          '  TRACE_VIEWER_PATH=/path/to/trace-viewer\n\n' +
          'NOTE: Your profile data was kept at:\n\n' +
          '  ' + dumpName
        );
      } else {
        console.error('Unknown error', error);
      }
      res.end();
      return;
    } else {
      exec('rm ' + dumpName);
      exec('open ' + dumpName.replace(/json$/, 'html'), function (error) {
        if (error) {
          console.error(error);
        }
        res.end();
      });
    }
  });
};

Server.prototype.processRequest = function(req, res, next) {
  var urlObj = url.parse(req.url, true);
  var pathname = urlObj.pathname;

  var requestType;
  if (pathname.match(/\.bundle$/)) {
    requestType = 'bundle';
  } else if (pathname.match(/\.map$/)) {
    requestType = 'map';
  } else if (pathname.match(/^\/debug/)) {
    this._processDebugRequest(req.url, res);
    return;
  } else if (pathname.match(/^\/onchange\/?$/)) {
    this._processOnChangeRequest(req, res);
    return;
  } else if (pathname.match(/^\/assets\//)) {
    this._processAssetsRequest(req, res);
    return;
  } else if (pathname.match(/^\/profile\/?$/)) {
    this._processProfile(req, res);
    return;
  } else {
    next();
    return;
  }

  var startReqEventId = Activity.startEvent('request:' + req.url);
  var options = getOptionsFromUrl(req.url);
  var optionsJson = JSON.stringify(options);
  var building = this._packages[optionsJson] || this.buildPackage(options);

  this._packages[optionsJson] = building;
  building.then(
    function(p) {
      if (requestType === 'bundle') {
        res.end(p.getSource({
          inlineSourceMap: options.inlineSourceMap,
          minify: options.minify,
        }));
        Activity.endEvent(startReqEventId);
      } else if (requestType === 'map') {
        res.end(JSON.stringify(p.getSourceMap()));
        Activity.endEvent(startReqEventId);
      }
    },
    function(error) {
      handleError(res, error);
    }
  ).done();
};

function getOptionsFromUrl(reqUrl) {
  // `true` to parse the query param as an object.
  var urlObj = url.parse(reqUrl, true);
  // node v0.11.14 bug see https://github.com/facebook/react-native/issues/218
  urlObj.query = urlObj.query || {};

  var pathname = decodeURIComponent(urlObj.pathname);

  // Backwards compatibility. Options used to be as added as '.' to the
  // entry module name. We can safely remove these options.
  var entryFile = pathname.replace(/^\//, '').split('.').filter(function(part) {
    if (part === 'includeRequire' || part === 'runModule' ||
        part === 'bundle' || part === 'map') {
      return false;
    }
    return true;
  }).join('.') + '.js';

  return {
    sourceMapUrl: pathname.replace(/\.bundle$/, '.map'),
    entryFile: entryFile,
    dev: getBoolOptionFromQuery(urlObj.query, 'dev', true),
    minify: getBoolOptionFromQuery(urlObj.query, 'minify'),
    runModule: getBoolOptionFromQuery(urlObj.query, 'runModule', true),
    inlineSourceMap: getBoolOptionFromQuery(
      urlObj.query,
      'inlineSourceMap',
      false
    ),
  };
}

function getBoolOptionFromQuery(query, opt, defaultVal) {
  if (query[opt] == null && defaultVal != null) {
    return defaultVal;
  }

  return query[opt] === 'true' || query[opt] === '1';
}

function handleError(res, error) {
  res.writeHead(error.status || 500, {
    'Content-Type': 'application/json; charset=UTF-8',
  });

  if (error.type === 'TransformError' || error.type === 'NotFoundError') {
    error.errors = [{
      description: error.description,
      filename: error.filename,
      lineNumber: error.lineNumber,
    }];
    console.error(error);
    res.end(JSON.stringify(error));
  } else {
    console.error(error.stack || error);
    res.end(JSON.stringify({
      type: 'InternalError',
      message: 'react-packager has encountered an internal error, ' +
        'please check your terminal error output for more details',
    }));
  }
}

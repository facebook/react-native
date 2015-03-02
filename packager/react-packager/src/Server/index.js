'use strict';

var url = require('url');
var path = require('path');
var declareOpts = require('../lib/declareOpts');
var FileWatcher = require('../FileWatcher');
var Packager = require('../Packager');
var Activity = require('../Activity');
var q = require('q');

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
  dev: {
    type: 'boolean',
    default: true,
  },
  transformModulePath: {
    type:'string',
    required: true,
  },
  nonPersistent: {
    type: 'boolean',
    default: false,
  },
});

function Server(options) {
  var opts = validateOpts(options);
  this._projectRoots = opts.projectRoots;
  this._packages = Object.create(null);
  this._packager = new Packager(opts);

  this._fileWatcher = options.nonPersistent
    ? FileWatcher.createDummyWatcher()
    : new FileWatcher(options.projectRoots);

  var onFileChange = this._onFileChange.bind(this);
  this._fileWatcher.on('all', onFileChange);
}

Server.prototype._onFileChange = function(type, filepath, root) {
  var absPath = path.join(root, filepath);
  this._packager.invalidateFile(absPath);
  // Make sure the file watcher event runs through the system before
  // we rebuild the packages.
  setImmediate(this._rebuildPackages.bind(this, absPath));
};

Server.prototype._rebuildPackages = function() {
  var buildPackage = this._buildPackage.bind(this);
  var packages = this._packages;
  Object.keys(packages).forEach(function(key) {
    var options = getOptionsFromPath(url.parse(key).pathname);
    packages[key] = buildPackage(options).then(function(p) {
      // Make a throwaway call to getSource to cache the source string.
      p.getSource();
      return p;
    });
  });
};

Server.prototype.end = function() {
  q.all([
    this._fileWatcher.end(),
    this._packager.kill(),
  ]);
};

Server.prototype._buildPackage = function(options) {
  return this._packager.package(
    options.main,
    options.runModule,
    options.sourceMapUrl
  );
};

Server.prototype.buildPackageFromUrl = function(reqUrl) {
  var options = getOptionsFromPath(url.parse(reqUrl).pathname);
  return this._buildPackage(options);
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
    q.all(Object.keys(this._packages).map(function(url) {
      return this._packages[url].then(function(p) {
        ret += '<div><h2>' + url + '</h2>';
        ret += p.getDebugInfo();
      });
    }, this)).then(
      function() { res.end(ret); },
      function(e) {
        res.wrteHead(500);
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

Server.prototype.processRequest = function(req, res, next) {
  var requestType;
  if (req.url.match(/\.bundle$/)) {
    requestType = 'bundle';
  } else if (req.url.match(/\.map$/)) {
    requestType = 'map';
  } else if (req.url.match(/^\/debug/)) {
    this._processDebugRequest(req.url, res);
    return;
  } else {
    return next();
  }

  var startReqEventId = Activity.startEvent('request:' + req.url);
  var options = getOptionsFromPath(url.parse(req.url).pathname);
  var building = this._packages[req.url] || this._buildPackage(options);
  this._packages[req.url] = building;
  building.then(
    function(p) {
      if (requestType === 'bundle') {
        res.end(p.getSource());
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

function getOptionsFromPath(pathname) {
  var parts = pathname.split('.');
  // Remove the leading slash.
  var main = parts[0].slice(1) + '.js';
  return {
    runModule: parts.slice(1).some(function(part) {
      return part === 'runModule';
    }),
    main: main,
    sourceMapUrl: parts.slice(0, -1).join('.') + '.map'
  };
}

function handleError(res, error) {
  res.writeHead(500, {
    'Content-Type': 'application/json; charset=UTF-8',
  });

  if (error.type === 'TransformError') {
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

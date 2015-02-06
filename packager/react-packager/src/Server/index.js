var url = require('url');
var path = require('path');
var FileWatcher = require('../FileWatcher')
var Packager = require('../Packager');
var Activity = require('../Activity');
var q = require('q');

module.exports = Server;

function Server(options) {
  this._projectRoot = options.projectRoot;
  this._packages = Object.create(null);
  this._packager = new Packager({
    projectRoot: options.projectRoot,
    blacklistRE: options.blacklistRE,
    polyfillModuleNames: options.polyfillModuleNames || [],
    runtimeCode: options.runtimeCode,
    cacheVersion: options.cacheVersion,
    resetCache: options.resetCache,
    dev: options.dev,
  });

  this._fileWatcher = new FileWatcher(options.projectRoot);

  var onFileChange = this._onFileChange.bind(this);
  this._fileWatcher.getWatcher().done(function(watcher) {
    watcher.on('all', onFileChange);
  });
}

Server.prototype._onFileChange = function(type, filepath) {
  var absPath = path.join(this._projectRoot, filepath);
  this._packager.invalidateFile(absPath);
  this._rebuildPackages(absPath);
};

Server.prototype._rebuildPackages = function(filepath) {
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

Server.prototype.kill = function() {
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

Server.prototype.processRequest = function(req, res, next) {
  var requestType;
  if (req.url.match(/\.bundle$/)) {
    requestType = 'bundle';
  } else if (req.url.match(/\.map$/)) {
    requestType = 'map';
  } else {
    return next();
  }

  var startReqEventId = Activity.startEvent('request:' + req.url);
  var options = getOptionsFromPath(url.parse(req.url).pathname);
  var building = this._packages[req.url] || this._buildPackage(options)
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

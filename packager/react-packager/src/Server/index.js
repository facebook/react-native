'use strict';

var url = require('url');
var path = require('path');
var declareOpts = require('../lib/declareOpts');
var FileWatcher = require('../FileWatcher');
var Packager = require('../Packager');
var Activity = require('../Activity');
var setImmediate = require('timers').setImmediate;
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
  transformModulePath: {
    type:'string',
    required: false,
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
  this._changeWatchers = [];

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
  setImmediate(this._informChangeWatchers.bind(this));
};

Server.prototype._rebuildPackages = function() {
  var buildPackage = this._buildPackage.bind(this);
  var packages = this._packages;
  Object.keys(packages).forEach(function(key) {
    var options = getOptionsFromUrl(key);
    packages[key] = buildPackage(options).then(function(p) {
      // Make a throwaway call to getSource to cache the source string.
      p.getSource({
        inlineSourceMap: options.dev,
        minify: options.minify,
      });
      return p;
    });
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
  q.all([
    this._fileWatcher.end(),
    this._packager.kill(),
  ]);
};

Server.prototype._buildPackage = function(options) {
  return this._packager.package(
    options.main,
    options.runModule,
    options.sourceMapUrl,
    options.dev
  );
};

Server.prototype.buildPackageFromUrl = function(reqUrl) {
  var options = getOptionsFromUrl(reqUrl);
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
  } else {
    next();
    return;
  }

  var startReqEventId = Activity.startEvent('request:' + req.url);
  var options = getOptionsFromUrl(req.url);
  var building = this._packages[req.url] || this._buildPackage(options);

  this._packages[req.url] = building;
    building.then(
    function(p) {
      if (requestType === 'bundle') {
        res.end(p.getSource({
          inlineSourceMap: options.dev,
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

  var match = urlObj.pathname.match(/^\/?([^\.]+)\..*(bundle|map)$/);
  if (!(match && match[1])) {
    throw new Error('Invalid url format, expected "/path/to/file.bundle"');
  }
  var main = match[1] + '.js';

  return {
    sourceMapUrl: urlObj.pathname.replace(/\.bundle$/, '.map'),
    main: main,
    dev: getBoolOptionFromQuery(urlObj.query, 'dev', true),
    minify: getBoolOptionFromQuery(urlObj.query, 'minify'),
    runModule: getBoolOptionFromQuery(urlObj.query, 'runModule') ||
      // Backwards compatibility.
      urlObj.pathname.split('.').some(function(part) {
        return part === 'runModule';
      }),
  };
}

function getBoolOptionFromQuery(query, opt, defaultVal) {
  if (query[opt] == null && defaultVal != null) {
    return defaultVal;
  }

  return query[opt] === 'true' || query[opt] === '1';
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

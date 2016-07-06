/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Activity = require('../Activity');
const AssetServer = require('../AssetServer');
const FileWatcher = require('node-haste').FileWatcher;
const getPlatformExtension = require('node-haste').getPlatformExtension;
const Bundler = require('../Bundler');
const Promise = require('promise');
const SourceMapConsumer = require('source-map').SourceMapConsumer;

const declareOpts = require('../lib/declareOpts');
const path = require('path');
const url = require('url');

function debounce(fn, delay) {
  var timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, delay);
  };
}

const validateOpts = declareOpts({
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
    type: 'string',
    required: false,
  },
  extraNodeModules: {
    type: 'object',
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
    default: [
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp', // Image formats
      'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', // Video formats
      'aac', 'aiff', 'caf', 'm4a', 'mp3', 'wav', // Audio formats
      'html', 'pdf', // Document formats
    ],
  },
  transformTimeoutInterval: {
    type: 'number',
    required: false,
  },
  getTransformOptionsModulePath: {
    type: 'string',
    required: false,
  },
  silent: {
    type: 'boolean',
    default: false,
  },
});

const bundleOpts = declareOpts({
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
  platform: {
    type: 'string',
    required: true,
  },
  runBeforeMainModule: {
    type: 'array',
    default: [
      // Ensures essential globals are available and are patched correctly.
      'InitializeJavaScriptAppEngine'
    ],
  },
  unbundle: {
    type: 'boolean',
    default: false,
  },
  hot: {
    type: 'boolean',
    default: false,
  },
  entryModuleOnly: {
    type: 'boolean',
    default: false,
  },
  isolateModuleIDs: {
    type: 'boolean',
    default: false
  }
});

const dependencyOpts = declareOpts({
  platform: {
    type: 'string',
    required: true,
  },
  dev: {
    type: 'boolean',
    default: true,
  },
  entryFile: {
    type: 'string',
    required: true,
  },
  recursive: {
    type: 'boolean',
    default: true,
  },
  hot: {
    type: 'boolean',
    default: false,
  },
});

class Server {
  constructor(options) {
    const opts = validateOpts(options);

    this._projectRoots = opts.projectRoots;
    this._bundles = Object.create(null);
    this._changeWatchers = [];
    this._fileChangeListeners = [];

    const assetGlobs = opts.assetExts.map(ext => '**/*.' + ext);

    let watchRootConfigs = opts.projectRoots.map(dir => {
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
        opts.assetRoots.map(dir => {
          return {
            dir: dir,
            globs: assetGlobs,
          };
        })
      );
    }

    this._fileWatcher = options.nonPersistent
      ? FileWatcher.createDummyWatcher()
      : new FileWatcher(watchRootConfigs, {useWatchman: true});

    this._assetServer = new AssetServer({
      projectRoots: opts.projectRoots,
      assetExts: opts.assetExts,
    });

    const bundlerOpts = Object.create(opts);
    bundlerOpts.fileWatcher = this._fileWatcher;
    bundlerOpts.assetServer = this._assetServer;
    this._bundler = new Bundler(bundlerOpts);

    this._fileWatcher.on('all', this._onFileChange.bind(this));

    this._debouncedFileChangeHandler = debounce(filePath => {
      this._clearBundles();
      this._informChangeWatchers();
    }, 50);
  }

  end() {
    Promise.all([
      this._fileWatcher.end(),
      this._bundler.kill(),
    ]);
  }

  setHMRFileChangeListener(listener) {
    this._hmrFileChangeListener = listener;
  }

  addFileChangeListener(listener) {
    if (this._fileChangeListeners.indexOf(listener) === -1) {
      this._fileChangeListeners.push(listener);
    }
  }

  buildBundle(options) {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = bundleOpts(options);
      return this._bundler.bundle(opts);
    });
  }

  buildPrepackBundle(options) {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = bundleOpts(options);
      return this._bundler.prepackBundle(opts);
    });
  }

  buildBundleFromUrl(reqUrl) {
    const options = this._getOptionsFromUrl(reqUrl);
    return this.buildBundle(options);
  }

  buildBundleForHMR(modules, host, port) {
    return this._bundler.hmrBundle(modules, host, port);
  }

  getShallowDependencies(options) {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = dependencyOpts(options);
      return this._bundler.getShallowDependencies(opts);
    });
  }

  getModuleForPath(entryFile) {
    return this._bundler.getModuleForPath(entryFile);
  }

  getDependencies(options) {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = dependencyOpts(options);
      return this._bundler.getDependencies(opts);
    });
  }

  getOrderedDependencyPaths(options) {
    return Promise.resolve().then(() => {
      const opts = dependencyOpts(options);
      return this._bundler.getOrderedDependencyPaths(opts);
    });
  }

  _onFileChange(type, filepath, root) {
    const absPath = path.join(root, filepath);
    this._bundler.invalidateFile(absPath);

    // If Hot Loading is enabled avoid rebuilding bundles and sending live
    // updates. Instead, send the HMR updates right away and clear the bundles
    // cache so that if the user reloads we send them a fresh bundle
    if (this._hmrFileChangeListener) {
      // Clear cached bundles in case user reloads
      this._clearBundles();
      this._hmrFileChangeListener(absPath, this._bundler.stat(absPath));
      return;
    }

    Promise.all(
      this._fileChangeListeners.map(listener => listener(absPath))
    ).then(
      () => this._onFileChangeComplete(absPath),
      () => this._onFileChangeComplete(absPath)
    );
  }

  _onFileChangeComplete(absPath) {
    // Make sure the file watcher event runs through the system before
    // we rebuild the bundles.
    this._debouncedFileChangeHandler(absPath);
  }

  _clearBundles() {
    this._bundles = Object.create(null);
  }

  _informChangeWatchers() {
    const watchers = this._changeWatchers;
    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
    };

    watchers.forEach(function(w) {
      w.res.writeHead(205, headers);
      w.res.end(JSON.stringify({ changed: true }));
    });

    this._changeWatchers = [];
  }

  _processDebugRequest(reqUrl, res) {
    let ret = '<!doctype html>';
    const pathname = url.parse(reqUrl).pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
      ret += '<div><a href="/debug/bundles">Cached Bundles</a></div>';
      res.end(ret);
    } else if (parts[1] === 'bundles') {
      ret += '<h1> Cached Bundles </h1>';
      Promise.all(Object.keys(this._bundles).map(optionsJson =>
        this._bundles[optionsJson].then(p => {
          ret += '<div><h2>' + optionsJson + '</h2>';
          ret += p.getDebugInfo();
        })
      )).then(
        () => res.end(ret),
        e => {
          res.writeHead(500);
          res.end('Internal Error');
          console.log(e.stack); // eslint-disable-line no-console-disallow
        }
      );
    } else {
      res.writeHead('404');
      res.end('Invalid debug request');
      return;
    }
  }

  _processOnChangeRequest(req, res) {
    const watchers = this._changeWatchers;

    watchers.push({
      req: req,
      res: res,
    });

    req.on('close', () => {
      for (let i = 0; i < watchers.length; i++) {
        if (watchers[i] && watchers[i].req === req) {
          watchers.splice(i, 1);
          break;
        }
      }
    });
  }

  _processAssetsRequest(req, res) {
    const urlObj = url.parse(req.url, true);
    const assetPath = urlObj.pathname.match(/^\/assets\/(.+)$/);
    const assetEvent = Activity.startEvent(`processing asset request ${assetPath[1]}`);
    this._assetServer.get(assetPath[1], urlObj.query.platform)
      .then(
        data => res.end(data),
        error => {
          console.error(error.stack);
          res.writeHead('404');
          res.end('Asset not found');
        }
      ).done(() => Activity.endEvent(assetEvent));
  }

  processRequest(req, res, next) {
    const urlObj = url.parse(req.url, true);
    const pathname = urlObj.pathname;

    let requestType;
    if (pathname.match(/\.bundle$/)) {
      requestType = 'bundle';
    } else if (pathname.match(/\.map$/)) {
      requestType = 'map';
    } else if (pathname.match(/\.assets$/)) {
      requestType = 'assets';
    } else if (pathname.match(/^\/debug/)) {
      this._processDebugRequest(req.url, res);
      return;
    } else if (pathname.match(/^\/onchange\/?$/)) {
      this._processOnChangeRequest(req, res);
      return;
    } else if (pathname.match(/^\/assets\//)) {
      this._processAssetsRequest(req, res);
      return;
    } else if (pathname === '/symbolicate') {
      this._symbolicate(req, res);
      return;
    } else {
      next();
      return;
    }

    const startReqEventId = Activity.startEvent('request:' + req.url);
    const options = this._getOptionsFromUrl(req.url);
    const optionsJson = JSON.stringify(options);
    const building = this._bundles[optionsJson] || this.buildBundle(options);

    this._bundles[optionsJson] = building;
    building.then(
      p => {
        if (requestType === 'bundle') {
          const bundleSource = p.getSource({
            inlineSourceMap: options.inlineSourceMap,
            minify: options.minify,
            dev: options.dev,
          });
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('ETag', p.getEtag());
          if (req.headers['if-none-match'] === res.getHeader('ETag')){
            res.statusCode = 304;
            res.end();
          } else {
            res.end(bundleSource);
          }
          Activity.endEvent(startReqEventId);
        } else if (requestType === 'map') {
          let sourceMap = p.getSourceMap({
            minify: options.minify,
            dev: options.dev,
          });

          if (typeof sourceMap !== 'string') {
            sourceMap = JSON.stringify(sourceMap);
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(sourceMap);
          Activity.endEvent(startReqEventId);
        } else if (requestType === 'assets') {
          const assetsList = JSON.stringify(p.getAssets());
          res.setHeader('Content-Type', 'application/json');
          res.end(assetsList);
          Activity.endEvent(startReqEventId);
        }
      },
      this._handleError.bind(this, res, optionsJson)
    ).done();
  }

  _symbolicate(req, res) {
    const startReqEventId = Activity.startEvent('symbolicate');
    new Promise.resolve(req.rawBody).then(body => {
      const stack = JSON.parse(body).stack;

      // In case of multiple bundles / HMR, some stack frames can have
      // different URLs from others
      const urlIndexes = {};
      const uniqueUrls = [];
      stack.forEach(frame => {
        const sourceUrl = frame.file;
        // Skip `/debuggerWorker.js` which drives remote debugging because it
        // does not need to symbolication.
        // Skip anything except http(s), because there is no support for that yet
        if (!urlIndexes.hasOwnProperty(sourceUrl) &&
            !sourceUrl.endsWith('/debuggerWorker.js') &&
            sourceUrl.startsWith('http')) {
          urlIndexes[sourceUrl] = uniqueUrls.length;
          uniqueUrls.push(sourceUrl);
        }
      });

      const sourceMaps = uniqueUrls.map(
        sourceUrl => this._sourceMapForURL(sourceUrl)
      );
      return Promise.all(sourceMaps).then(consumers => {
        return stack.map(frame => {
          const sourceUrl = frame.file;
          if (!urlIndexes.hasOwnProperty(sourceUrl)) {
            return frame;
          }
          const idx = urlIndexes[sourceUrl];
          const consumer = consumers[idx];
          const original = consumer.originalPositionFor({
            line: frame.lineNumber,
            column: frame.column,
          });
          if (!original) {
            return frame;
          }
          return Object.assign({}, frame, {
            file: original.source,
            lineNumber: original.line,
            column: original.column,
          });
        });
      });
    }).then(
      stack => res.end(JSON.stringify({stack: stack})),
      error => {
        console.error(error.stack || error);
        res.statusCode = 500;
        res.end(JSON.stringify({error: error.message}));
      }
    ).done(() => {
      Activity.endEvent(startReqEventId);
    });
  }

  _sourceMapForURL(reqUrl) {
    const options = this._getOptionsFromUrl(reqUrl);
    const optionsJson = JSON.stringify(options);
    const building = this._bundles[optionsJson] || this.buildBundle(options);
    this._bundles[optionsJson] = building;
    return building.then(p => {
      const sourceMap = p.getSourceMap({
        minify: options.minify,
        dev: options.dev,
      });
      return new SourceMapConsumer(sourceMap);
    });
  }

  _handleError(res, bundleID, error) {
    res.writeHead(error.status || 500, {
      'Content-Type': 'application/json; charset=UTF-8',
    });

    if (error.type === 'TransformError' ||
        error.type === 'NotFoundError' ||
        error.type === 'UnableToResolveError') {
      error.errors = [{
        description: error.description,
        filename: error.filename,
        lineNumber: error.lineNumber,
      }];
      res.end(JSON.stringify(error));

      if (error.type === 'NotFoundError') {
        delete this._bundles[bundleID];
      }
    } else {
      console.error(error.stack || error);
      res.end(JSON.stringify({
        type: 'InternalError',
        message: 'react-packager has encountered an internal error, ' +
          'please check your terminal error output for more details',
      }));
    }
  }

  _getOptionsFromUrl(reqUrl) {
    // `true` to parse the query param as an object.
    const urlObj = url.parse(reqUrl, true);
    // node v0.11.14 bug see https://github.com/facebook/react-native/issues/218
    urlObj.query = urlObj.query || {};

    const pathname = decodeURIComponent(urlObj.pathname);

    // Backwards compatibility. Options used to be as added as '.' to the
    // entry module name. We can safely remove these options.
    const entryFile = pathname.replace(/^\//, '').split('.').filter(part => {
      if (part === 'includeRequire' || part === 'runModule' ||
          part === 'bundle' || part === 'map' || part === 'assets') {
        return false;
      }
      return true;
    }).join('.') + '.js';

    const sourceMapUrlObj = Object.assign({}, urlObj);
    sourceMapUrlObj.pathname = pathname.replace(/\.bundle$/, '.map');

    // try to get the platform from the url
    const platform = urlObj.query.platform ||
      getPlatformExtension(pathname);

    return {
      sourceMapUrl: url.format(sourceMapUrlObj),
      entryFile: entryFile,
      dev: this._getBoolOptionFromQuery(urlObj.query, 'dev', true),
      minify: this._getBoolOptionFromQuery(urlObj.query, 'minify'),
      hot: this._getBoolOptionFromQuery(urlObj.query, 'hot', false),
      runModule: this._getBoolOptionFromQuery(urlObj.query, 'runModule', true),
      inlineSourceMap: this._getBoolOptionFromQuery(
        urlObj.query,
        'inlineSourceMap',
        false
      ),
      platform: platform,
      entryModuleOnly: this._getBoolOptionFromQuery(
        urlObj.query,
        'entryModuleOnly',
        false,
      ),
    };
  }

  _getBoolOptionFromQuery(query, opt, defaultVal) {
    if (query[opt] == null && defaultVal != null) {
      return defaultVal;
    }

    return query[opt] === 'true' || query[opt] === '1';
  }
}

module.exports = Server;

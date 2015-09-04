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
const FileWatcher = require('../FileWatcher');
const Bundler = require('../Bundler');
const Promise = require('promise');

const _ = require('underscore');
const declareOpts = require('../lib/declareOpts');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const url = require('url');

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
  transformTimeoutInterval: {
    type: 'number',
    required: false,
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
    required: false,
  }
});

class Server {
  constructor(options) {
    const opts = validateOpts(options);

    this._projectRoots = opts.projectRoots;
    this._bundles = Object.create(null);
    this._changeWatchers = [];

    const assetGlobs = opts.assetExts.map(ext => '**/*.' + ext);

    var watchRootConfigs = opts.projectRoots.map(dir => {
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
      : new FileWatcher(watchRootConfigs);

    this._assetServer = new AssetServer({
      projectRoots: opts.projectRoots,
      assetExts: opts.assetExts,
    });

    const bundlerOpts = Object.create(opts);
    bundlerOpts.fileWatcher = this._fileWatcher;
    bundlerOpts.assetServer = this._assetServer;
    this._bundler = new Bundler(bundlerOpts);

    this._fileWatcher.on('all', this._onFileChange.bind(this));

    this._debouncedFileChangeHandler = _.debounce(filePath => {
      this._rebuildBundles(filePath);
      this._informChangeWatchers();
    }, 50);
  }

  end() {
    Promise.all([
      this._fileWatcher.end(),
      this._bundler.kill(),
    ]);
  }

  buildBundle(options) {
    const opts = bundleOpts(options);
    return this._bundler.bundle(
      opts.entryFile,
      opts.runModule,
      opts.sourceMapUrl,
      opts.dev,
      opts.platform
    );
  }

  buildBundleFromUrl(reqUrl) {
    const options = this._getOptionsFromUrl(reqUrl);
    return this.buildBundle(options);
  }

  getDependencies(main) {
    return this._bundler.getDependencies(main);
  }

  _onFileChange(type, filepath, root) {
    const absPath = path.join(root, filepath);
    this._bundler.invalidateFile(absPath);
    // Make sure the file watcher event runs through the system before
    // we rebuild the bundles.
    this._debouncedFileChangeHandler(absPath);
  }

  _rebuildBundles() {
    const buildBundle = this.buildBundle.bind(this);
    const bundles = this._bundles;

    Object.keys(bundles).forEach(function(optionsJson) {
      const options = JSON.parse(optionsJson);
      // Wait for a previous build (if exists) to finish.
      bundles[optionsJson] = (bundles[optionsJson] || Promise.resolve()).finally(function() {
        // With finally promise callback we can't change the state of the promise
        // so we need to reassign the promise.
        bundles[optionsJson] = buildBundle(options).then(function(p) {
          // Make a throwaway call to getSource to cache the source string.
          p.getSource({
            inlineSourceMap: options.inlineSourceMap,
            minify: options.minify,
          });
          return p;
        });
      });
      return bundles[optionsJson];
    });
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
    var ret = '<!doctype html>';
    const pathname = url.parse(reqUrl).pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
      ret += '<div><a href="/debug/bundles">Cached Bundles</a></div>';
      ret += '<div><a href="/debug/graph">Dependency Graph</a></div>';
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
          console.log(e.stack);
        }
      );
    } else if (parts[1] === 'graph'){
      ret += '<h1> Dependency Graph </h2>';
      ret += this._bundler.getGraphDebugInfo();
      res.end(ret);
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

  _processProfile(req, res) {
    console.log('Dumping profile information...');
    const dumpName = '/tmp/dump_' + Date.now() + '.json';
    const prefix = process.env.TRACE_VIEWER_PATH || '';
    const cmd = path.join(prefix, 'trace2html') + ' ' + dumpName;
    fs.writeFileSync(dumpName, req.rawBody);
    exec(cmd, error => {
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
        exec('open ' + dumpName.replace(/json$/, 'html'), err => {
          if (err) {
            console.error(err);
          }
          res.end();
        });
      }
    });
  }

  processRequest(req, res, next) {
    const urlObj = url.parse(req.url, true);
    var pathname = urlObj.pathname;

    var requestType;
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
    } else if (pathname.match(/^\/profile\/?$/)) {
      this._processProfile(req, res);
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
          var bundleSource = p.getSource({
            inlineSourceMap: options.inlineSourceMap,
            minify: options.minify,
          });
          res.setHeader('Content-Type', 'application/javascript');
          res.end(bundleSource);
          Activity.endEvent(startReqEventId);
        } else if (requestType === 'map') {
          var sourceMap = JSON.stringify(p.getSourceMap());
          res.setHeader('Content-Type', 'application/json');
          res.end(sourceMap);
          Activity.endEvent(startReqEventId);
        } else if (requestType === 'assets') {
          var assetsList = JSON.stringify(p.getAssets());
          res.setHeader('Content-Type', 'application/json');
          res.end(assetsList);
          Activity.endEvent(startReqEventId);
        }
      },
      this._handleError.bind(this, res, optionsJson)
    ).done();
  }

  _handleError(res, bundleID, error) {
    res.writeHead(error.status || 500, {
      'Content-Type': 'application/json; charset=UTF-8',
    });

    if (error.type === 'TransformError' || error.type === 'NotFoundError') {
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

    return {
      sourceMapUrl: pathname.replace(/\.bundle$/, '.map'),
      entryFile: entryFile,
      dev: this._getBoolOptionFromQuery(urlObj.query, 'dev', true),
      minify: this._getBoolOptionFromQuery(urlObj.query, 'minify'),
      runModule: this._getBoolOptionFromQuery(urlObj.query, 'runModule', true),
      inlineSourceMap: this._getBoolOptionFromQuery(
        urlObj.query,
        'inlineSourceMap',
        false
      ),
      platform: urlObj.query.platform,
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

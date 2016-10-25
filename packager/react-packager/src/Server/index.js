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
const FileWatcher = require('../node-haste').FileWatcher;
const getPlatformExtension = require('../node-haste').getPlatformExtension;
const Bundler = require('../Bundler');
const MultipartResponse = require('./MultipartResponse');
const ProgressBar = require('progress');
const Promise = require('promise');
const SourceMapConsumer = require('source-map').SourceMapConsumer;

const declareOpts = require('../lib/declareOpts');
const defaults = require('../../../defaults');
const mime = require('mime-types');
const path = require('path');
const url = require('url');

const debug = require('debug')('ReactNativePackager:Server');

function debounceAndBatch(fn, delay) {
  let timeout, args = [];
  return (value) => {
    args.push(value);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const a = args;
      args = [];
      fn(a);
    }, delay);
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
    default: defaults.assetExts,
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
    default: defaults.runBeforeMainModule,
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
    default: false,
  },
  resolutionResponse: {
    type: 'object',
  },
  generateSourceMaps: {
    type: 'boolean',
    required: false,
  },
  assetPlugins: {
    type: 'array',
    default: [],
  },
  onProgress: {
    type: 'function',
  },
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
  minify: {
    type: 'boolean',
    default: undefined,
  },
});

const bundleDeps = new WeakMap();
const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

class Server {
  constructor(options) {
    const opts = this._opts = validateOpts(options);

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
      assetExts: opts.assetExts,
      fileWatcher: this._fileWatcher,
      projectRoots: opts.projectRoots,
    });

    const bundlerOpts = Object.create(opts);
    bundlerOpts.fileWatcher = this._fileWatcher;
    bundlerOpts.assetServer = this._assetServer;
    bundlerOpts.allowBundleUpdates = !options.nonPersistent;
    this._bundler = new Bundler(bundlerOpts);

    this._fileWatcher.on('all', this._onFileChange.bind(this));

    // changes to the haste map can affect resolution of files in the bundle
    const dependencyGraph = this._bundler.getResolver().getDependecyGraph();

    dependencyGraph.load().then(() => {
      dependencyGraph.getHasteMap().on('change', () => {
        debug('Clearing bundle cache due to haste map change');
        this._clearBundles();
      });
    });

    this._debouncedFileChangeHandler = debounceAndBatch(filePaths => {
      // only clear bundles for non-JS changes
      if (filePaths.every(RegExp.prototype.test, /\.js(?:on)?$/i)) {
        for (const key in this._bundles) {
          this._bundles[key].then(bundle => {
            const deps = bundleDeps.get(bundle);
            filePaths.forEach(filePath => {
              if (deps.files.has(filePath)) {
                deps.outdated.add(filePath);
              }
            });
          }).catch(e => {
            debug(`Could not update bundle: ${e}, evicting from cache`);
            delete this._bundles[key];
          });
        }
      } else {
        debug('Clearing bundles due to non-JS change');
        this._clearBundles();
      }
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
    return this._bundler.getResolver().getDependecyGraph().load().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = bundleOpts(options);
      const building = this._bundler.bundle(opts);
      building.then(bundle => {
        const modules = bundle.getModules();
        const nonVirtual = modules.filter(m => !m.virtual);
        bundleDeps.set(bundle, {
          files: new Map(
            nonVirtual
              .map(({sourcePath, meta = {dependencies: []}}) =>
                [sourcePath, meta.dependencies])
          ),
          idToIndex: new Map(modules.map(({id}, i) => [id, i])),
          dependencyPairs: new Map(
            nonVirtual
              .filter(({meta}) => meta && meta.dependencyPairs)
              .map(m => [m.sourcePath, m.meta.dependencyPairs])
          ),
          outdated: new Set(),
        });
      });
      return building;
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
    } else if (type !== 'change' && absPath.indexOf(NODE_MODULES) !== -1) {
      // node module resolution can be affected by added or removed files
      debug('Clearing bundles due to potential node_modules resolution change');
      this._clearBundles();
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

  _rangeRequestMiddleware(req, res, data, assetPath) {
    if (req.headers && req.headers.range) {
      const [rangeStart, rangeEnd] = req.headers.range.replace(/bytes=/, '').split('-');
      const dataStart = parseInt(rangeStart, 10);
      const dataEnd = rangeEnd ? parseInt(rangeEnd, 10) : data.length - 1;
      const chunksize = (dataEnd - dataStart) + 1;

      res.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Range': `bytes ${dataStart}-${dataEnd}/${data.length}`,
        'Content-Type': mime.lookup(path.basename(assetPath[1])),
      });

      return data.slice(dataStart, dataEnd + 1);
    }

    return data;
  }

  _processAssetsRequest(req, res) {
    const urlObj = url.parse(decodeURI(req.url), true);
    const assetPath = urlObj.pathname.match(/^\/assets\/(.+)$/);
    const assetEvent = Activity.startEvent(
      'Processing asset request',
      {
        asset: assetPath[1],
      },
      {
        displayFields: true,
      },
    );
    this._assetServer.get(assetPath[1], urlObj.query.platform)
      .then(
        data => {
          // Tell clients to cache this for 1 year.
          // This is safe as the asset url contains a hash of the asset.
          res.setHeader('Cache-Control', 'max-age=31536000');
          res.end(this._rangeRequestMiddleware(req, res, data, assetPath));
        },
        error => {
          console.error(error.stack);
          res.writeHead('404');
          res.end('Asset not found');
        }
      ).done(() => Activity.endEvent(assetEvent));
  }

  optionsHash(options) {
    // onProgress is a function, can't be serialized
    return JSON.stringify(Object.assign({}, options, { onProgress: null }));
  }

  _useCachedOrUpdateOrCreateBundle(options) {
    const optionsJson = this.optionsHash(options);
    const bundleFromScratch = () => {
      const building = this.buildBundle(options);
      this._bundles[optionsJson] = building;
      return building;
    };

    if (optionsJson in this._bundles) {
      return this._bundles[optionsJson].then(bundle => {
        const deps = bundleDeps.get(bundle);
        const {dependencyPairs, files, idToIndex, outdated} = deps;
        if (outdated.size) {
          const updateExistingBundleEventId =
            Activity.startEvent(
              'Updating existing bundle',
              {
                outdated_modules: outdated.size,
              },
              {
                telemetric: true,
                displayFields: true,
              },
            );
          debug('Attempt to update existing bundle');
          const changedModules =
            Array.from(outdated, this.getModuleForPath, this);
          deps.outdated = new Set();

          const opts = bundleOpts(options);
          const {platform, dev, minify, hot} = opts;

          // Need to create a resolution response to pass to the bundler
          // to process requires after transform. By providing a
          // specific response we can compute a non recursive one which
          // is the least we need and improve performance.
          const bundlePromise = this._bundles[optionsJson] =
            this.getDependencies({
              platform, dev, hot, minify,
              entryFile: options.entryFile,
              recursive: false,
            }).then(response => {
              debug('Update bundle: rebuild shallow bundle');

              changedModules.forEach(m => {
                response.setResolvedDependencyPairs(
                  m,
                  dependencyPairs.get(m.path),
                  {ignoreFinalized: true},
                );
              });

              return this.buildBundle({
                ...options,
                resolutionResponse: response.copy({
                  dependencies: changedModules,
                }),
              }).then(updateBundle => {
                const oldModules = bundle.getModules();
                const newModules = updateBundle.getModules();
                for (let i = 0, n = newModules.length; i < n; i++) {
                  const moduleTransport = newModules[i];
                  const {meta, sourcePath} = moduleTransport;
                  if (outdated.has(sourcePath)) {
                    if (!contentsEqual(meta.dependencies, new Set(files.get(sourcePath)))) {
                      // bail out if any dependencies changed
                      return Promise.reject(Error(
                        `Dependencies of ${sourcePath} changed from [${
                          files.get(sourcePath).join(', ')
                        }] to [${meta.dependencies.join(', ')}]`
                      ));
                    }

                    oldModules[idToIndex.get(moduleTransport.id)] = moduleTransport;
                  }
                }

                bundle.invalidateSource();
                debug('Successfully updated existing bundle');
                Activity.endEvent(updateExistingBundleEventId);
                return bundle;
            });
          }).catch(e => {
            debug('Failed to update existing bundle, rebuilding...', e.stack || e.message);
            return bundleFromScratch();
          });
          return bundlePromise;
        } else {
          debug('Using cached bundle');
          return bundle;
        }
      });
    }

    return bundleFromScratch();
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

    const options = this._getOptionsFromUrl(req.url);
    const startReqEventId = Activity.startEvent(
      'Requesting bundle',
      {
        url: req.url,
        entry_point: options.entryFile,
      },
      {
        telemetric: true,
        displayFields: ['url'],
      },
    );

    let consoleProgress = () => {};
    if (process.stdout.isTTY && !this._opts.silent) {
      const bar = new ProgressBar('transformed :current/:total (:percent)', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: 1,
      });
      consoleProgress = debouncedTick(bar);
    }

    const mres = MultipartResponse.wrap(req, res);
    options.onProgress = (done, total) => {
      consoleProgress(done, total);
      mres.writeChunk({'Content-Type': 'application/json'}, JSON.stringify({done, total}));
    };

    debug('Getting bundle for request');
    const building = this._useCachedOrUpdateOrCreateBundle(options);
    building.then(
      p => {
        if (requestType === 'bundle') {
          debug('Generating source code');
          const bundleSource = p.getSource({
            inlineSourceMap: options.inlineSourceMap,
            minify: options.minify,
            dev: options.dev,
          });
          debug('Writing response headers');
          const etag = p.getEtag();
          mres.setHeader('Content-Type', 'application/javascript');
          mres.setHeader('ETag', etag);

          if (req.headers['if-none-match'] === etag) {
            debug('Responding with 304');
            mres.writeHead(304);
            mres.end();
          } else {
            mres.end(bundleSource);
          }
          debug('Finished response');
          Activity.endEvent(startReqEventId);
        } else if (requestType === 'map') {
          let sourceMap = p.getSourceMap({
            minify: options.minify,
            dev: options.dev,
          });

          if (typeof sourceMap !== 'string') {
            sourceMap = JSON.stringify(sourceMap);
          }

          mres.setHeader('Content-Type', 'application/json');
          mres.end(sourceMap);
          Activity.endEvent(startReqEventId);
        } else if (requestType === 'assets') {
          const assetsList = JSON.stringify(p.getAssets());
          mres.setHeader('Content-Type', 'application/json');
          mres.end(assetsList);
          Activity.endEvent(startReqEventId);
        }
      },
      error => this._handleError(mres, this.optionsHash(options), error)
    ).catch(error => {
      process.nextTick(() => {
        throw error;
      });
    });
  }

  _symbolicate(req, res) {
    const startReqEventId = Activity.startEvent(
      'Symbolicating',
      null,
      {
        telemetric: true,
      },
    );
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
    const building = this._useCachedOrUpdateOrCreateBundle(options);
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

    const assetPlugin = urlObj.query.assetPlugin;
    const assetPlugins = Array.isArray(assetPlugin) ?
      assetPlugin :
      (typeof assetPlugin === 'string') ? [assetPlugin] : [];

    return {
      sourceMapUrl: url.format(sourceMapUrlObj),
      entryFile: entryFile,
      dev: this._getBoolOptionFromQuery(urlObj.query, 'dev', true),
      minify: this._getBoolOptionFromQuery(urlObj.query, 'minify', false),
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
      generateSourceMaps: this._getBoolOptionFromQuery(urlObj.query, 'babelSourcemap'),
      assetPlugins,
    };
  }

  _getBoolOptionFromQuery(query, opt, defaultVal) {
    if (query[opt] == null) {
      return defaultVal;
    }

    return query[opt] === 'true' || query[opt] === '1';
  }
}

function contentsEqual(array, set) {
  return array.length === set.size && array.every(set.has, set);
}

function debouncedTick(progressBar) {
  let n = 0;
  let start, total;

  return (_, t) => {
    total = t;
    n += 1;
    if (start) {
      if (progressBar.curr + n >= total || Date.now() - start > 200) {
        progressBar.total = total;
        progressBar.tick(n);
        start = n = 0;
      }
    } else {
      start = Date.now();
    }
  };
}

module.exports = Server;

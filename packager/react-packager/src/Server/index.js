/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const AssetServer = require('../AssetServer');
const getPlatformExtension = require('../node-haste').getPlatformExtension;
const Bundler = require('../Bundler');
const MultipartResponse = require('./MultipartResponse');
const SourceMapConsumer = require('source-map').SourceMapConsumer;

const declareOpts = require('../lib/declareOpts');
const defaults = require('../../../defaults');
const mime = require('mime-types');
const path = require('path');
const terminal = require('../lib/terminal');
const url = require('url');

const debug = require('debug')('ReactNativePackager:Server');

import type Module from '../node-haste/Module';
import type {Stats} from 'fs';
import type {IncomingMessage, ServerResponse} from 'http';
import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type Bundle from '../Bundler/Bundle';
import type {Reporter} from '../lib/reporting';

const {
  createActionStartEntry,
  createActionEndEntry,
  log,
} = require('../Logger');

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
  watch: {
    type: 'boolean',
    default: false,
  },
  assetExts: {
    type: 'array',
    default: defaults.assetExts,
  },
  platforms: {
    type: 'array',
    default: defaults.platforms,
  },
  transformTimeoutInterval: {
    type: 'number',
    required: false,
  },
  getTransformOptions: {
    type: 'function',
    required: false,
  },
  silent: {
    type: 'boolean',
    default: false,
  },
  reporter: {
    type: 'object',
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

  _opts: {
    projectRoots: Array<string>,
    watch: boolean,
  };
  _projectRoots: Array<string>;
  _bundles: {};
  _changeWatchers: Array<{
    req: IncomingMessage,
    res: ServerResponse,
  }>;
  _fileChangeListeners: Array<(filePath: string) => mixed>;
  _assetServer: AssetServer;
  _bundler: Bundler;
  _debouncedFileChangeHandler: (filePath: string) => mixed;
  _hmrFileChangeListener: (type: string, filePath: string) => mixed;
  _reporter: Reporter;

  constructor(options: {
    reporter: Reporter,
    watch?: boolean,
  }) {
    const opts = this._opts = validateOpts(options);
    const processFileChange =
      ({type, filePath, stat}) => this.onFileChange(type, filePath, stat);

    this._reporter = options.reporter;
    this._projectRoots = opts.projectRoots;
    this._bundles = Object.create(null);
    this._changeWatchers = [];
    this._fileChangeListeners = [];

    this._assetServer = new AssetServer({
      assetExts: opts.assetExts,
      projectRoots: opts.projectRoots,
    });

    const bundlerOpts = Object.create(opts);
    bundlerOpts.assetServer = this._assetServer;
    bundlerOpts.allowBundleUpdates = options.watch;
    bundlerOpts.watch = options.watch;
    bundlerOpts.reporter = options.reporter;
    this._bundler = new Bundler(bundlerOpts);

    // changes to the haste map can affect resolution of files in the bundle
    const dependencyGraph = this._bundler.getResolver().getDependencyGraph();
    dependencyGraph.load().then(() => {
      dependencyGraph.getWatcher().on(
        'change',
        ({eventsQueue}) => eventsQueue.forEach(processFileChange),
      );
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
              // $FlowFixMe(>=0.37.0)
              if (deps.files.has(filePath)) {
                // $FlowFixMe(>=0.37.0)
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

  end(): mixed {
    return this._bundler.end();
  }

  setHMRFileChangeListener(
    listener: (type: string, filePath: string) => mixed,
  ) {
    this._hmrFileChangeListener = listener;
  }

  addFileChangeListener(listener: (filePath: string) => mixed) {
    if (this._fileChangeListeners.indexOf(listener) === -1) {
      this._fileChangeListeners.push(listener);
    }
  }

  buildBundle(options: {
    entryFile: string,
    platform?: string,
  }): Promise<Bundle> {
    return this._bundler.getResolver().getDependencyGraph().load().then(() => {
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

  buildBundleFromUrl(reqUrl: string): Promise<mixed> {
    const options = this._getOptionsFromUrl(reqUrl);
    return this.buildBundle(options);
  }

  buildBundleForHMR(
    options: {platform: ?string},
    host: string,
    port: number,
  ): Promise<string> {
    return this._bundler.hmrBundle(options, host, port);
  }

  getShallowDependencies(options: {
    entryFile: string,
    platform?: string,
  }): Promise<mixed> {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = dependencyOpts(options);
      return this._bundler.getShallowDependencies(opts);
    });
  }

  getModuleForPath(entryFile: string): Module {
    return this._bundler.getModuleForPath(entryFile);
  }

  getDependencies(options: {
    entryFile: string,
    platform?: string,
  }): Promise<ResolutionResponse> {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = dependencyOpts(options);
      return this._bundler.getDependencies(opts);
    });
  }

  getOrderedDependencyPaths(options: {}): Promise<mixed> {
    return Promise.resolve().then(() => {
      const opts = dependencyOpts(options);
      return this._bundler.getOrderedDependencyPaths(opts);
    });
  }

  onFileChange(type: string, filePath: string, stat: Stats) {
    this._assetServer.onFileChange(type, filePath, stat);
    this._bundler.invalidateFile(filePath);

    // If Hot Loading is enabled avoid rebuilding bundles and sending live
    // updates. Instead, send the HMR updates right away and clear the bundles
    // cache so that if the user reloads we send them a fresh bundle
    if (this._hmrFileChangeListener) {
      // Clear cached bundles in case user reloads
      this._clearBundles();
      this._hmrFileChangeListener(type, filePath);
      return;
    } else if (type !== 'change' && filePath.indexOf(NODE_MODULES) !== -1) {
      // node module resolution can be affected by added or removed files
      debug('Clearing bundles due to potential node_modules resolution change');
      this._clearBundles();
    }

    Promise.all(
      this._fileChangeListeners.map(listener => listener(filePath))
    ).then(
      () => this._onFileChangeComplete(filePath),
      () => this._onFileChangeComplete(filePath)
    );
  }

  _onFileChangeComplete(filePath: string) {
    // Make sure the file watcher event runs through the system before
    // we rebuild the bundles.
    this._debouncedFileChangeHandler(filePath);
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

  _processDebugRequest(reqUrl: string, res: ServerResponse) {
    let ret = '<!doctype html>';
    const pathname = url.parse(reqUrl).pathname;
    /* $FlowFixMe: pathname would be null for an invalid URL */
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
          terminal.log(e.stack); // eslint-disable-line no-console-disallow
        }
      );
    } else {
      res.writeHead(404);
      res.end('Invalid debug request');
      return;
    }
  }

  _processOnChangeRequest(req: IncomingMessage, res: ServerResponse) {
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

  _rangeRequestMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    data: string,
    assetPath: string,
  ) {
    if (req.headers && req.headers.range) {
      const [rangeStart, rangeEnd] = req.headers.range.replace(/bytes=/, '').split('-');
      const dataStart = parseInt(rangeStart, 10);
      const dataEnd = rangeEnd ? parseInt(rangeEnd, 10) : data.length - 1;
      const chunksize = (dataEnd - dataStart) + 1;

      res.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Range': `bytes ${dataStart}-${dataEnd}/${data.length}`,
        'Content-Type': mime.lookup(path.basename(assetPath[1])),
      });

      return data.slice(dataStart, dataEnd + 1);
    }

    return data;
  }

  _processAssetsRequest(req: IncomingMessage, res: ServerResponse) {
    const urlObj = url.parse(decodeURI(req.url), true);
    /* $FlowFixMe: could be empty if the url is invalid */
    const assetPath: string = urlObj.pathname.match(/^\/assets\/(.+)$/);

    const processingAssetRequestLogEntry =
      log(createActionStartEntry({
        action_name: 'Processing asset request',
        asset: assetPath[1],
      }));

    /* $FlowFixMe: query may be empty for invalid URLs */
    this._assetServer.get(assetPath[1], urlObj.query.platform)
      .then(
        data => {
          // Tell clients to cache this for 1 year.
          // This is safe as the asset url contains a hash of the asset.
          if (process.env.REACT_NATIVE_ENABLE_ASSET_CACHING === true) {
            res.setHeader('Cache-Control', 'max-age=31536000');
          }
          res.end(this._rangeRequestMiddleware(req, res, data, assetPath));
          process.nextTick(() => {
            log(createActionEndEntry(processingAssetRequestLogEntry));
          });
        },
        error => {
          console.error(error.stack);
          res.writeHead(404);
          res.end('Asset not found');
        }
      );
  }

  optionsHash(options: {}) {
    // onProgress is a function, can't be serialized
    return JSON.stringify(Object.assign({}, options, { onProgress: null }));
  }

  _useCachedOrUpdateOrCreateBundle(options: {
    entryFile: string,
    platform?: string,
  }): Promise<Bundle> {
    const optionsJson = this.optionsHash(options);
    const bundleFromScratch = () => {
      const building = this.buildBundle(options);
      this._bundles[optionsJson] = building;
      return building;
    };

    if (optionsJson in this._bundles) {
      return this._bundles[optionsJson].then(bundle => {
        const deps = bundleDeps.get(bundle);
        // $FlowFixMe(>=0.37.0)
        const {dependencyPairs, files, idToIndex, outdated} = deps;
        if (outdated.size) {

          const updatingExistingBundleLogEntry =
            log(createActionStartEntry({
              action_name: 'Updating existing bundle',
              outdated_modules: outdated.size,
            }));
          this._reporter.update({
            type: 'bundle_update_existing',
            entryFilePath: options.entryFile,
            outdatedModuleCount: outdated.size,
          });

          debug('Attempt to update existing bundle');

          const changedModules =
            Array.from(outdated, this.getModuleForPath, this);
          // $FlowFixMe(>=0.37.0)
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
                    /* $FlowFixMe: `meta` could be empty */
                    if (!contentsEqual(meta.dependencies, new Set(files.get(sourcePath)))) {
                      // bail out if any dependencies changed
                      return Promise.reject(Error(
                        `Dependencies of ${sourcePath} changed from [${
                          /* $FlowFixMe: `get` can return empty */
                          files.get(sourcePath).join(', ')
                        }] to [${
                          /* $FlowFixMe: `meta` could be empty */
                          meta.dependencies.join(', ')
                        }]`
                      ));
                    }

                    oldModules[idToIndex.get(moduleTransport.id)] = moduleTransport;
                  }
                }

                bundle.invalidateSource();

                log(createActionEndEntry(updatingExistingBundleLogEntry));

                debug('Successfully updated existing bundle');
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

  processRequest(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => mixed,
  ) {
    const urlObj = url.parse(req.url, true);
    /* $FlowFixMe: Could be empty if the URL is invalid. */
    const pathname: string = urlObj.pathname;

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
    this._reporter.update({
      type: 'bundle_requested',
      entryFilePath: options.entryFile,
    });
    const requestingBundleLogEntry =
      log(createActionStartEntry({
        action_name: 'Requesting bundle',
        bundle_url: req.url,
        entry_point: options.entryFile,
      }));

    let reportProgress = () => {};
    if (!this._opts.silent) {
      reportProgress = (transformedFileCount, totalFileCount) => {
        this._reporter.update({
          type: 'bundle_transform_progressed',
          entryFilePath: options.entryFile,
          transformedFileCount,
          totalFileCount,
        });
      };
    }

    const mres = MultipartResponse.wrap(req, res);
    options.onProgress = (done, total) => {
      reportProgress(done, total);
      mres.writeChunk({'Content-Type': 'application/json'}, JSON.stringify({done, total}));
    };

    debug('Getting bundle for request');
    const building = this._useCachedOrUpdateOrCreateBundle(options);
    building.then(
      p => {
        this._reporter.update({
          type: 'bundle_built',
          entryFilePath: options.entryFile,
        });
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
          log(createActionEndEntry(requestingBundleLogEntry));
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
          log(createActionEndEntry(requestingBundleLogEntry));
        } else if (requestType === 'assets') {
          const assetsList = JSON.stringify(p.getAssets());
          mres.setHeader('Content-Type', 'application/json');
          mres.end(assetsList);
          log(createActionEndEntry(requestingBundleLogEntry));
        }
      },
      error => this._handleError(mres, this.optionsHash(options), error)
    ).catch(error => {
      process.nextTick(() => {
        throw error;
      });
    });
  }

  _symbolicate(req: IncomingMessage, res: ServerResponse) {
    const symbolicatingLogEntry =
      log(createActionStartEntry('Symbolicating'));

    /* $FlowFixMe: where is `rowBody` defined? Is it added by
     * the `connect` framework? */
    Promise.resolve(req.rawBody).then(body => {
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
      stack => {
        res.end(JSON.stringify({stack: stack}));
        process.nextTick(() => {
          log(createActionEndEntry(symbolicatingLogEntry));
        });
      },
      error => {
        console.error(error.stack || error);
        res.statusCode = 500;
        res.end(JSON.stringify({error: error.message}));
      }
    );
  }

  _sourceMapForURL(reqUrl: string): Promise<SourceMapConsumer> {
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

  _handleError(res: ServerResponse, bundleID: string, error: {
    status: number,
    type: string,
    description: string,
    filename: string,
    lineNumber: number,
    errors: Array<{description: string, filename: string, lineNumber: number}>,
  }) {
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

  _getOptionsFromUrl(reqUrl: string): {
    sourceMapUrl: string,
    entryFile: string,
    dev: boolean,
    minify: boolean,
    hot: boolean,
    runModule: boolean,
    inlineSourceMap: boolean,
    platform?: string,
    entryModuleOnly: boolean,
    generateSourceMaps: boolean,
    assetPlugins: Array<string>,
    onProgress?: (doneCont: number, totalCount: number) => mixed,
  } {
    // `true` to parse the query param as an object.
    const urlObj = url.parse(reqUrl, true);
    /* $FlowFixMe: `pathname` could be empty for an invalid URL */
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
    /* $FlowFixMe: `query` could be empty for an invalid URL */
    const platform = urlObj.query.platform ||
      getPlatformExtension(pathname);

    /* $FlowFixMe: `query` could be empty for an invalid URL */
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
      /* $FlowFixMe: missing defaultVal */
      generateSourceMaps: this._getBoolOptionFromQuery(urlObj.query, 'babelSourcemap'),
      assetPlugins,
    };
  }

  _getBoolOptionFromQuery(query: ?{}, opt: string, defaultVal: boolean): boolean {
    /* $FlowFixMe: `query` could be empty when it comes from an invalid URL */
    if (query[opt] == null) {
      return defaultVal;
    }

    return query[opt] === 'true' || query[opt] === '1';
  }
}

function contentsEqual(array: Array<mixed>, set: Set<mixed>): boolean {
  return array.length === set.size && array.every(set.has, set);
}

module.exports = Server;

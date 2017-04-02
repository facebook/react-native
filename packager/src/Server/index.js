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

const declareOpts = require('../lib/declareOpts');
const defaults = require('../../defaults');
const mime = require('mime-types');
const path = require('path');
const symbolicate = require('./symbolicate');
const terminal = require('../lib/terminal');
const url = require('url');

const debug = require('debug')('RNP:Server');

import type Module, {HasteImpl} from '../node-haste/Module';
import type {Stats} from 'fs';
import type {IncomingMessage, ServerResponse} from 'http';
import type ResolutionResponse from '../node-haste/DependencyGraph/ResolutionResponse';
import type Bundle from '../Bundler/Bundle';
import type HMRBundle from '../Bundler/HMRBundle';
import type {Reporter} from '../lib/reporting';
import type {GetTransformOptions} from '../Bundler';
import type GlobalTransformCache from '../lib/GlobalTransformCache';
import type {SourceMap, Symbolicate} from './symbolicate';

const {
  createActionStartEntry,
  createActionEndEntry,
  log,
} = require('../Logger');

function debounceAndBatch(fn, delay) {
  let args = [];
  let timeout;
  return value => {
    args.push(value);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const a = args;
      args = [];
      fn(a);
    }, delay);
  };
}

type Options = {
  assetExts?: Array<string>,
  blacklistRE?: RegExp,
  cacheVersion?: string,
  extraNodeModules?: {},
  getTransformOptions?: GetTransformOptions,
  globalTransformCache: ?GlobalTransformCache,
  hasteImpl?: HasteImpl,
  moduleFormat?: string,
  platforms?: Array<string>,
  polyfillModuleNames?: Array<string>,
  projectRoots: Array<string>,
  providesModuleNodeModules?: Array<string>,
  reporter: Reporter,
  resetCache?: boolean,
  silent?: boolean,
  transformModulePath?: string,
  transformTimeoutInterval?: number,
  watch?: boolean,
};

export type BundleOptions = {
  +assetPlugins: Array<string>,
  dev: boolean,
  entryFile: string,
  +entryModuleOnly: boolean,
  +generateSourceMaps: boolean,
  +hot: boolean,
  +inlineSourceMap: boolean,
  +isolateModuleIDs: boolean,
  minify: boolean,
  onProgress: ?(doneCont: number, totalCount: number) => mixed,
  +platform: ?string,
  +resolutionResponse: ?{},
  +runBeforeMainModule: Array<string>,
  +runModule: boolean,
  sourceMapUrl: ?string,
  unbundle: boolean,
};

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
    assetExts: Array<string>,
    blacklistRE: void | RegExp,
    cacheVersion: string,
    extraNodeModules: {},
    getTransformOptions?: GetTransformOptions,
    hasteImpl?: HasteImpl,
    moduleFormat: string,
    platforms: Array<string>,
    polyfillModuleNames: Array<string>,
    projectRoots: Array<string>,
    providesModuleNodeModules?: Array<string>,
    reporter: Reporter,
    resetCache: boolean,
    silent: boolean,
    transformModulePath: void | string,
    transformTimeoutInterval: ?number,
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
  _hmrFileChangeListener: ?(type: string, filePath: string) => mixed;
  _reporter: Reporter;
  _symbolicateInWorker: Symbolicate;

  constructor(options: Options) {
    this._opts = {
      assetExts: options.assetExts || defaults.assetExts,
      blacklistRE: options.blacklistRE,
      cacheVersion: options.cacheVersion || '1.0',
      extraNodeModules: options.extraNodeModules || {},
      getTransformOptions: options.getTransformOptions,
      globalTransformCache: options.globalTransformCache,
      hasteImpl: options.hasteImpl,
      moduleFormat: options.moduleFormat != null ? options.moduleFormat : 'haste',
      platforms: options.platforms || defaults.platforms,
      polyfillModuleNames: options.polyfillModuleNames || [],
      projectRoots: options.projectRoots,
      providesModuleNodeModules: options.providesModuleNodeModules,
      reporter: options.reporter,
      resetCache: options.resetCache || false,
      silent: options.silent || false,
      transformModulePath: options.transformModulePath,
      transformTimeoutInterval: options.transformTimeoutInterval,
      watch: options.watch || false,
    };
    const processFileChange =
      ({type, filePath, stat}) => this.onFileChange(type, filePath, stat);

    this._reporter = options.reporter;
    this._projectRoots = this._opts.projectRoots;
    this._bundles = Object.create(null);
    this._changeWatchers = [];
    this._fileChangeListeners = [];

    this._assetServer = new AssetServer({
      assetExts: this._opts.assetExts,
      projectRoots: this._opts.projectRoots,
    });

    const bundlerOpts = Object.create(this._opts);
    bundlerOpts.assetServer = this._assetServer;
    bundlerOpts.allowBundleUpdates = this._opts.watch;
    bundlerOpts.globalTransformCache = options.globalTransformCache;
    bundlerOpts.watch = this._opts.watch;
    bundlerOpts.reporter = options.reporter;
    this._bundler = new Bundler(bundlerOpts);

    // changes to the haste map can affect resolution of files in the bundle
    this._bundler.getResolver().then(resolver => {
      resolver.getDependencyGraph().getWatcher().on(
        'change',
        ({eventsQueue}) => eventsQueue.forEach(processFileChange),
      );
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

    this._symbolicateInWorker = symbolicate.createWorker();
  }

  end(): mixed {
    return this._bundler.end();
  }

  setHMRFileChangeListener(listener: ?(type: string, filePath: string) => mixed) {
    this._hmrFileChangeListener = listener;
  }

  addFileChangeListener(listener: (filePath: string) => mixed) {
    if (this._fileChangeListeners.indexOf(listener) === -1) {
      this._fileChangeListeners.push(listener);
    }
  }

  async buildBundle(options: BundleOptions): Promise<Bundle> {
    const bundle = await this._bundler.bundle(options);
    const modules = bundle.getModules();
    const nonVirtual = modules.filter(m => !m.virtual);
    bundleDeps.set(bundle, {
      files: new Map(nonVirtual.map(({sourcePath, meta}) =>
        [sourcePath, meta != null ? meta.dependencies : []],
      )),
      idToIndex: new Map(modules.map(({id}, i) => [id, i])),
      dependencyPairs: new Map(
        nonVirtual
          .filter(({meta}) => meta && meta.dependencyPairs)
          /* $FlowFixMe: the filter above ensures `dependencyPairs` is not null. */
          .map(m => [m.sourcePath, m.meta.dependencyPairs])
      ),
      outdated: new Set(),
    });
    return bundle;
  }

  buildBundleFromUrl(reqUrl: string): Promise<Bundle> {
    const options = this._getOptionsFromUrl(reqUrl);
    return this.buildBundle(options);
  }

  buildBundleForHMR(
    options: {platform: ?string},
    host: string,
    port: number,
  ): Promise<HMRBundle> {
    return this._bundler.hmrBundle(options, host, port);
  }

  getShallowDependencies(options: {
    entryFile: string,
    platform?: string,
  }): Promise<Array<Module>> {
    return Promise.resolve().then(() => {
      if (!options.platform) {
        options.platform = getPlatformExtension(options.entryFile);
      }

      const opts = dependencyOpts(options);
      return this._bundler.getShallowDependencies(opts);
    });
  }

  getModuleForPath(entryFile: string): Promise<Module> {
    return this._bundler.getModuleForPath(entryFile);
  }

  getDependencies(options: {
    entryFile: string,
    platform: ?string,
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
    const {_hmrFileChangeListener} = this;
    if (_hmrFileChangeListener) {
      // Clear cached bundles in case user reloads
      this._clearBundles();
      _hmrFileChangeListener(type, filePath);
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
      w.res.end(JSON.stringify({changed: true}));
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
      req,
      res,
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
    return JSON.stringify(Object.assign({}, options, {onProgress: null}));
  }

  /**
   * Ensure we properly report the promise of a build that's happening,
   * including failed builds. We use that separately for when we update a bundle
   * and for when we build for scratch.
   */
  _reportBundlePromise(
    options: {entryFile: string},
    bundlePromise: Promise<Bundle>,
  ): Promise<Bundle> {
    this._reporter.update({
      entryFilePath: options.entryFile,
      type: 'bundle_build_started',
    });
    return bundlePromise.then(bundle => {
      this._reporter.update({
        entryFilePath: options.entryFile,
        type: 'bundle_build_done',
      });
      return bundle;
    }, error => {
      this._reporter.update({
        entryFilePath: options.entryFile,
        error,
        type: 'bundle_build_failed',
      });
      return Promise.reject(error);
    });
  }

  useCachedOrUpdateOrCreateBundle(options: BundleOptions): Promise<Bundle> {
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

          debug('Attempt to update existing bundle');

          // $FlowFixMe(>=0.37.0)
          deps.outdated = new Set();

          const {platform, dev, minify, hot} = options;

          // Need to create a resolution response to pass to the bundler
          // to process requires after transform. By providing a
          // specific response we can compute a non recursive one which
          // is the least we need and improve performance.
          const bundlePromise = this._bundles[optionsJson] =
            Promise.all([
              this.getDependencies({
                platform, dev, hot, minify,
                entryFile: options.entryFile,
                recursive: false,
              }),
              Promise.all(Array.from(outdated, this.getModuleForPath, this)),
            ]).then(([response, changedModules]) => {
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
          return this._reportBundlePromise(options, bundlePromise);
        } else {
          debug('Using cached bundle');
          return bundle;
        }
      });
    }

    return this._reportBundlePromise(options, bundleFromScratch());
  }

  processRequest(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => mixed,
  ) {
    const urlObj = url.parse(req.url, true);
    const {host} = req.headers;
    debug(`Handling request: ${host ? 'http://' + host : ''}${req.url}`);
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
    const building = this.useCachedOrUpdateOrCreateBundle(options);
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
          log(createActionEndEntry(requestingBundleLogEntry));
        } else if (requestType === 'map') {
          const sourceMap = p.getSourceMapString({
            minify: options.minify,
            dev: options.dev,
          });

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

    debug('Start symbolication');

    /* $FlowFixMe: where is `rowBody` defined? Is it added by
     * the `connect` framework? */
    Promise.resolve(req.rawBody).then(body => {
      const stack = JSON.parse(body).stack;

      // In case of multiple bundles / HMR, some stack frames can have
      // different URLs from others
      const urls = new Set();
      stack.forEach(frame => {
        const sourceUrl = frame.file;
        // Skip `/debuggerWorker.js` which drives remote debugging because it
        // does not need to symbolication.
        // Skip anything except http(s), because there is no support for that yet
        if (!urls.has(sourceUrl) &&
            !sourceUrl.endsWith('/debuggerWorker.js') &&
            sourceUrl.startsWith('http')) {
          urls.add(sourceUrl);
        }
      });

      const mapPromises =
        Array.from(urls.values()).map(this._sourceMapForURL, this);

      debug('Getting source maps for symbolication');
      return Promise.all(mapPromises).then(maps => {
        debug('Sending stacks and maps to symbolication worker');
        const urlsToMaps = zip(urls.values(), maps);
        return this._symbolicateInWorker(stack, urlsToMaps);
      });
    }).then(
      stack => {
        debug('Symbolication done');
        res.end(JSON.stringify({stack}));
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

  _sourceMapForURL(reqUrl: string): Promise<SourceMap> {
    const options = this._getOptionsFromUrl(reqUrl);
    const building = this.useCachedOrUpdateOrCreateBundle(options);
    return building.then(p => p.getSourceMap({
      minify: options.minify,
      dev: options.dev,
    }));
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

  _getOptionsFromUrl(reqUrl: string): BundleOptions {
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

    // try to get the platform from the url
    /* $FlowFixMe: `query` could be empty for an invalid URL */
    const platform = urlObj.query.platform ||
      getPlatformExtension(pathname);

    /* $FlowFixMe: `query` could be empty for an invalid URL */
    const assetPlugin = urlObj.query.assetPlugin;
    const assetPlugins = Array.isArray(assetPlugin) ?
      assetPlugin :
      (typeof assetPlugin === 'string') ? [assetPlugin] : [];

    const dev = this._getBoolOptionFromQuery(urlObj.query, 'dev', true);
    const minify = this._getBoolOptionFromQuery(urlObj.query, 'minify', false);
    return {
      sourceMapUrl: url.format({
        hash: urlObj.hash,
        pathname: pathname.replace(/\.bundle$/, '.map'),
        query: urlObj.query,
        search: urlObj.search,
      }),
      entryFile,
      dev,
      minify,
      hot: this._getBoolOptionFromQuery(urlObj.query, 'hot', false),
      runBeforeMainModule: defaults.runBeforeMainModule,
      runModule: this._getBoolOptionFromQuery(urlObj.query, 'runModule', true),
      inlineSourceMap: this._getBoolOptionFromQuery(
        urlObj.query,
        'inlineSourceMap',
        false
      ),
      isolateModuleIDs: false,
      platform,
      resolutionResponse: null,
      entryModuleOnly: this._getBoolOptionFromQuery(
        urlObj.query,
        'entryModuleOnly',
        false,
      ),
      generateSourceMaps:
        minify || !dev || this._getBoolOptionFromQuery(urlObj.query, 'babelSourcemap', false),
      assetPlugins,
      onProgress: null,
      unbundle: false,
    };
  }

  _getBoolOptionFromQuery(query: ?{}, opt: string, defaultVal: boolean): boolean {
    /* $FlowFixMe: `query` could be empty when it comes from an invalid URL */
    if (query[opt] == null) {
      return defaultVal;
    }

    return query[opt] === 'true' || query[opt] === '1';
  }

  static DEFAULT_BUNDLE_OPTIONS;

}

Server.DEFAULT_BUNDLE_OPTIONS =  {
  assetPlugins: [],
  dev: true,
  entryModuleOnly: false,
  generateSourceMaps: false,
  hot: false,
  inlineSourceMap: false,
  isolateModuleIDs: false,
  minify: false,
  onProgress: null,
  resolutionResponse: null,
  runBeforeMainModule: defaults.runBeforeMainModule,
  runModule: true,
  sourceMapUrl: null,
  unbundle: false,
};

function contentsEqual<T>(array: Array<T>, set: Set<T>): boolean {
  return array.length === set.size && array.every(set.has, set);
}

function* zip<X, Y>(xs: Iterable<X>, ys: Iterable<Y>): Iterable<[X, Y]> {
  //$FlowIssue #9324959
  const ysIter: Iterator<Y> = ys[Symbol.iterator]();
  for (const x of xs) {
    const y = ysIter.next();
    if (y.done) {
      return;
    }
    yield [x, y.value];
  }
}

module.exports = Server;

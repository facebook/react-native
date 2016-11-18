/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
 'use strict';

const time = require('./time');

class Client {
  constructor ({
    ws,
    platform,
    bundleEntry,
    dependenciesCache,
    dependenciesModulesCache,
    shallowDependencies,
    inverseDependenciesCache,
    onDisconnect,
  }) {
      this.platform = platform;
      this.ws = ws;
      this.bundleEntry = bundleEntry;
      this.dependenciesCache = dependenciesCache;
      this.dependenciesModulesCache = dependenciesModulesCache;
      this.shallowDependencies = shallowDependencies;
      this.inverseDependenciesCache = shallowDependencies;
      this.isConnected = true;
      this.ws.on('close', this.disconnect);
      this.ws.on('error', this.error);
  }
  send(message) {
    if (this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }
  error(error) {
      console.error('[Hot Module Replacement] Unexpected error', error);
      this.disconnect();
      if (this.onError) {
        this.onError(this);
      }
  }
  disconnect() {
    this.isConnected = false;
    if (this.onDisconnect) {
      this.onDisconnect(this);
    }
  }
  receiveUpdate(filename, packagerServer, httpServer, getDependencies) {

      return packagerServer.getShallowDependencies({
        entryFile: filename,
        platform: this.platform,
        dev: true,
        hot: true,
      })
        .then(deps => {
          if (!this.isConnected) {
            return [];
          }

          // if the file dependencies have change we need to invalidate the
          // dependencies caches because the list of files we need to send
          // to the client may have changed
          const oldDependencies = this.shallowDependencies[filename];
          if (arrayEquals(deps, oldDependencies)) {
            // Need to create a resolution response to pass to the bundler
            // to process requires after transform. By providing a
            // specific response we can compute a non recursive one which
            // is the least we need and improve performance.
            return packagerServer.getDependencies({
              platform: this.platform,
              dev: true,
              hot: true,
              entryFile: filename,
              recursive: true,
            }).then(response => {
              const module = packagerServer.getModuleForPath(filename);

              return response.copy({dependencies: [module]});
            });
          }

          // if there're new dependencies compare the full list of
          // dependencies we used to have with the one we now have
          return getDependencies(this.platform, this.bundleEntry)
            .then(({
              dependenciesCache: depsCache,
              dependenciesModulesCache: depsModulesCache,
              shallowDependencies: shallowDeps,
              inverseDependenciesCache: inverseDepsCache,
              resolutionResponse,
            }) => {
              if (!this.isConnected) {
                return {};
              }

              // build list of modules for which we'll send HMR updates
              const modulesToUpdate = [packagerServer.getModuleForPath(filename)];
              Object.keys(depsModulesCache).forEach(module => {
                if (!this.dependenciesModulesCache[module]) {
                  modulesToUpdate.push(depsModulesCache[module]);
                }
              });

              // Need to send modules to the client in an order it can
              // process them: if a new dependency graph was uncovered
              // because a new dependency was added, the file that was
              // changed, which is the root of the dependency tree that
              // will be sent, needs to be the last module that gets
              // processed. Reversing the new modules makes sense
              // because we get them through the resolver which returns
              // a BFS ordered list.
              modulesToUpdate.reverse();

              // invalidate caches
              this.dependenciesCache = depsCache;
              this.dependenciesModulesCache = depsModulesCache;
              this.shallowDependencies = shallowDeps;
              this.inverseDependenciesCache = inverseDepsCache;

              return resolutionResponse.copy({
                dependencies: modulesToUpdate
              });
            });
        })
        .then((resolutionResponse) => {
          if (!this.isConnected) {
            return;
          }

          // make sure the file was modified is part of the bundle
          if (!this.shallowDependencies[filename]) {
            return;
          }

          const httpServerAddress = httpServer.address();

          // Sanitize the value from the HTTP server
          let packagerHost = 'localhost';
          if (httpServer.address().address &&
              httpServer.address().address !== '::' &&
              httpServer.address().address !== '') {
            packagerHost = httpServerAddress.address;
          }

          return packagerServer.buildBundleForHMR({
            entryFile: this.bundleEntry,
            platform: this.platform,
            resolutionResponse,
          }, packagerHost, httpServerAddress.port);
        })
        .then(bundle => {
          if (!this.isConnected || !bundle || bundle.isEmpty()) {
            return;
          }

          return {
            type: 'update',
            body: {
              modules: bundle.getModulesIdsAndCode(),
              inverseDependencies: this.inverseDependenciesCache,
              sourceURLs: bundle.getSourceURLs(),
              sourceMappingURLs: bundle.getSourceMappingURLs(),
            },
          };
        })
        .catch(error => {
          // send errors to the client instead of killing packager server
          let body;
          if (error.type === 'TransformError' ||
              error.type === 'NotFoundError' ||
              error.type === 'UnableToResolveError') {
            body = {
              type: error.type,
              description: error.description,
              filename: error.filename,
              lineNumber: error.lineNumber,
            };
          } else {
            console.error(error.stack || error);
            body = {
              type: 'InternalError',
              description: 'react-packager has encountered an internal error, ' +
                'please check your terminal error output for more details',
            };
          }

          return {type: 'error', body};
        })
        .then(update => {
          if (!this.isConnected || !update) {
            return;
          }

          console.log(
            '[Hot Module Replacement] Sending HMR update to client (' +
            time() + ')'
          );
          this.send(update);
        });
      }
  }

function arrayEquals(arrayA, arrayB) {
  arrayA = arrayA || [];
  arrayB = arrayB || [];
  return (
    arrayA.length === arrayB.length &&
    arrayA.every((element, index) => {
      return element === arrayB[index];
    })
  );
}

module.exports = Client;

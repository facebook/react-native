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

const querystring = require('querystring');
const url = require('url');

const {getInverseDependencies} = require('../../../packager/src//node-haste');

import type HMRBundle from '../../../packager/src/Bundler/HMRBundle';
import type Server from '../../../packager/src/Server';
import type ResolutionResponse
  from '../../../packager/src/node-haste/DependencyGraph/ResolutionResponse';
import type Module from '../../../packager/src/node-haste/Module';
import type {Server as HTTPServer} from 'http';

const blacklist = [
  'Libraries/Utilities/HMRClient.js',
];

type HMROptions = {
  httpServer: HTTPServer,
  path: string,
  packagerServer: Server,
};

/**
 * Attaches a WebSocket based connection to the Packager to expose
 * Hot Module Replacement updates to the simulator.
 */
function attachHMRServer({httpServer, path, packagerServer}: HMROptions) {
  let client = null;

  function disconnect() {
    client = null;
    packagerServer.setHMRFileChangeListener(null);
  }

  // For the give platform and entry file, returns a promise with:
  //   - The full list of dependencies.
  //   - The shallow dependencies each file on the dependency list has
  //   - Inverse shallow dependencies map
  function getDependencies(platform: string, bundleEntry: string): Promise<{
    dependenciesCache: Array<string>,
    dependenciesModulesCache: {[mixed]: Module},
    shallowDependencies: {[string]: Array<Module>},
    inverseDependenciesCache: mixed,
    resolutionResponse: ResolutionResponse<Module>,
  }> {
    return packagerServer.getDependencies({
      platform: platform,
      dev: true,
      hot: true,
      entryFile: bundleEntry,
    }).then(response => {
      /* $FlowFixMe: getModuleId might be null */
      const {getModuleId}: {getModuleId: () => number} = response;

      // for each dependency builds the object:
      // `{path: '/a/b/c.js', deps: ['modA', 'modB', ...]}`
      return Promise.all(response.dependencies.map((dep: Module) => {
        return dep.getName().then(depName => {
          if (dep.isAsset() || dep.isJSON()) {
            return Promise.resolve({path: dep.path, deps: []});
          }
          return packagerServer.getShallowDependencies({
            platform: platform,
            dev: true,
            hot: true,
            entryFile: dep.path
          }).then(deps => {
            return {
              path: dep.path,
              name: depName,
              deps,
            };
          });
        });
      }))
      .then((deps: Array<{path: string, name?: string, deps: Array<Module>}>) => {
        // list with all the dependencies' filenames the bundle entry has
        const dependenciesCache = response.dependencies.map(dep => dep.path);

        // map from module name to path
        const moduleToFilenameCache = Object.create(null);
        deps.forEach(dep => {
          /* $FlowFixMe: `name` could be null, but `deps` would be as well. */
          moduleToFilenameCache[dep.name] = dep.path;
        });

        // map that indicates the shallow dependency each file included on the
        // bundle has
        const shallowDependencies = Object.create(null);
        deps.forEach(dep => {
          shallowDependencies[dep.path] = dep.deps;
        });

        // map from module name to the modules' dependencies the bundle entry
        // has
        const dependenciesModulesCache = Object.create(null);
        response.dependencies.forEach(dep => {
          dependenciesModulesCache[getModuleId(dep)] = dep;
        });


        const inverseDependenciesCache = Object.create(null);
        const inverseDependencies = getInverseDependencies(response);
        for (const [module, dependents] of inverseDependencies) {
          inverseDependenciesCache[getModuleId(module)] =
            Array.from(dependents).map(getModuleId);
        }

        return {
          dependenciesCache,
          dependenciesModulesCache,
          shallowDependencies,
          inverseDependenciesCache,
          resolutionResponse: response,
        };
      });
    });
  }

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({
    server: httpServer,
    path: path,
  });

  wss.on('connection', ws => {
    /* $FlowFixMe: url might be null */
    const params = querystring.parse(url.parse(ws.upgradeReq.url).query);

    getDependencies(params.platform, params.bundleEntry)
      .then(({
        dependenciesCache,
        dependenciesModulesCache,
        shallowDependencies,
        inverseDependenciesCache,
      }) => {
        client = {
          ws,
          platform: params.platform,
          bundleEntry: params.bundleEntry,
          dependenciesCache,
          dependenciesModulesCache,
          shallowDependencies,
          inverseDependenciesCache,
        };

        packagerServer.setHMRFileChangeListener((type, filename) => {
          if (!client) {
            return;
          }

          const blacklisted = blacklist.find(blacklistedPath =>
            filename.indexOf(blacklistedPath) !== -1
          );

          if (blacklisted) {
            return;
          }

          client.ws.send(JSON.stringify({type: 'update-start'}));
          const promise = type === 'delete'
            ? Promise.resolve()
            : packagerServer.getShallowDependencies({
                entryFile: filename,
                platform: client.platform,
                dev: true,
                hot: true,
              }).then(deps => {
                if (!client) {
                  return [];
                }

                // if the file dependencies have change we need to invalidate the
                // dependencies caches because the list of files we need to send
                // to the client may have changed
                const oldDependencies = client.shallowDependencies[filename];
                if (arrayEquals(deps, oldDependencies)) {
                  // Need to create a resolution response to pass to the bundler
                  // to process requires after transform. By providing a
                  // specific response we can compute a non recursive one which
                  // is the least we need and improve performance.
                  return packagerServer.getDependencies({
                    platform: client.platform,
                    dev: true,
                    hot: true,
                    entryFile: filename,
                    recursive: true,
                  }).then(response => {
                    return packagerServer.getModuleForPath(filename).then(module => {
                      return response.copy({dependencies: [module]});
                    });
                  });
                }

                // if there're new dependencies compare the full list of
                // dependencies we used to have with the one we now have
                return getDependencies(client.platform, client.bundleEntry)
                  .then(({
                    dependenciesCache: depsCache,
                    dependenciesModulesCache: depsModulesCache,
                    shallowDependencies: shallowDeps,
                    inverseDependenciesCache: inverseDepsCache,
                    resolutionResponse,
                  }) => {
                    if (!client) {
                      return {};
                    }

                    const nonNullClient = client;

                    return packagerServer.getModuleForPath(filename).then(moduleToUpdate => {
                      // build list of modules for which we'll send HMR updates
                      const modulesToUpdate = [moduleToUpdate];
                      Object.keys(depsModulesCache).forEach(module => {
                        if (!nonNullClient.dependenciesModulesCache[module]) {
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
                      nonNullClient.dependenciesCache = depsCache;
                      nonNullClient.dependenciesModulesCache = depsModulesCache;
                      nonNullClient.shallowDependencies = shallowDeps;
                      nonNullClient.inverseDependenciesCache = inverseDepsCache;

                      return resolutionResponse.copy({
                        dependencies: modulesToUpdate
                      });
                    });
                  });
              })
              .then((resolutionResponse) => {
                if (!client) {
                  return;
                }

                // make sure the file was modified is part of the bundle
                if (!client.shallowDependencies[filename]) {
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
                  entryFile: client.bundleEntry,
                  platform: client.platform,
                  resolutionResponse,
                }, packagerHost, httpServerAddress.port);
              })
              .then((bundle: HMRBundle) => {
                if (!client || !bundle || bundle.isEmpty()) {
                  return;
                }

                return JSON.stringify({
                  type: 'update',
                  body: {
                    modules: bundle.getModulesIdsAndCode(),
                    inverseDependencies: client.inverseDependenciesCache,
                    sourceURLs: bundle.getSourceURLs(),
                    sourceMappingURLs: bundle.getSourceMappingURLs(),
                  },
                });
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

                return JSON.stringify({type: 'error', body});
              })
              .then(update => {
                if (!client || !update) {
                  return;
                }

                client.ws.send(update);
              });

          promise.then(() => {
            /* $FlowFixMe: assume `client` non-null */
            client.ws.send(JSON.stringify({type: 'update-done'}));
          });
        });

        client.ws.on('error', e => {
          console.error('[Hot Module Replacement] Unexpected error', e);
          disconnect();
        });

        client.ws.on('close', () => disconnect());
      })
    .catch(err => {
      throw err;
    });
  });
}

function arrayEquals<T>(arrayA: Array<T>, arrayB: Array<T>): boolean {
  arrayA = arrayA || [];
  arrayB = arrayB || [];
  return (
    arrayA.length === arrayB.length &&
    arrayA.every((element, index) => {
      return element === arrayB[index];
    })
  );
}

module.exports = attachHMRServer;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const querystring = require('querystring');
const url = require('url');

/**
 * Attaches a WebSocket based connection to the Packager to expose
 * Hot Module Replacement updates to the simulator.
 */
function attachHMRServer({httpServer, path, packagerServer}) {
  let client = null;

  function disconnect() {
    client = null;
    packagerServer.setHMRFileChangeListener(null);
  }

  // Returns a promise with the full list of dependencies and the shallow
  // dependencies each file on the dependency list has for the give platform
  // and entry file.
  function getDependencies(platform, bundleEntry) {
    return packagerServer.getDependencies({
      platform: platform,
      dev: true,
      entryFile: bundleEntry,
    }).then(response => {
      // for each dependency builds the object:
      // `{path: '/a/b/c.js', deps: ['modA', 'modB', ...]}`
      return Promise.all(Object.values(response.dependencies).map(dep => {
        return dep.getName().then(depName => {
          if (dep.isAsset() || dep.isAsset_DEPRECATED() || dep.isJSON()) {
            return Promise.resolve({path: dep.path, deps: []});
          }
          return packagerServer.getShallowDependencies(dep.path)
            .then(deps => {
              return {
                path: dep.path,
                name: depName,
                deps,
              };
            });
        });
      }))
      .then(deps => {
        // list with all the dependencies' filenames the bundle entry has
        const dependenciesCache = response.dependencies.map(dep => dep.path);

        // map from module name to path
        const moduleToFilenameCache = Object.create(null);
        deps.forEach(dep => moduleToFilenameCache[dep.name] = dep.path);

        // map that indicates the shallow dependency each file included on the
        // bundle has
        const shallowDependencies = Object.create(null);
        deps.forEach(dep => shallowDependencies[dep.path] = dep.deps);

        // map from module name to the modules' dependencies the bundle entry
        // has
        const dependenciesModulesCache = Object.create(null);
        return Promise.all(response.dependencies.map(dep => {
          return dep.getName().then(depName => {
            dependenciesModulesCache[depName] = dep;
          });
        })).then(() => {
          return {
            dependenciesCache,
            dependenciesModulesCache,
            shallowDependencies,
          };
        });
      });
    });
  }

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({
    server: httpServer,
    path: path,
  });

  console.log('[Hot Module Replacement] Server listening on', path);
  wss.on('connection', ws => {
    console.log('[Hot Module Replacement] Client connected');
    const params = querystring.parse(url.parse(ws.upgradeReq.url).query);

    getDependencies(params.platform, params.bundleEntry)
      .then(({
        dependenciesCache,
        dependenciesModulesCache,
        shallowDependencies,
      }) => {
        client = {
          ws,
          platform: params.platform,
          bundleEntry: params.bundleEntry,
          dependenciesCache,
          dependenciesModulesCache,
          shallowDependencies,
        };

        packagerServer.setHMRFileChangeListener(filename => {
          if (!client) {
            return;
          }

          return packagerServer.getShallowDependencies(filename)
            .then(deps => {
              // if the file dependencies have change we need to invalidate the
              // dependencies caches because the list of files we need to send
              // to the client may have changed
              const oldDependencies = client.shallowDependencies[filename];
              if (arrayEquals(deps, oldDependencies)) {
                return [packagerServer.getModuleForPath(filename)];
              }

              // if there're new dependencies compare the full list of
              // dependencies we used to have with the one we now have
              return getDependencies(client.platform, client.bundleEntry)
                .then(({
                  dependenciesCache,
                  dependenciesModulesCache,
                  shallowDependencies,
                }) => {
                  // build list of modules for which we'll send HMR updates
                  const modulesToUpdate = [];
                  Object.keys(dependenciesModulesCache).forEach(module => {
                    if (!client.dependenciesModulesCache[module]) {
                      modulesToUpdate.push(dependenciesModulesCache[module]);
                    }
                  });

                  // invalidate caches
                  client.dependenciesCache = dependenciesCache;
                  client.dependenciesModulesCache = dependenciesModulesCache;
                  client.shallowDependencies = shallowDependencies;

                  return modulesToUpdate;
                });
            })
            .then(modulesToUpdate => {
              // make sure the file was modified is part of the bundle
              if (!client.shallowDependencies[filename]) {
                return;
              }

              return packagerServer.buildBundleForHMR(modulesToUpdate);
            })
            .then(bundle => {
              if (bundle) {
                client.ws.send(bundle);
              }
            })
            .done();
        });

        client.ws.on('error', e => {
          console.error('[Hot Module Replacement] Unexpected error', e);
          disconnect();
        });

        client.ws.on('close', () => disconnect());
      })
    .done();
  });
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

module.exports = attachHMRServer;

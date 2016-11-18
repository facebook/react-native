/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const {getInverseDependencies} = require('../../../packager/react-packager/src/node-haste');
const querystring = require('querystring');
const url = require('url');
const HMRClient = require('./HMRClient');

const blacklist = [
  'Libraries/Utilities/HMRClient.js',
];

/**
 * Attaches a WebSocket based connection to the Packager to expose
 * Hot Module Replacement updates to the simulator.
 */
function attachHMRServer({httpServer, path, packagerServer}) {
  let clients = [];
  let didRegisterListener = false;
  const onDisconnect = client => {
    clients.splice(clients.indexOf(client), 1);
    if (clients.length === 0) {
      packagerServer.setHMRFileChangeListener(null);
      didRegisterListener = false;
    }
  };

  // For the given platform and entry file, returns a promise with:
  //   - The full list of dependencies.
  //   - The shallow dependencies each file on the dependency list has
  //   - Inverse shallow dependencies map
  function getDependencies(platform, bundleEntry) {
    return packagerServer.getDependencies({
      platform: platform,
      dev: true,
      hot: true,
      entryFile: bundleEntry,
    }).then(response => {
      const {getModuleId} = response;

      // for each dependency builds the object:
      // `{path: '/a/b/c.js', deps: ['modA', 'modB', ...]}`
      return Promise.all(Object.values(response.dependencies).map(dep => {
        return dep.getName().then(depName => {
          if (dep.isAsset() || dep.isAsset_DEPRECATED() || dep.isJSON()) {
            return Promise.resolve({path: dep.path, deps: []});
          }
          return packagerServer.getShallowDependencies({
            platform: platform,
            dev: true,
            hot: true,
            entryFile: dep.path
          })
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
        deps.forEach(dep => {
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

  console.log('[Hot Module Replacement] Server listening on', path);
  wss.on('connection', ws => {
    console.log('[Hot Module Replacement] Client connected');
    const params = querystring.parse(url.parse(ws.upgradeReq.url).query);

    getDependencies(params.platform, params.bundleEntry)
      .then(({
        dependenciesCache,
        dependenciesModulesCache,
        shallowDependencies,
        inverseDependenciesCache,
      }) => {
        clients.push(new HMRClient({
          ws,
          platform: params.platform,
          bundleEntry: params.bundleEntry,
          dependenciesCache,
          dependenciesModulesCache,
          shallowDependencies,
          inverseDependenciesCache,
          onDisconnect,
        }));
        if (!didRegisterListener) {
          didRegisterListener = true;
          packagerServer.setHMRFileChangeListener((filename, stat) => {

            console.log(
              `[Hot Module Replacement] File change detected (${time()})`
            );

            const blacklisted = blacklist.find(blacklistedPath =>
              filename.indexOf(blacklistedPath) !== -1
            );

            if (blacklisted) {
              return;
            }

            stat.then(() => Promise.all(
                clients.map(client =>
                  client.receiveUpdate(filename, packagerServer, httpServer, getDependencies)
                )
              ), () => {/* do nothing, file was removed */});
          });
        }
      })
    .catch(err => {
      throw err;
    });
  });
}

function time() {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
}

module.exports = attachHMRServer;

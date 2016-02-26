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

  let clients = [];
  let clientsPerBundleEntry = {};

  let platformCache = {
    android: {},
    ios: {},
  };

  function addClient (client) {

    client.ws.on('error', e => {
      console.error('[Hot Module Replacement] Unexpected error', e);
      disconnect(client);
    });

    client.ws.on('close', () => disconnect(client));
    clients.push(client);

    clientsPerBundleEntry[client.bundleEntry] = [...(
      clientsPerBundleEntry[client.bundleEntry] ? clientsPerBundleEntry[client.bundleEntry] : []
    ), client];

    // Only register callback if it's the first client
    if (clients.length === 1) {
      packagerServer.setHMRFileChangeListener(onHMRChange);
    }

  }

  function disconnect (disconnectedClient) {
    clients = clients.filter(client => client !== disconnectedClient);
    clientsPerBundleEntry[disconnectedClient.bundleEntry] = clientsPerBundleEntry[disconnectedClient.bundleEntry].filter(client => client !== disconnectedClient);
    //Only clear change listener if there are no more listening clients
    if (clients.length === 0) {
      packagerServer.setHMRFileChangeListener(null);
    }
  }

  function connectedPlatformClients () {
    return {
      android: clients.filter(client => client.platform === "android"),
      ios: clients.filter(client => client.platform === "ios"),
    }
  }

  function forEachPlatform (callback) {
    const platformClients = connectedPlatformClients();
    return Promise.all([
      wrapPotentialPromise(platformClients.android.length > 0 ? callback("android", platformClients.android) : null),
      wrapPotentialPromise(platformClients.ios.length > 0 ? callback("ios", platformClients.ios) : null),
    ]).then(results => ({
       android: results[0],
       ios: results[1],
    }));
  }

  function forEachBundleEntry (callback) {
    return forEachPlatform(platform =>
      forEachKey(platformCache[platform], bundleEntry =>
        callback(bundleEntry, platform)
      )
    )
  }

  function sendToClients (message, platform, bundleEntry) {
    if (platform && bundleEntry) {
      clientsPerBundleEntry[bundleEntry].map(client => {
        if (client.platform === platform) {
          client.ws.send(JSON.stringify(message))
        }
      })
    }
    else {
      clients.forEach(client => client.ws.send(JSON.stringify(message)));
    }
  }

  // Runs whenever a file changes
  function onHMRChange (filename, stat)  {

    if (clients.length === 0) {
      return;
    }

    console.log(`[Hot Module Replacement] File change detected (${time()})`);
    sendToClients({type: 'update-start'});

    stat.then(() => {
      return packagerServer.getShallowDependencies(filename)
        .then(deps => {
          if (clients.length === 0) {
            return;
          }

          //Check the depedencies for each bundle entry
          return forEachBundleEntry((bundleEntry, platform) => {
            // if the file dependencies have change we need to invalidate the
            // dependencies caches because the list of files we need to send
            // to the client may have changed
            const oldDependencies = platformCache[platform][bundleEntry].shallowDependencies[filename];
            if (arrayEquals(deps, oldDependencies)) {
              // Need to create a resolution response to pass to the bundler
              // to process requires after transform. By providing a
              // specific response we can compute a non recursive one which
              // is the least we need and improve performance.
              return packagerServer.getDependencies({
                platform,
                dev: true,
                entryFile: filename,
                recursive: true,
              }).then(response => {
                const module = packagerServer.getModuleForPath(filename);

                return response.copy({dependencies: [module]});
              });
            }
            console.log(bundleEntry, platform, "WASNT SAME")

            // if there're new dependencies compare the full list of
            // dependencies we used to have with the one we now have
            return getDependencies(platform, bundleEntry)
              .then(({
                dependenciesCache,
                dependenciesModulesCache,
                shallowDependencies,
                resolutionResponse,
              }) => {

                // build list of modules for which we'll send HMR updates
                const modulesToUpdate = [packagerServer.getModuleForPath(filename)];
                Object.keys(dependenciesModulesCache).forEach(module => {
                  if (!platformCache[platform][bundleEntry].dependenciesModulesCache[module]) {
                    modulesToUpdate.push(dependenciesModulesCache[module]);
                  }
                });

                // invalidate caches
                platformCache[platform][bundleEntry].dependenciesCache = dependenciesCache;
                platformCache[platform][bundleEntry].dependenciesModulesCache = dependenciesModulesCache;
                platformCache[platform][bundleEntry].shallowDependencies = shallowDependencies;

                return resolutionResponse.copy({
                  dependencies: modulesToUpdate,
                });
              });

          });
        })
        .then((resolutionResponses) => {
          if (clients.length === 0 || !resolutionResponses) {
            return;
          }

          return forEachBundleEntry((bundleEntry, platform) => {

            if (!resolutionResponses[platform] || !resolutionResponses[platform][bundleEntry]) {
              return;
            }

            if (!platformCache[platform][bundleEntry].shallowDependencies[filename]){
              return;
            }

            const resolutionResponse = resolutionResponses[platform][bundleEntry];

            const httpServerAddress = httpServer.address();

            // Sanitize the value from the HTTP server
            let packagerHost = 'localhost';
            if (httpServerAddress.address &&
                httpServerAddress.address !== '::' &&
                httpServerAddress.address !== '') {
              packagerHost = httpServerAddress.address;
            }

            let packagerPort = httpServerAddress.port;
            return packagerServer.buildBundleForHMR({
              entryFile: bundleEntry,
              platform,
              resolutionResponse,
            }, packagerHost, packagerPort);
          });
        })
        .then(bundles => {
          if (clients.length === 0 || !bundles) {
            return;
          }

          return forEachBundleEntry((bundleEntry, platform) => {

            if (!bundles[platform]) {
              return;
            }

            const bundle = bundles[platform][bundleEntry];

            if (!bundle || bundle.isEmpty()) {
              return;
            }
            return {
              type: 'update',
              body: {
                modules: bundle.getModulesCode(),
                sourceURLs: bundle.getSourceURLs(),
                sourceMappingURLs: bundle.getSourceMappingURLs(),
              },
            };
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

          return forEachBundleEntry((bundleEntry, platform) => ({type: 'error', body}));
        })
        .then(update => {
          if (clients.length === 0 || !update) {
            return;
          }

          forEachBundleEntry((bundleEntry, platform) => {
            if (!update[platform] || !update[platform][bundleEntry]) {
              return;
            }
            console.log(`[Hot Module Replacement] Sending HMR update to client (${time()})`);
            sendToClients(update[platform][bundleEntry], platform, bundleEntry);
          });
        })
      },
      () => {
        // do nothing, file was removed
      }
    ).finally(() => {
      sendToClients({type: 'update-done'});
    });
  }

  // Returns a promise with the full list of dependencies and the shallow
  // dependencies each file on the dependency list has for the give platform
  // and entry file.
  function getDependencies(platform, bundleEntry) {
    return packagerServer.getDependencies({
      platform,
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
            resolutionResponse: response,
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

        const client = {
          ws,
          platform: params.platform,
          bundleEntry: params.bundleEntry,
        };

        //Set the platform dependency cache when a new client connects
        platformCache[params.platform][params.bundleEntry] = {
          dependenciesCache,
          dependenciesModulesCache,
          shallowDependencies,
        };

        addClient(client);
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

function time() {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
}


function wrapPotentialPromise (valueOrPromise) {
  if (valueOrPromise == null) {
    return Promise.resolve(valueOrPromise)
  }
  else if (valueOrPromise.then && typeof valueOrPromise === "function") {
    return valueOrPromise
  }
  else {
    return Promise.resolve(valueOrPromise)
  }
}

function forEachKey (object, callback) {
  const keys = Object.keys(object);
  return Promise.all(
    keys.map(key => wrapPotentialPromise(callback(key, object[key])))
  ).then(results => {
    const newObject = {};
    keys.forEach((key, index) => newObject[key] = results[index]);
    return newObject;
  })
}

module.exports = attachHMRServer;

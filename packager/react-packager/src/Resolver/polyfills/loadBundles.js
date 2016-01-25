/* eslint strict:0 */

let loadBundlesOnNative = (bundles) =>
  new Promise((resolve) =>
    require('NativeModules').RCTBundlesLoader.loadBundles(bundles, resolve));

let requestedBundles = Object.create(null);

/**
 * Returns a promise that is fulfilled once all the indicated bundles are
 * loaded into memory and injected into the JS engine.
 * This invokation might need to go through the bridge
 * and run native code to load some, if not all, the requested bundles.
 * If all the bundles have already been loaded, the promise is resolved
 * immediately. Otherwise, we'll determine which bundles still need to get
 * loaded considering both, the ones already loaded, and the ones being
 * currently asynchronously loaded by other invocations to `__loadBundles`,
 * and return a promise that will get fulfilled once all these are finally
 * loaded.
 *
 * Note this function should only be invoked by generated code.
 */
global.__loadBundles = function(bundles) {
  // split bundles by whether they've already been requested or not
  const bundlesToRequest = bundles.filter(b => !requestedBundles[b]);

  // keep a reference to the promise loading each bundle
  if (bundlesToRequest.length > 0) {
    const nativePromise = loadBundlesOnNative(bundlesToRequest);
    bundlesToRequest.forEach(b => requestedBundles[b] = nativePromise);
  }

  return Promise.all(bundles.map(bundle => requestedBundles[bundle]));
};

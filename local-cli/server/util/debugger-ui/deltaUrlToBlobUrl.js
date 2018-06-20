/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/* global Blob, URL: true */

(function(global) {
  'use strict';

  let cachedBundleUrls = new Map();

  /**
   * Converts the passed delta URL into an URL object containing already the
   * whole JS bundle Blob.
   */
  async function deltaUrlToBlobUrl(deltaUrl) {
    const client = global.DeltaPatcher.get(deltaUrl);

    const deltaBundleId = client.getLastBundleId()
      ? `&deltaBundleId=${client.getLastBundleId()}`
      : '';

    const data = await fetch(deltaUrl + deltaBundleId);
    const bundle = await data.json();

    const deltaPatcher = client.applyDelta({
      id: bundle.id,
      pre: new Map(bundle.pre),
      post: new Map(bundle.post),
      delta: new Map(bundle.delta),
      reset: bundle.reset,
    });

    let cachedBundle = cachedBundleUrls.get(deltaUrl);

    // If nothing changed, avoid recreating a bundle blob by reusing the
    // previous one.
    if (deltaPatcher.getLastNumModifiedFiles() === 0 && cachedBundle) {
      return cachedBundle;
    }

    // Clean up the previous bundle URL to not leak memory.
    if (cachedBundle) {
      URL.revokeObjectURL(cachedBundle);
    }

    // To make Source Maps work correctly, we need to add a newline between
    // modules.
    const blobContent = deltaPatcher
      .getAllModules()
      .map(module => module + '\n');

    // Build the blob with the whole JS bundle.
    const blob = new Blob(blobContent, {
      type: 'application/javascript',
    });

    const bundleContents = URL.createObjectURL(blob);
    cachedBundleUrls.set(deltaUrl, bundleContents);

    return bundleContents;
  }

  global.deltaUrlToBlobUrl = deltaUrlToBlobUrl;
})(window || {});

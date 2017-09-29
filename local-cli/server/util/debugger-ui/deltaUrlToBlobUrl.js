/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
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
    let cachedBundle = cachedBundleUrls.get(deltaUrl);

    const deltaBundleId = cachedBundle
      ? `&deltaBundleId=${cachedBundle.id}`
      : '';

    const data = await fetch(deltaUrl + deltaBundleId);
    const bundle = await data.json();

    const deltaPatcher = global.DeltaPatcher.get(bundle.id).applyDelta({
      pre: new Map(bundle.pre),
      post: new Map(bundle.post),
      delta: new Map(bundle.delta),
      reset: bundle.reset,
    });

    // If nothing changed, avoid recreating a bundle blob by reusing the
    // previous one.
    if (deltaPatcher.getLastNumModifiedFiles() === 0 && cachedBundle) {
      return cachedBundle.url;
    }

    // Clean up the previous bundle URL to not leak memory.
    if (cachedBundle) {
      URL.revokeObjectURL(cachedBundle.url);
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

    const bundleUrl = URL.createObjectURL(blob);
    cachedBundleUrls.set(deltaUrl, {
      id: bundle.id,
      url: bundleUrl,
    });

    return bundleUrl;
  }

  global.deltaUrlToBlobUrl = deltaUrlToBlobUrl;
})(window || {});

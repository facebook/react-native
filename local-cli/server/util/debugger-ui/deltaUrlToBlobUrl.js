/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

    const revisionId = client.getLastRevisionId()
      ? `&revisionId=${client.getLastRevisionId()}`
      : '';

    const data = await fetch(deltaUrl + revisionId);
    const bundle = await data.json();

    const deltaPatcher = client.applyDelta(bundle);

    let cachedBundle = cachedBundleUrls.get(deltaUrl);

    // If nothing changed, avoid recreating a bundle blob by reusing the
    // previous one.
    if (
      deltaPatcher.getLastNumModifiedFiles() === 0 &&
      cachedBundle != null &&
      cachedBundle !== ''
    ) {
      return cachedBundle;
    }

    // Clean up the previous bundle URL to not leak memory.
    if (cachedBundle != null && cachedBundle !== '') {
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

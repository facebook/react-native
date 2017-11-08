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
 * @providesModule BundleSegments
 */

'use strict';

let segmentLoaders = new Map();

/**
 * Ensure that a bundle segment is ready for use, for example requiring some of
 * its module. We cache load promises so as to avoid calling `fetchBundle` twice
 * for the same bundle. We assume that once a segment is fetched/loaded, it is
 * never gettting removed during this instance of the JavaScript VM.
 */
async function loadForModule(moduleID: number): Promise<void> {
  const {segmentId} = (require: $FlowFixMe).unpackModuleId(moduleID);
  if (segmentId === 0) {
    return;
  }
  let segmentLoader = segmentLoaders.get(segmentId);
  if (segmentLoader != null) {
    return await segmentLoader;
  }
  // FIXME: `fetchBundle` should be renamed `fetchSegment`.
  const {fetchBundle} = global;
  if (fetchBundle == null) {
    throw new Error(
      'When bundle splitting is enabled, the `global.fetchBundle` function ' +
        'must be provided to be able to load particular bundle segments.',
    );
  }
  segmentLoader = new Promise((resolve, reject) => {
    fetchBundle(segmentId, error => {
      if (error != null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  segmentLoaders.set(segmentId, segmentLoader);
  return await segmentLoader;
}

module.exports = {loadForModule};

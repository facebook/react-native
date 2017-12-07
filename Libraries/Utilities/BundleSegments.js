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
 * its module. We cache load promises so as to avoid calling `fetchSegment` twice
 * for the same bundle. We assume that once a segment is fetched/loaded, it is
 * never gettting removed during this instance of the JavaScript VM.
 *
 * We don't use async/await syntax to avoid depending on `regeneratorRuntime`.
 */
function loadForModule(moduleID: number): Promise<void> {
  return Promise.resolve().then(() => {
    const {segmentId} = (require: $FlowFixMe).unpackModuleId(moduleID);
    if (segmentId === 0) {
      return;
    }
    let segmentLoader = segmentLoaders.get(segmentId);
    if (segmentLoader != null) {
      return segmentLoader;
    }

    const {fetchSegment} = global;
    if (fetchSegment == null) {
      throw new Error(
        'When bundle splitting is enabled, the `global.fetchSegment` function ' +
          'must be provided to be able to load particular bundle segments.',
      );
    }
    segmentLoader = new Promise((resolve, reject) => {
      fetchSegment(segmentId, error => {
        if (error != null) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    segmentLoaders.set(segmentId, segmentLoader);
    return segmentLoader;
  });
}

module.exports = {loadForModule};

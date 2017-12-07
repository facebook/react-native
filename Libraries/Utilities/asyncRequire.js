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
 * @providesModule asyncRequire
 */

'use strict';

/**
 * The bundler must register the dependency properly when generating a call to
 * `asyncRequire`, that allows us to call `require` dynamically with confidence
 * the module ID is indeed valid and available.
 */
function asyncRequire(moduleID: number): Promise<mixed> {
  return Promise.resolve()
    .then(() => {
      const {segmentId} = (require: $FlowFixMe).unpackModuleId(moduleID);
      return loadSegment(segmentId);
    })
    .then(() => require.call(null, (moduleID: $FlowFixMe)));
}

let segmentLoaders = new Map();

/**
 * Ensure that a bundle segment is ready for use, for example requiring some of
 * its module. We cache load promises so as to avoid calling `fetchSegment`
 * twice for the same bundle. We assume that once a segment is fetched/loaded,
 * it is never gettting removed during this instance of the JavaScript VM.
 *
 * Segment #0 is the main segment, that is always available by definition, so
 * we never try to load anything.
 *
 * We don't use async/await syntax to avoid depending on `regeneratorRuntime`.
 */
function loadSegment(segmentId: number): Promise<void> {
  return Promise.resolve().then(() => {
    if (segmentId === 0) {
      return;
    }
    let segmentLoader = segmentLoaders.get(segmentId);
    if (segmentLoader != null) {
      return segmentLoader;
    }
    const {fetchSegment} = global;
    if (fetchSegment == null) {
      throw new FetchSegmentNotAvailableError();
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

class FetchSegmentNotAvailableError extends Error {
  constructor() {
    super(
      'When bundle splitting is enabled, the `global.fetchSegment` function ' +
        'must be provided to be able to load particular bundle segments.',
    );
  }
}

module.exports = asyncRequire;

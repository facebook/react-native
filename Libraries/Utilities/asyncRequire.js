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

const dynamicRequire: number => mixed = (require: $FlowFixMe);

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
    .then(() => dynamicRequire(moduleID));
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
    if (typeof global.__BUNDLE_DIGEST__ !== 'string') {
      throw IncorrectBundleSetupError();
    }
    const globalDigest = global.__BUNDLE_DIGEST__;
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
    }).then(() => {
      const metaModuleId = (require: $FlowFixMe).packModuleId({
        segmentId,
        localId: 0,
      });
      const metaModule = dynamicRequire(metaModuleId);
      const digest: string =
        typeof metaModule === 'object' && metaModule != null
          ? (metaModule.BUNDLE_DIGEST: $FlowFixMe)
          : 'undefined';
      if (digest !== globalDigest) {
        throw new IncompatibleSegmentError(globalDigest, digest);
      }
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

class IncorrectBundleSetupError extends Error {
  constructor() {
    super(
      'To be able to use split segments, the bundler must define a global ' +
        'constant `__BUNDLE_DIGEST__` that identifies the bundle uniquely.',
    );
  }
}
asyncRequire.IncorrectBundleSetupError = IncorrectBundleSetupError;

class IncompatibleSegmentError extends Error {
  constructor(globalDigest, segmentDigest) {
    super(
      'The split segment that is being loaded has been built from a ' +
        'different version of the code than the main segment. Or, the ' +
        'bundler is setting up the module #0 of the segment incorrectly. ' +
        `The global digest is \`${globalDigest}\` while the segment is ` +
        `\`${segmentDigest}\`.`,
    );
  }
}
asyncRequire.IncompatibleSegmentError = IncompatibleSegmentError;

module.exports = asyncRequire;

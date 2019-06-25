/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

export type FetchSegmentFunction = typeof __fetchSegment;
export type GetSegmentFunction = typeof __getSegment;

/**
 * Set up SegmentFetcher.
 * You can use this module directly, or just require InitializeCore.
 */

function __fetchSegment(
  segmentId: number,
  options: {|
    +otaBuildNumber: ?string,
    +requestedModuleName?: ?string,
  |},
  callback: (?Error) => void,
) {
  const SegmentFetcher = require('./SegmentFetcher/NativeSegmentFetcher')
    .default;
  SegmentFetcher.fetchSegment(
    segmentId,
    options,
    (errorObject: ?{message: string, code: string}) => {
      if (errorObject) {
        const error = new Error(errorObject.message);
        (error: any).code = errorObject.code; // flowlint-line unclear-type: off
        callback(error);
      }

      callback(null);
    },
  );
}

global.__fetchSegment = __fetchSegment;

function __getSegment(
  segmentId: number,
  options: {|
    +otaBuildNumber: ?string,
    +requestedModuleName?: ?string,
  |},
  callback: (?Error, ?string) => void,
) {
  const SegmentFetcher = require('./SegmentFetcher/NativeSegmentFetcher')
    .default;

  if (!SegmentFetcher.getSegment) {
    throw new Error('SegmentFetcher.getSegment must be defined');
  }

  SegmentFetcher.getSegment(
    segmentId,
    options,
    (errorObject: ?{message: string, code: string}, path: ?string) => {
      if (errorObject) {
        const error = new Error(errorObject.message);
        (error: any).code = errorObject.code; // flowlint-line unclear-type: off
        callback(error);
      }

      callback(null, path);
    },
  );
}

global.__getSegment = __getSegment;

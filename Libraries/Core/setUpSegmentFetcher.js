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

/**
 * Set up SegmentFetcher.
 * You can use this module directly, or just require InitializeCore.
 */
global.__fetchSegment = function(
  segmentId: number,
  options: {|+otaBuildNumber: ?string|},
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
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import typeof {enable} from 'promise/setimmediate/rejection-tracking';

import LogBox from './LogBox/LogBox';

let rejectionTrackingOptions: $NonMaybeType<Parameters<enable>[0]> = {
  allRejections: true,
  onUnhandled: (id, rejection = {}) => {
    let message: string;
    let stack: ?string;

    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    const stringValue = Object.prototype.toString.call(rejection);
    if (stringValue === '[object Error]') {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      message = Error.prototype.toString.call(rejection);
      const error: Error = (rejection: $FlowFixMe);
      stack = error.stack;
    } else {
      try {
        message = require('pretty-format').format(rejection);
      } catch {
        message =
          typeof rejection === 'string'
            ? rejection
            : JSON.stringify((rejection: $FlowFixMe));
      }
      // It could although this object is not a standard error, it still has stack information to unwind
      // $FlowFixMe ignore types just check if stack is there
      if (rejection?.stack && typeof rejection.stack === 'string') {
        stack = rejection.stack;
      }
    }

    // We overwrite the stack by the extracted rejection stack if available
    const rejectionPrefix = `Uncaught (in promise, id ${id})`;
    const rejectionError = new Error(`${rejectionPrefix} ${message ?? ''}`);
    rejectionError.stack = `${rejectionPrefix} ${stack ?? ''}`;
    console.error(rejectionError);
  },
  onHandled: id => {
    const warning =
      `Promise rejection handled (id: ${id})\n` +
      'This means you can ignore any previous messages of the form ' +
      `"Uncaught (in promise, id ${id})"`;
    console.warn(warning);
  },
};

export default rejectionTrackingOptions;

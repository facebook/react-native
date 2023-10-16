/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
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

      // Print correct unhandled rejections stack while on DEV
      if (__DEV__) {
        LogBox.addLog({
          level: 'warn',
          message: {
            content:
              `Possible Unhandled Promise Rejection (id: ${id}):\n` +
              `${message ?? ''}\n`,
            substitutions: [],
          },
          componentStack: [],
          stack: error.stack,
          category: 'possible_unhandled_promise_rejection',
        });

        return;
      } else {
        stack = error.stack;
      }
    } else {
      try {
        message = require('pretty-format')(rejection);
      } catch {
        message =
          typeof rejection === 'string'
            ? rejection
            : JSON.stringify((rejection: $FlowFixMe));
      }
    }

    const warning =
      `Possible Unhandled Promise Rejection (id: ${id}):\n` +
      `${message ?? ''}\n` +
      (stack == null ? '' : stack);
    console.warn(warning);
  },
  onHandled: id => {
    const warning =
      `Promise Rejection Handled (id: ${id})\n` +
      'This means you can ignore any previous messages of the form ' +
      `"Possible Unhandled Promise Rejection (id: ${id}):"`;
    console.warn(warning);
  },
};

export default rejectionTrackingOptions;

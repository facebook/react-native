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

type ExtractOptionsType = <P>(((options?: ?P) => void)) => P;

let rejectionTrackingOptions: $Call<ExtractOptionsType, enable> = {
  allRejections: true,
  onUnhandled: async (id, rejection = {}) => {
    let message: string;
    let stack: ?string;

    // $FlowFixMe[method-unbinding] added when improving typing for this parameters
    const stringValue = Object.prototype.toString.call(rejection);
    if (stringValue === '[object Error]') {
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      message = Error.prototype.toString.call(rejection);
      const error: Error = (rejection: $FlowFixMe);

      // Print pretty unhandled rejections while on DEV
      if (__DEV__) {
        const parseErrorStack = require('Libraries/Core/Devtools/parseErrorStack');
        const symbolicateStackTrace = require('Libraries/Core/Devtools/symbolicateStackTrace');
        const LogBox = require('Libraries/LogBox/LogBox').default;

        stack = parseErrorStack(error.stack);
        stack = await symbolicateStackTrace(stack);
        if (stack) {
          const warning =
            `Possible Unhandled Promise Rejection (id: ${id}):\n` +
            `${message ?? ''}\n` +
            `at File: ${stack.codeFrame.fileName}, row: ${stack.codeFrame.location.row}, column: ${stack.codeFrame.location.column}`;

          console.log(stack.codeFrame.content);

          LogBox.addLog({
            level: 'warn',
            message: {content: warning, substitutions: []},
            isComponentError: false,
            codeFrame: stack.codeFrame,
            stack: error.stack,
            category: `${stack.codeFrame.fileName}-${stack.codeFrame.location.row}-${stack.codeFrame.location.column}`,
          });
          return;
        }
      }

      stack = error.stack;
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

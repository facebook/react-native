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
  onUnhandled: (id, rejection = {}) => {
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
        const parseErrorStack = require('./Core/Devtools/parseErrorStack');
        const symbolicateStackTrace = require('./Core/Devtools/symbolicateStackTrace');
        const LogBox = require('./LogBox/LogBox').default;

        const parsedStack = parseErrorStack(error.stack);

        symbolicateStackTrace(parsedStack)
          .then(prettyStack => {
            let warning =
              `Possible Unhandled Promise Rejection (id: ${id}):\n` +
              `${message ?? ''}\n`;

            if (prettyStack.codeFrame != null) {
              warning += `at File: ${prettyStack.codeFrame.fileName}, row: ${
                prettyStack.codeFrame.location?.row ?? 'Unknown'
              }, column: ${
                prettyStack.codeFrame.location?.column ?? 'Unknown'
              }`;

              LogBox.addLog({
                level: 'warn',
                message: {content: warning, substitutions: []},
                componentStack: [],
                codeFrame: prettyStack.codeFrame,
                category: `${prettyStack.codeFrame.fileName}-${
                  prettyStack.codeFrame.location?.row ?? 'unknown'
                }-${prettyStack.codeFrame.location?.column ?? 'unknown'}`,
              });
            } else {
              console.warn(warning);
            }
          })
          .catch(() => {
            const warning =
              `Possible Unhandled Promise Rejection (id: ${id}):\n` +
              `${message ?? ''}\n` +
              (stack == null ? '' : stack);
            console.warn(warning);
          });
        return;
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

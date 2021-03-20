/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import Platform from '../Utilities/Platform';
import RCTLog from '../Utilities/RCTLog';

import type {IgnorePattern} from './Data/LogBoxData';

let LogBox;

/**
 * LogBox displays logs in the app.
 */
if (__DEV__) {
  const LogBoxData = require('./Data/LogBoxData');
  const {parseLogBoxLog, parseInterpolation} = require('./Data/parseLogBoxLog');

  // LogBox needs to insert itself early,
  // in order to access the component stacks appended by React DevTools.
  const {error, warn} = console;
  let errorImpl = error.bind(console);
  let warnImpl = warn.bind(console);

  (console: any).error = function(...args) {
    errorImpl(...args);
  };
  (console: any).warn = function(...args) {
    warnImpl(...args);
  };

  LogBox = {
    ignoreLogs: (patterns: $ReadOnlyArray<IgnorePattern>): void => {
      LogBoxData.addIgnorePatterns(patterns);
    },

    ignoreAllLogs: (value?: ?boolean): void => {
      LogBoxData.setDisabled(value == null ? true : value);
    },

    uninstall: (): void => {
      errorImpl = error;
      warnImpl = warn;
      delete (console: any).disableLogBox;
    },

    install: (): void => {
      // Trigger lazy initialization of module.
      require('../NativeModules/specs/NativeLogBox');

      errorImpl = function(...args) {
        registerError(...args);
      };

      warnImpl = function(...args) {
        registerWarning(...args);
      };

      if ((console: any).disableYellowBox === true) {
        LogBoxData.setDisabled(true);
        console.warn(
          'console.disableYellowBox has been deprecated and will be removed in a future release. Please use LogBox.ignoreAllLogs(value) instead.',
        );
      }

      (Object.defineProperty: any)(console, 'disableYellowBox', {
        configurable: true,
        get: () => LogBoxData.isDisabled(),
        set: value => {
          LogBoxData.setDisabled(value);
          console.warn(
            'console.disableYellowBox has been deprecated and will be removed in a future release. Please use LogBox.ignoreAllLogs(value) instead.',
          );
        },
      });

      if (Platform.isTesting) {
        LogBoxData.setDisabled(true);
      }

      RCTLog.setWarningHandler((...args) => {
        registerWarning(...args);
      });
    },
  };

  const isRCTLogAdviceWarning = (...args) => {
    // RCTLogAdvice is a native logging function designed to show users
    // a message in the console, but not show it to them in Logbox.
    return typeof args[0] === 'string' && args[0].startsWith('(ADVICE)');
  };

  const isWarningModuleWarning = (...args) => {
    return typeof args[0] === 'string' && args[0].startsWith('Warning: ');
  };

  const registerWarning = (...args): void => {
    // Let warnings within LogBox itself fall through.
    if (LogBoxData.isLogBoxErrorMessage(String(args[0]))) {
      error.call(console, ...args);
      return;
    }

    try {
      if (!isRCTLogAdviceWarning(...args)) {
        const {category, message, componentStack} = parseLogBoxLog(args);

        if (!LogBoxData.isMessageIgnored(message.content)) {
          // Be sure to pass LogBox warnings through.
          warn.call(console, ...args);

          LogBoxData.addLog({
            level: 'warn',
            category,
            message,
            componentStack,
          });
        }
      }
    } catch (err) {
      LogBoxData.reportLogBoxError(err);
    }
  };

  const registerError = (...args): void => {
    // Let errors within LogBox itself fall through.
    if (LogBoxData.isLogBoxErrorMessage(args[0])) {
      error.call(console, ...args);
      return;
    }

    try {
      if (!isWarningModuleWarning(...args)) {
        // Only show LogBox for the 'warning' module, otherwise pass through.
        // By passing through, this will get picked up by the React console override,
        // potentially adding the component stack. React then passes it back to the
        // React Native ExceptionsManager, which reports it to LogBox as an error.
        //
        // The 'warning' module needs to be handled here because React internally calls
        // `console.error('Warning: ')` with the component stack already included.
        error.call(console, ...args);
        return;
      }

      const format = args[0].replace('Warning: ', '');
      const filterResult = LogBoxData.checkWarningFilter(format);
      if (filterResult.suppressCompletely) {
        return;
      }

      let level = 'error';
      if (filterResult.suppressDialog_LEGACY === true) {
        level = 'warn';
      } else if (filterResult.forceDialogImmediately === true) {
        level = 'fatal'; // Do not downgrade. These are real bugs with same severity as throws.
      }

      // Unfortunately, we need to add the Warning: prefix back for downstream dependencies.
      args[0] = `Warning: ${filterResult.finalFormat}`;
      const {category, message, componentStack} = parseLogBoxLog(args);

      if (!LogBoxData.isMessageIgnored(message.content)) {
        // Interpolate the message so they are formatted for adb and other CLIs.
        // This is different than the message.content above because it includes component stacks.
        const interpolated = parseInterpolation(args);
        error.call(console, interpolated.message.content);

        LogBoxData.addLog({
          level,
          category,
          message,
          componentStack,
        });
      }
    } catch (err) {
      LogBoxData.reportLogBoxError(err);
    }
  };
} else {
  LogBox = {
    ignoreLogs: (patterns: $ReadOnlyArray<IgnorePattern>): void => {
      // Do nothing.
    },

    ignoreAllLogs: (value?: ?boolean): void => {
      // Do nothing.
    },

    install: (): void => {
      // Do nothing.
    },

    uninstall: (): void => {
      // Do nothing.
    },
  };
}

module.exports = (LogBox: {
  ignoreLogs($ReadOnlyArray<IgnorePattern>): void,
  ignoreAllLogs(?boolean): void,
  install(): void,
  uninstall(): void,
  ...
});

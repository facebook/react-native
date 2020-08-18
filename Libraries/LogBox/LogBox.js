/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import Platform from '../Utilities/Platform';
import RCTLog from '../Utilities/RCTLog';
import * as LogBoxData from './Data/LogBoxData';
import {parseLogBoxLog} from './Data/parseLogBoxLog';

import type {IgnorePattern} from './Data/LogBoxData';

let LogBox;

/**
 * LogBox displays logs in the app.
 */
if (__DEV__) {
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
    // TODO: deprecated, replace with ignoreLogs
    ignoreWarnings: (patterns: $ReadOnlyArray<IgnorePattern>): void => {
      LogBox.ignoreLogs(patterns);
    },

    ignoreLogs: (patterns: $ReadOnlyArray<IgnorePattern>): void => {
      LogBoxData.addIgnorePatterns(patterns);
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

      if ((console: any).disableLogBox === true) {
        LogBoxData.setDisabled(true);
      }

      (Object.defineProperty: any)(console, 'disableLogBox', {
        configurable: true,
        get: () => LogBoxData.isDisabled(),
        set: value => LogBoxData.setDisabled(value),
      });

      if (Platform.isTesting) {
        (console: any).disableLogBox = true;
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
    try {
      if (!isRCTLogAdviceWarning(...args)) {
        const {category, message, componentStack} = parseLogBoxLog(args);

        if (!LogBoxData.isMessageIgnored(message.content)) {
          // Be sure to pass LogBox warnings through.
          warn.call(console, ...args);

          if (!LogBoxData.isLogBoxErrorMessage(message.content)) {
            LogBoxData.addLog({
              level: 'warn',
              category,
              message,
              componentStack,
            });
          }
        }
      }
    } catch (err) {
      LogBoxData.reportLogBoxError(err);
    }
  };

  const registerError = (...args): void => {
    try {
      if (!isWarningModuleWarning(...args)) {
        // Only show LogBox for the `warning` module, otherwise pass through and skip.
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
        // Be sure to pass LogBox errors through.
        error.call(console, ...args);

        if (!LogBoxData.isLogBoxErrorMessage(message.content)) {
          LogBoxData.addLog({
            level,
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
} else {
  LogBox = {
    // TODO: deprecated, replace with ignoreLogs
    ignoreWarnings: (patterns: $ReadOnlyArray<IgnorePattern>): void => {
      // Do nothing.
    },

    ignoreLogs: (patterns: $ReadOnlyArray<IgnorePattern>): void => {
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
  // TODO: deprecated, replace with ignoreLogs
  ignoreWarnings($ReadOnlyArray<IgnorePattern>): void,
  ignoreLogs($ReadOnlyArray<IgnorePattern>): void,
  install(): void,
  uninstall(): void,
  ...
});

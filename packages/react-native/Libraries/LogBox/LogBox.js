/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {IgnorePattern, LogData} from './Data/LogBoxData';
import type {ExtendedExceptionData} from './Data/parseLogBoxLog';

import Platform from '../Utilities/Platform';
import RCTLog from '../Utilities/RCTLog';
import * as React from 'react';

export type {LogData, ExtendedExceptionData, IgnorePattern};

let LogBox;

interface ILogBox {
  install(): void;
  uninstall(): void;
  isInstalled(): boolean;
  ignoreLogs($ReadOnlyArray<IgnorePattern>): void;
  ignoreAllLogs(value?: boolean): void;
  clearAllLogs(): void;
  addLog(log: LogData): void;
  addConsoleLog(level: 'warn' | 'error', ...args: Array<mixed>): void;
  addException(error: ExtendedExceptionData): void;
}

/**
 * LogBox displays logs in the app.
 */
if (__DEV__) {
  const LogBoxData = require('./Data/LogBoxData');
  const {
    parseLogBoxLog,
    parseComponentStack,
  } = require('./Data/parseLogBoxLog');

  let originalConsoleWarn;
  let consoleWarnImpl: (...args: Array<mixed>) => void;

  let isLogBoxInstalled: boolean = false;

  LogBox = {
    install(): void {
      if (isLogBoxInstalled) {
        return;
      }

      isLogBoxInstalled = true;

      if (global.RN$registerExceptionListener != null) {
        global.RN$registerExceptionListener(
          (error: ExtendedExceptionData & {preventDefault: () => mixed}) => {
            if (global.RN$isRuntimeReady?.() || !error.isFatal) {
              error.preventDefault();
              addException(error);
            }
          },
        );
      }

      // Trigger lazy initialization of module.
      require('../NativeModules/specs/NativeLogBox');

      // IMPORTANT: we only overwrite `console.error` and `console.warn` once.
      // When we uninstall we keep the same reference and only change its
      // internal implementation
      const isFirstInstall = originalConsoleWarn == null;
      if (isFirstInstall) {
        // We only patch warning for legacy reasons.
        // This will be removed in the future, once warnings
        // are fully moved to fusebox. Error handling is done
        // via the ExceptionManager.
        originalConsoleWarn = console.warn.bind(console);

        // $FlowExpectedError[cannot-write]
        console.warn = (...args) => {
          consoleWarnImpl(...args);
        };
      }

      consoleWarnImpl = registerWarning;

      if (Platform.isTesting) {
        LogBoxData.setDisabled(true);
      }

      RCTLog.setWarningHandler((...args) => {
        registerWarning(...args);
      });
    },

    uninstall(): void {
      if (!isLogBoxInstalled) {
        return;
      }

      isLogBoxInstalled = false;

      // IMPORTANT: we don't re-assign to `console` in case the method has been
      // decorated again after installing LogBox. E.g.:
      // Before uninstalling: original > LogBox > OtherErrorHandler
      // After uninstalling:  original > LogBox (noop) > OtherErrorHandler
      consoleWarnImpl = originalConsoleWarn;
    },

    isInstalled(): boolean {
      return isLogBoxInstalled;
    },

    /**
     * Silence any logs that match the given strings or regexes.
     */
    ignoreLogs(patterns: $ReadOnlyArray<IgnorePattern>): void {
      LogBoxData.addIgnorePatterns(patterns);
    },

    /**
     * Toggle error and warning notifications
     * Note: this only disables notifications, uncaught errors will still open a full screen LogBox.
     * @param ignore whether to ignore logs or not
     */
    ignoreAllLogs(value?: ?boolean): void {
      LogBoxData.setDisabled(value == null ? true : value);
    },

    clearAllLogs(): void {
      LogBoxData.clear();
    },

    addLog(log: LogData): void {
      if (isLogBoxInstalled) {
        LogBoxData.addLog(log);
      }
    },

    addConsoleLog(level: 'warn' | 'error', ...args: Array<mixed>) {
      if (isLogBoxInstalled) {
        let filteredLevel: 'warn' | 'error' | 'fatal' = level;
        try {
          let format = args[0];
          if (typeof format === 'string') {
            const filterResult =
              require('../LogBox/Data/LogBoxData').checkWarningFilter(
                // For legacy reasons, we strip the warning prefix from the message.
                // Can remove this once we remove the warning module altogether.
                format.replace(/^Warning: /, ''),
              );
            if (filterResult.monitorEvent !== 'warning_unhandled') {
              if (filterResult.suppressCompletely) {
                return;
              }

              if (filterResult.suppressDialog_LEGACY === true) {
                filteredLevel = 'warn';
              } else if (filterResult.forceDialogImmediately === true) {
                filteredLevel = 'fatal'; // Do not downgrade. These are real bugs with same severity as throws.
              }
              args[0] = filterResult.finalFormat;
            }
          }

          const result = parseLogBoxLog(args);
          const category = result.category;
          const message = result.message;
          let componentStackType = result.componentStackType;
          let componentStack = result.componentStack;
          if (
            (!componentStack || componentStack.length === 0) &&
            // $FlowExpectedError[prop-missing]
            React.captureOwnerStack
          ) {
            const ownerStack = React.captureOwnerStack();
            if (ownerStack != null && ownerStack.length > 0) {
              const parsedComponentStack = parseComponentStack(ownerStack);
              componentStack = parsedComponentStack.stack;
              componentStackType = parsedComponentStack.type;
            }
          }
          if (!LogBoxData.isMessageIgnored(message.content)) {
            LogBoxData.addLog({
              level: filteredLevel,
              category,
              message,
              componentStack,
              componentStackType,
            });
          }
        } catch (err) {
          LogBoxData.reportLogBoxError(err);
        }
      }
    },

    addException,
  };

  function addException(error: ExtendedExceptionData): void {
    if (isLogBoxInstalled) {
      LogBoxData.addException(error);
    }
  }

  const isRCTLogAdviceWarning = (...args: Array<mixed>) => {
    // RCTLogAdvice is a native logging function designed to show users
    // a message in the console, but not show it to them in Logbox.
    return typeof args[0] === 'string' && args[0].startsWith('(ADVICE)');
  };

  const registerWarning = (...args: Array<mixed>): void => {
    // Let warnings within LogBox itself fall through.
    if (LogBoxData.isLogBoxErrorMessage(String(args[0]))) {
      return;
    } else {
      // Be sure to pass LogBox warnings through.
      originalConsoleWarn(...args);
    }

    try {
      if (!isRCTLogAdviceWarning(...args)) {
        const {category, message, componentStack, componentStackType} =
          parseLogBoxLog(args);

        if (!LogBoxData.isMessageIgnored(message.content)) {
          LogBoxData.addLog({
            level: 'warn',
            category,
            message,
            componentStack,
            componentStackType,
          });
        }
      }
    } catch (err) {
      LogBoxData.reportLogBoxError(err);
    }
  };
} else {
  LogBox = {
    install(): void {
      // Do nothing.
    },

    uninstall(): void {
      // Do nothing.
    },

    isInstalled(): boolean {
      return false;
    },

    ignoreLogs(patterns: $ReadOnlyArray<IgnorePattern>): void {
      // Do nothing.
    },

    ignoreAllLogs(value?: ?boolean): void {
      // Do nothing.
    },

    clearAllLogs(): void {
      // Do nothing.
    },

    addLog(log: LogData): void {
      // Do nothing.
    },

    addConsoleLog(level: 'warn' | 'error', ...args: Array<mixed>): void {
      // Do nothing.
    },

    addException(error: ExtendedExceptionData): void {
      // Do nothing.
    },
  };
}

export default (LogBox: ILogBox);

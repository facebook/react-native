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

import * as React from 'react';
import Platform from '../Utilities/Platform';
import RCTLog from '../Utilities/RCTLog';
import LogBoxContainer from './UI/LogBoxContainer';
import * as LogBoxData from './Data/LogBoxData';
import {parseLogBoxLog} from './Data/parseLogBoxLog';

import type {LogBoxLogs, Subscription, IgnorePattern} from './Data/LogBoxData';

import LogBoxLog from './Data/LogBoxLog';

type Props = $ReadOnly<{||}>;
type State = {|
  logs: LogBoxLogs,
  isDisabled: boolean,
  hasError: boolean,
  selectedLogIndex: number,
|};

let LogBoxComponent;

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

  LogBoxComponent = class LogBox extends React.Component<Props, State> {
    static getDerivedStateFromError() {
      return {hasError: true};
    }

    componentDidCatch(err, errorInfo) {
      LogBoxData.reportLogBoxError(err, errorInfo.componentStack);
    }

    // TODO: deprecated, replace with ignoreLogs
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      LogBox.ignoreLogs(patterns);
    }

    static ignoreLogs(patterns: $ReadOnlyArray<IgnorePattern>): void {
      LogBoxData.addIgnorePatterns(patterns);
    }

    static install(): void {
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
    }

    static uninstall(): void {
      errorImpl = error;
      warnImpl = warn;
      delete (console: any).disableLogBox;
    }

    _subscription: ?Subscription;

    state = {
      logs: new Set(),
      isDisabled: false,
      hasError: false,
      selectedLogIndex: -1,
    };

    render(): React.Node {
      if (this.state.hasError) {
        // This happens when the component failed to render, in which case we delegate to the native redbox.
        // We can't show anyback fallback UI here, because the error may be with <View> or <Text>.
        return null;
      }

      return this.state.logs == null ? null : (
        <LogBoxContainer
          onDismiss={this._handleDismiss}
          onDismissWarns={LogBoxData.clearWarnings}
          onDismissErrors={LogBoxData.clearErrors}
          logs={this.state.logs}
          isDisabled={this.state.isDisabled}
          selectedLogIndex={this.state.selectedLogIndex}
          setSelectedLog={this._handleSetSelectedLog}
        />
      );
    }

    componentDidMount(): void {
      this._subscription = LogBoxData.observe(data => {
        this.setState(data);
      });
    }

    componentWillUnmount(): void {
      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    }

    _handleDismiss(log: LogBoxLog): void {
      LogBoxData.dismiss(log);
    }

    _handleSetSelectedLog(index: number): void {
      LogBoxData.setSelectedLog(index);
    }
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
  LogBoxComponent = class extends React.Component<Props, State> {
    // TODO: deprecated, replace with ignoreLogs
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      // Do nothing.
    }

    static ignoreLogs(patterns: $ReadOnlyArray<IgnorePattern>): void {
      // Do nothing.
    }

    static install(): void {
      // Do nothing.
    }

    static uninstall(): void {
      // Do nothing.
    }

    render(): React.Node {
      return null;
    }
  };
}

module.exports = (LogBoxComponent: Class<React.Component<Props, State>> & {
  // TODO: deprecated, replace with ignoreLogs
  ignoreWarnings($ReadOnlyArray<IgnorePattern>): void,
  ignoreLogs($ReadOnlyArray<IgnorePattern>): void,
  install(): void,
  uninstall(): void,
  ...
});

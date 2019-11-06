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
    // TODO: deprecated, replace with ignoreLogs
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      LogBox.ignoreLogs(patterns);
    }

    static ignoreLogs(patterns: $ReadOnlyArray<IgnorePattern>): void {
      LogBoxData.addIgnorePatterns(patterns);
    }

    static install(): void {
      errorImpl = function(...args) {
        error.call(console, ...args);
        // Show LogBox for the `warning` module.
        if (typeof args[0] === 'string' && args[0].startsWith('Warning: ')) {
          registerWarning(...args);
        }
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
    };

    render(): React.Node {
      // TODO: Ignore logs that fire when rendering `LogBox` itself.
      return this.state.logs == null ? null : (
        <LogBoxContainer
          onDismiss={this._handleDismiss}
          onDismissWarns={LogBoxData.clearWarnings}
          onDismissErrors={LogBoxData.clearErrors}
          logs={this.state.logs}
          isDisabled={this.state.isDisabled}
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
  };

  const registerWarning = (...args): void => {
    // This is carried over from the old YellowBox, but it is not clear why.
    if (typeof args[0] !== 'string' || !args[0].startsWith('(ADVICE)')) {
      const {category, message, componentStack} = parseLogBoxLog(args);

      if (!LogBoxData.isMessageIgnored(message.content)) {
        warn.call(console, ...args);

        LogBoxData.addLog({
          level: 'warn',
          category,
          message,
          componentStack,
        });
      }
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
});

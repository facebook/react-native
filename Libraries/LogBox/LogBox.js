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
import * as LogBoxLogData from './Data/LogBoxLogData';

import type {
  LogBoxLogs,
  Subscription,
  IgnorePattern,
} from './Data/LogBoxLogData';

import LogBoxLog from './Data/LogBoxLog';

type Props = $ReadOnly<{||}>;
type State = {|
  logs: ?LogBoxLogs,
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
      LogBoxLogData.addIgnorePatterns(patterns);
    }

    static install(): void {
      errorImpl = function(...args) {
        error.call(console, ...args);
        // Show LogBox for the `warning` module.
        if (typeof args[0] === 'string' && args[0].startsWith('Warning: ')) {
          registerLog(...args);
        }
      };

      warnImpl = function(...args) {
        warn.call(console, ...args);
        registerLog(...args);
      };

      if ((console: any).disableLogBox === true) {
        LogBoxLogData.setDisabled(true);
      }
      (Object.defineProperty: any)(console, 'disableLogBox', {
        configurable: true,
        get: () => LogBoxLogData.isDisabled(),
        set: value => LogBoxLogData.setDisabled(value),
      });

      if (Platform.isTesting) {
        (console: any).disableLogBox = true;
      }

      RCTLog.setWarningHandler((...args) => {
        registerLog(...args);
      });
    }

    static uninstall(): void {
      errorImpl = error;
      warnImpl = warn;
      delete (console: any).disableLogBox;
    }

    _subscription: ?Subscription;

    state = {
      logs: null,
    };

    render(): React.Node {
      // TODO: Ignore logs that fire when rendering `LogBox` itself.
      return this.state.logs == null ? null : (
        <LogBoxContainer
          onDismiss={this._handleDismiss}
          onDismissAll={this._handleDismissAll}
          logs={this.state.logs}
        />
      );
    }

    componentDidMount(): void {
      this._subscription = LogBoxLogData.observe(logs => {
        this.setState({logs});
      });
    }

    componentWillUnmount(): void {
      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    }

    _handleDismissAll(): void {
      LogBoxLogData.clear();
    }

    _handleDismiss(log: LogBoxLog): void {
      LogBoxLogData.dismiss(log);
    }
  };

  const registerLog = (...args): void => {
    LogBoxLogData.add({args});
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

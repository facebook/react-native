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

const React = require('react');

import type {Registry, IgnorePattern} from './Data/YellowBoxRegistry';
import * as LogBoxData from '../LogBox/Data/LogBoxData';
import NativeLogBox from '../NativeModules/specs/NativeLogBox';

type Props = $ReadOnly<{||}>;
type State = {|
  registry: ?Registry,
|};

let YellowBox;

/**
 * YellowBox displays warnings at the bottom of the screen.
 *
 * Warnings help guard against subtle yet significant issues that can impact the
 * quality of the app. This "in your face" style of warning allows developers to
 * notice and correct these issues as quickly as possible.
 *
 * YellowBox is only enabled in `__DEV__`. Set the following flag to disable it:
 *
 *   console.disableYellowBox = true;
 *
 * Ignore specific warnings by calling:
 *
 *   YellowBox.ignoreWarnings(['Warning: ...']);
 *
 * Strings supplied to `YellowBox.ignoreWarnings` only need to be a substring of
 * the ignored warning messages.
 */
if (__DEV__) {
  const Platform = require('../Utilities/Platform');
  const RCTLog = require('../Utilities/RCTLog');
  const YellowBoxContainer = require('./YellowBoxContainer').default;
  const LogBox = require('../LogBox/LogBox');
  const YellowBoxRegistry = require('./Data/YellowBoxRegistry');
  const LogBoxNotificationContainer = require('../LogBox/LogBoxNotificationContainer')
    .default;

  // YellowBox needs to insert itself early,
  // in order to access the component stacks appended by React DevTools.
  const {error, warn} = console;
  let errorImpl = error;
  let warnImpl = warn;
  let _isLogBoxEnabled = false;
  let _isInstalled = false;
  (console: any).error = function(...args) {
    errorImpl(...args);
  };
  (console: any).warn = function(...args) {
    warnImpl(...args);
  };

  // eslint-disable-next-line no-shadow
  YellowBox = class YellowBox extends React.Component<Props, State> {
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      LogBoxData.addIgnorePatterns(patterns);
      YellowBoxRegistry.addIgnorePatterns(patterns);
    }

    static install(): void {
      _isInstalled = true;
      if (_isLogBoxEnabled) {
        LogBox.install();
        return;
      }
      errorImpl = function(...args) {
        error.call(console, ...args);
        // Show YellowBox for the `warning` module.
        if (typeof args[0] === 'string' && args[0].startsWith('Warning: ')) {
          registerWarning(...args);
        }
      };

      warnImpl = function(...args) {
        warn.call(console, ...args);
        registerWarning(...args);
      };

      if ((console: any).disableYellowBox === true) {
        YellowBoxRegistry.setDisabled(true);
      }
      (Object.defineProperty: any)(console, 'disableYellowBox', {
        configurable: true,
        get: () => YellowBoxRegistry.isDisabled(),
        set: value => YellowBoxRegistry.setDisabled(value),
      });

      if (Platform.isTesting) {
        (console: any).disableYellowBox = true;
      }

      RCTLog.setWarningHandler((...args) => {
        registerWarning(...args);
      });
    }

    static uninstall(): void {
      if (_isLogBoxEnabled) {
        LogBox.uninstall();
        return;
      }
      _isInstalled = false;
      errorImpl = error;
      warnImpl = warn;
      delete (console: any).disableYellowBox;
    }

    static __unstable_enableLogBox(): void {
      if (NativeLogBox == null) {
        // The native module is required to enable LogBox.
        return;
      }

      if (_isInstalled) {
        throw new Error(
          'LogBox must be enabled before AppContainer is required so that it can properly wrap the console methods.\n\nPlease enable LogBox earlier in your app.\n\n',
        );
      }
      _isLogBoxEnabled = true;

      // TODO: Temporary hack to prevent cycles with the ExceptionManager.
      global.__unstable_isLogBoxEnabled = true;
    }

    static __unstable_isLogBoxEnabled(): boolean {
      return !!_isLogBoxEnabled;
    }

    render(): React.Node {
      if (_isLogBoxEnabled) {
        return <LogBoxNotificationContainer />;
      }

      // TODO: Ignore warnings that fire when rendering `YellowBox` itself.
      return <YellowBoxContainer />;
    }
  };

  const registerWarning = (...args): void => {
    YellowBoxRegistry.add({args});
  };
} else {
  YellowBox = class extends React.Component<Props, State> {
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      // Do nothing.
    }

    static install(): void {
      // Do nothing.
    }

    static uninstall(): void {
      // Do nothing.
    }

    static __unstable_enableLogBox(): void {
      // Do nothing.
    }
    static __unstable_isLogBoxEnabled(): boolean {
      return false;
    }

    render(): React.Node {
      return null;
    }
  };
}

module.exports = (YellowBox: Class<React.Component<Props, State>> & {
  ignoreWarnings($ReadOnlyArray<IgnorePattern>): void,
  install(): void,
  uninstall(): void,
  __unstable_enableLogBox(): void,
  __unstable_isLogBoxEnabled(): boolean,
  ...
});

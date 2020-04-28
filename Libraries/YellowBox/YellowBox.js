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

import type {Category} from './Data/YellowBoxCategory';
import type {
  Registry,
  Subscription,
  IgnorePattern,
} from './Data/YellowBoxRegistry';

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
  const YellowBoxList = require('./UI/YellowBoxList');
  const YellowBoxRegistry = require('./Data/YellowBoxRegistry');

  const {error, warn} = console;

  // eslint-disable-next-line no-shadow
  YellowBox = class YellowBox extends React.Component<Props, State> {
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      YellowBoxRegistry.addIgnorePatterns(patterns);
    }

    static install(): void {
      (console: any).error = function(...args) {
        error.call(console, ...args);
        // Show YellowBox for the `warning` module.
        if (typeof args[0] === 'string' && args[0].startsWith('Warning: ')) {
          registerWarning(...args);
        }
      };

      (console: any).warn = function(...args) {
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
      (console: any).error = error;
      (console: any).warn = error;
      delete (console: any).disableYellowBox;
    }

    _subscription: ?Subscription;

    state = {
      registry: null,
    };

    render(): React.Node {
      // TODO: Ignore warnings that fire when rendering `YellowBox` itself.
      return this.state.registry == null ? null : (
        <YellowBoxList
          onDismiss={this._handleDismiss}
          onDismissAll={this._handleDismissAll}
          registry={this.state.registry}
        />
      );
    }

    componentDidMount(): void {
      this._subscription = YellowBoxRegistry.observe(registry => {
        this.setState({registry});
      });
    }

    componentWillUnmount(): void {
      if (this._subscription != null) {
        this._subscription.unsubscribe();
      }
    }

    _handleDismiss = (category: Category): void => {
      YellowBoxRegistry.delete(category);
    };

    _handleDismissAll(): void {
      YellowBoxRegistry.clear();
    }
  };

  const registerWarning = (...args): void => {
    YellowBoxRegistry.add({args, framesToPop: 2});
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

    render(): React.Node {
      return null;
    }
  };
}

module.exports = (YellowBox: Class<React.Component<Props, State>> & {
  ignoreWarnings($ReadOnlyArray<IgnorePattern>): void,
  install(): void,
  uninstall(): void,
});

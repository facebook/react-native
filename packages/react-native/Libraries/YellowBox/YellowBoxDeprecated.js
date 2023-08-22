/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {IgnorePattern} from '../LogBox/Data/LogBoxData';

const LogBox = require('../LogBox/LogBox').default;
const React = require('react');

type Props = $ReadOnly<{||}>;

let YellowBox;
if (__DEV__) {
  YellowBox = class extends React.Component<Props> {
    static ignoreWarnings(patterns: $ReadOnlyArray<IgnorePattern>): void {
      console.warn(
        'YellowBox has been replaced with LogBox. Please call LogBox.ignoreLogs() instead.',
      );

      LogBox.ignoreLogs(patterns);
    }

    static install(): void {
      console.warn(
        'YellowBox has been replaced with LogBox. Please call LogBox.install() instead.',
      );
      LogBox.install();
    }

    static uninstall(): void {
      console.warn(
        'YellowBox has been replaced with LogBox. Please call LogBox.uninstall() instead.',
      );
      LogBox.uninstall();
    }

    render(): React.Node {
      return null;
    }
  };
} else {
  YellowBox = class extends React.Component<Props> {
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

// $FlowFixMe[method-unbinding]
module.exports = (YellowBox: Class<React.Component<Props>> & {
  ignoreWarnings($ReadOnlyArray<IgnorePattern>): void,
  install(): void,
  uninstall(): void,
  ...
});

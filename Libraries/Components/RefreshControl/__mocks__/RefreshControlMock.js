/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('React');

const requireNativeComponent = require('requireNativeComponent');

const RCTRefreshControl = requireNativeComponent('RCTRefreshControl');

class RefreshControlMock extends React.Component<{}> {
  static latestRef: ?RefreshControlMock;
  componentDidMount() {
    RefreshControlMock.latestRef = this;
  }
  render() {
    return <RCTRefreshControl />;
  }
}

module.exports = RefreshControlMock;

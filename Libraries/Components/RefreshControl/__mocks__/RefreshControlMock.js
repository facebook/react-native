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

const React = require('react');

const requireNativeComponent = require('../../../ReactNative/requireNativeComponent');

import type {HostComponent} from '../../../Renderer/shims/ReactNativeTypes';

const RCTRefreshControl: HostComponent<mixed> = requireNativeComponent<mixed>(
  'RCTRefreshControl',
);

class RefreshControlMock extends React.Component<{...}> {
  static latestRef: ?RefreshControlMock;
  componentDidMount() {
    RefreshControlMock.latestRef = this;
  }
  render(): React.Element<typeof RCTRefreshControl> {
    return <RCTRefreshControl />;
  }
}

module.exports = RefreshControlMock;

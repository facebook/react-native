/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RefreshControlProps} from '../../Libraries/Components/RefreshControl/RefreshControl';
import type {HostComponent} from '../../src/private/types/HostComponent';

import requireNativeComponent from '../../Libraries/ReactNative/requireNativeComponent';
import * as React from 'react';

const RCTRefreshControl: HostComponent<{}> = requireNativeComponent<{}>(
  'RCTRefreshControl',
);

export default class RefreshControlMock extends React.Component<RefreshControlProps> {
  static latestRef: ?RefreshControlMock;

  render(): React.Node {
    return <RCTRefreshControl />;
  }

  componentDidMount() {
    RefreshControlMock.latestRef = this;
  }
}

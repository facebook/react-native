/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {HostComponent} from '../../../../src/private/types/HostComponent';

import requireNativeComponent from '../../../ReactNative/requireNativeComponent';
import * as React from 'react';

const RCTRefreshControl: HostComponent<{}> = requireNativeComponent<{}>(
  'RCTRefreshControl',
);

class RefreshControlMock extends React.Component<{...}> {
  static latestRef: ?RefreshControlMock;
  componentDidMount() {
    RefreshControlMock.latestRef = this;
  }
  render(): React.MixedElement {
    return <RCTRefreshControl />;
  }
}

module.exports = RefreshControlMock;

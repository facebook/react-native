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

const {requireNativeComponent} = require('react-native');

import type {HostComponent} from 'react-native/Libraries/Renderer/shims/ReactNativeTypes';
import type {SyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';

type SnapshotReadyEvent = SyntheticEvent<
  $ReadOnly<{testIdentifier: string, ...}>,
>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  onSnapshotReady?: ?(event: SnapshotReadyEvent) => mixed,
  testIdentifier?: ?string,
|}>;

const RCTSnapshotNativeComponent: HostComponent<NativeProps> =
  requireNativeComponent<NativeProps>('RCTSnapshot');

module.exports = RCTSnapshotNativeComponent;

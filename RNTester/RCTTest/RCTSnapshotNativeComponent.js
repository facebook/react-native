/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const {requireNativeComponent} = require('react-native');

import type {SyntheticEvent} from '../../Libraries/Types/CoreEventTypes';
import type {ViewProps} from '../../Libraries/Components/View/ViewPropTypes';
import type {NativeComponent} from '../../Libraries/Renderer/shims/ReactNative';

type SnapshotReadyEvent = SyntheticEvent<
  $ReadOnly<{
    testIdentifier: string,
  }>,
>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  onSnapshotReady?: ?(event: SnapshotReadyEvent) => mixed,
  testIdentifier?: ?string,
|}>;

type SnapshotViewNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTSnapshot',
): any): SnapshotViewNativeType);

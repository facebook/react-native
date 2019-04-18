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

import type {SyntheticEvent} from 'CoreEventTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {NativeComponent} from 'ReactNative';

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

const requireNativeComponent = require('requireNativeComponent');

module.exports = ((requireNativeComponent('RCTSnapshot'):any): SnapshotViewNativeType);

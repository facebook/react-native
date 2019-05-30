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

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {NativeComponent} from '../../Renderer/shims/ReactNative';

type PickerIOSChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    newValue: number | string,
    newIndex: number,
  |}>,
>;

type RCTPickerIOSItemType = $ReadOnly<{|
  label: ?Label,
  value: ?(number | string),
  textColor: ?number,
|}>;

type Label = Stringish | number;

type RCTPickerIOSType = Class<
  NativeComponent<
    $ReadOnly<{|
      items: $ReadOnlyArray<RCTPickerIOSItemType>,
      onChange: (event: PickerIOSChangeEvent) => void,
      onResponderTerminationRequest: () => boolean,
      onStartShouldSetResponder: () => boolean,
      selectedIndex: number,
      style?: ?TextStyleProp,
      testID?: ?string,
    |}>,
  >,
>;

module.exports = ((requireNativeComponent('RCTPicker'): any): RCTPickerIOSType);

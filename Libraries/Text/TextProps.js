/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TextProps
 * @flow
 * @format
 */

'use strict';

import type {Node} from 'react';

import type {LayoutEvent, PressEvent} from 'CoreEventTypes';
import type {DangerouslyImpreciseStyleProp} from 'StyleSheet';

type PressRetentionOffset = {
  top: number,
  left: number,
  bottom: number,
  right: number,
};

/**
 * @see https://facebook.github.io/react-native/docs/text.html#reference
 */
export type TextProps = $ReadOnly<{
  accessible?: ?boolean,
  allowFontScaling?: ?boolean,
  children?: Node,
  ellipsizeMode?: 'clip' | 'head' | 'middle' | 'tail',
  nativeID?: string,
  numberOfLines?: ?number,
  onLayout?: ?(event: LayoutEvent) => mixed,
  onLongPress?: ?(event: PressEvent) => mixed,
  onPress?: ?(event: PressEvent) => mixed,
  onResponderGrant?: ?Function,
  onResponderMove?: ?Function,
  onResponderRelease?: ?Function,
  onResponderTerminate?: ?Function,
  onResponderTerminationRequest?: ?Function,
  onStartShouldSetResponder?: ?Function,
  pressRetentionOffset?: ?PressRetentionOffset,
  selectable?: ?boolean,
  style?: ?DangerouslyImpreciseStyleProp,
  testID?: string,

  // Android Only
  disabled?: ?boolean,
  selectionColor?: ?string,
  textBreakStrategy?: 'balanced' | 'highQuality' | 'simple',

  // iOS Only
  adjustsFontSizeToFit?: ?boolean,
  minimumFontScale?: ?number,
  suppressHighlighting?: ?boolean,
}>;

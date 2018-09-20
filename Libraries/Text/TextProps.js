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

import type {LayoutEvent, PressEvent, TextLayoutEvent} from 'CoreEventTypes';
import type React from 'React';
import type {DangerouslyImpreciseStyleProp} from 'StyleSheet';
import type {
  AccessibilityRole,
  AccessibilityStates,
  AccessibilityTrait,
} from 'ViewAccessibility';

export type PressRetentionOffset = $ReadOnly<{|
  top: number,
  left: number,
  bottom: number,
  right: number,
|}>;

/**
 * @see https://facebook.github.io/react-native/docs/text.html#reference
 */
export type TextProps = $ReadOnly<{
  accessible?: ?boolean,
  accessibilityRole?: ?AccessibilityRole,
  accessibilityStates?: ?AccessibilityStates,
  accessibilityTraits?: ?(AccessibilityTrait | Array<AccessibilityTrait>),
  allowFontScaling?: ?boolean,
  children?: ?React.Node,
  ellipsizeMode?: ?('clip' | 'head' | 'middle' | 'tail'),
  nativeID?: ?string,
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
  onTextLayout?: ?(event: TextLayoutEvent) => mixed,
  pressRetentionOffset?: ?PressRetentionOffset,
  selectable?: ?boolean,
  style?: ?DangerouslyImpreciseStyleProp,
  testID?: ?string,

  // Android Only
  disabled?: ?boolean,
  selectionColor?: ?string,
  textBreakStrategy?: ?('balanced' | 'highQuality' | 'simple'),

  // iOS Only
  adjustsFontSizeToFit?: ?boolean,
  minimumFontScale?: ?number,
  suppressHighlighting?: ?boolean,
}>;

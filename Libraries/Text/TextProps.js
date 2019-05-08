/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  LayoutEvent,
  PressEvent,
  TextLayoutEvent,
} from '../Types/CoreEventTypes';
import type {Node} from 'react';
import type {TextStyleProp} from '../StyleSheet/StyleSheet';
import type {
  AccessibilityRole,
  AccessibilityStates,
} from '../Components/View/ViewAccessibility';

export type PressRetentionOffset = $ReadOnly<{|
  top: number,
  left: number,
  bottom: number,
  right: number,
|}>;

/**
 * @see https://facebook.github.io/react-native/docs/text.html#reference
 */
export type TextProps = $ReadOnly<{|
  /**
   * Indicates whether the view is an accessibility element.
   *
   * See https://facebook.github.io/react-native/docs/text.html#accessible
   */
  accessible?: ?boolean,
  accessibilityHint?: ?Stringish,
  accessibilityLabel?: ?Stringish,
  accessibilityRole?: ?AccessibilityRole,
  accessibilityStates?: ?AccessibilityStates,

  /**
   * Whether font should be scaled down automatically.
   *
   * See https://facebook.github.io/react-native/docs/text.html#adjustsfontsizetofit
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
   * Whether fonts should scale to respect Text Size accessibility settings.
   *
   * See https://facebook.github.io/react-native/docs/text.html#allowfontscaling
   */
  allowFontScaling?: ?boolean,
  children?: ?Node,

  /**
   * When `numberOfLines` is set, this prop defines how text will be
   * truncated.
   *
   * See https://facebook.github.io/react-native/docs/text.html#ellipsizemode
   */
  ellipsizeMode?: ?('clip' | 'head' | 'middle' | 'tail'),

  /**
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier?: ?number,

  /**
   * Used to locate this view from native code.
   *
   * See https://facebook.github.io/react-native/docs/text.html#nativeid
   */
  nativeID?: ?string,

  /**
   * Used to truncate the text with an ellipsis.
   *
   * See https://facebook.github.io/react-native/docs/text.html#numberoflines
   */
  numberOfLines?: ?number,

  /**
   * Invoked on mount and layout changes.
   *
   * See https://facebook.github.io/react-native/docs/text.html#onlayout
   */
  onLayout?: ?(event: LayoutEvent) => mixed,

  /**
   * This function is called on long press.
   *
   * See https://facebook.github.io/react-native/docs/text.html#onlongpress
   */
  onLongPress?: ?(event: PressEvent) => mixed,

  /**
   * This function is called on press.
   *
   * See https://facebook.github.io/react-native/docs/text.html#onpress
   */
  onPress?: ?(event: PressEvent) => mixed,
  onResponderGrant?: ?(event: PressEvent, dispatchID: string) => void,
  onResponderMove?: ?(event: PressEvent) => void,
  onResponderRelease?: ?(event: PressEvent) => void,
  onResponderTerminate?: ?(event: PressEvent) => void,
  onResponderTerminationRequest?: ?() => boolean,
  onStartShouldSetResponder?: ?() => boolean,
  onMoveShouldSetResponder?: ?() => boolean,
  onTextLayout?: ?(event: TextLayoutEvent) => mixed,

  /**
   * Defines how far your touch may move off of the button, before
   * deactivating the button.
   *
   * See https://facebook.github.io/react-native/docs/text.html#pressretentionoffset
   */
  pressRetentionOffset?: ?PressRetentionOffset,

  /**
   * Lets the user select text.
   *
   * See https://facebook.github.io/react-native/docs/text.html#selectable
   */
  selectable?: ?boolean,
  style?: ?TextStyleProp,

  /**
   * Used to locate this view in end-to-end tests.
   *
   * See https://facebook.github.io/react-native/docs/text.html#testid
   */
  testID?: ?string,

  /**
   * Android Only
   */

  /**
   * Specifies the disabled state of the text view for testing purposes.
   *
   * See https://facebook.github.io/react-native/docs/text.html#disabled
   */
  disabled?: ?boolean,

  /**
   * The highlight color of the text.
   *
   * See https://facebook.github.io/react-native/docs/text.html#selectioncolor
   */
  selectionColor?: ?string,

  dataDetectorType?: ?('phoneNumber' | 'link' | 'email' | 'none' | 'all'),

  /**
   * Set text break strategy on Android.
   *
   * See https://facebook.github.io/react-native/docs/text.html#textbreakstrategy
   */
  textBreakStrategy?: ?('balanced' | 'highQuality' | 'simple'),

  /**
   * iOS Only
   */
  adjustsFontSizeToFit?: ?boolean,

  /**
   * Smallest possible scale a font can reach.
   *
   * See https://facebook.github.io/react-native/docs/text.html#minimumfontscale
   */
  minimumFontScale?: ?number,

  /**
   * When `true`, no visual change is made when text is pressed down.
   *
   * See https://facebook.github.io/react-native/docs/text.html#supperhighlighting
   */
  suppressHighlighting?: ?boolean,
|}>;

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

const DeprecatedColorPropType = require('./DeprecatedColorPropType');
const DeprecatedEdgeInsetsPropType = require('./DeprecatedEdgeInsetsPropType');
const DeprecatedStyleSheetPropType = require('./DeprecatedStyleSheetPropType');
const PropTypes = require('prop-types');
const DeprecatedTextStylePropTypes = require('./DeprecatedTextStylePropTypes');

const stylePropType: ReactPropsCheckType = DeprecatedStyleSheetPropType(
  DeprecatedTextStylePropTypes,
);

const DataDetectorTypes = ['phoneNumber', 'link', 'email', 'none', 'all'];

module.exports = {
  /**
   * When `numberOfLines` is set, this prop defines how text will be
   * truncated.
   *
   * See https://reactnative.dev/docs/text.html#ellipsizemode
   */
  ellipsizeMode: (PropTypes.oneOf([
    'head',
    'middle',
    'tail',
    'clip',
  ]): React$PropType$Primitive<'head' | 'middle' | 'tail' | 'clip'>),
  /**
   * Used to truncate the text with an ellipsis.
   *
   * See https://reactnative.dev/docs/text.html#numberoflines
   */
  numberOfLines: PropTypes.number,
  /**
   * Set text break strategy on Android.
   *
   * See https://reactnative.dev/docs/text.html#textbreakstrategy
   */
  textBreakStrategy: (PropTypes.oneOf([
    'simple',
    'highQuality',
    'balanced',
  ]): React$PropType$Primitive<'simple' | 'highQuality' | 'balanced'>),
  /**
   * Invoked on mount and layout changes.
   *
   * See https://reactnative.dev/docs/text.html#onlayout
   */
  onLayout: PropTypes.func,
  /**
   * This function is called on press.
   *
   * See https://reactnative.dev/docs/text.html#onpress
   */
  onPress: PropTypes.func,
  /**
   * This function is called on long press.
   *
   * See https://reactnative.dev/docs/text.html#onlongpress
   */
  onLongPress: PropTypes.func,
  /**
   * Defines how far your touch may move off of the button, before
   * deactivating the button.
   *
   * See https://reactnative.dev/docs/text.html#pressretentionoffset
   */
  pressRetentionOffset: DeprecatedEdgeInsetsPropType,
  /**
   * Lets the user select text.
   *
   * See https://reactnative.dev/docs/text.html#selectable
   */
  selectable: PropTypes.bool,
  /**
   * The highlight color of the text.
   *
   * See https://reactnative.dev/docs/text.html#selectioncolor
   */
  selectionColor: DeprecatedColorPropType,
  /**
   * When `true`, no visual change is made when text is pressed down.
   *
   * See https://reactnative.dev/docs/text.html#supperhighlighting
   */
  suppressHighlighting: PropTypes.bool,
  style: stylePropType,
  /**
   * Used to locate this view in end-to-end tests.
   *
   * See https://reactnative.dev/docs/text.html#testid
   */
  testID: PropTypes.string,
  /**
   * Used to locate this view from native code.
   *
   * See https://reactnative.dev/docs/text.html#nativeid
   */
  nativeID: PropTypes.string,
  /**
   * Whether fonts should scale to respect Text Size accessibility settings.
   *
   * See https://reactnative.dev/docs/text.html#allowfontscaling
   */
  allowFontScaling: PropTypes.bool,
  /**
   * Specifies largest possible scale a font can reach when `allowFontScaling` is enabled.
   * Possible values:
   * `null/undefined` (default): inherit from the parent node or the global default (0)
   * `0`: no max, ignore parent/global default
   * `>= 1`: sets the maxFontSizeMultiplier of this node to this value
   */
  maxFontSizeMultiplier: PropTypes.number,
  /**
   * Indicates whether the view is an accessibility element.
   *
   * See https://reactnative.dev/docs/text.html#accessible
   */
  accessible: PropTypes.bool,
  /**
   * Whether font should be scaled down automatically.
   *
   * See https://reactnative.dev/docs/text.html#adjustsfontsizetofit
   */
  adjustsFontSizeToFit: PropTypes.bool,
  /**
   * Smallest possible scale a font can reach.
   *
   * See https://reactnative.dev/docs/text.html#minimumfontscale
   */
  minimumFontScale: PropTypes.number,
  /**
   * Specifies the disabled state of the text view for testing purposes.
   *
   * See https://reactnative.dev/docs/text.html#disabled
   */
  disabled: PropTypes.bool,
  /**
   * Determines the types of data converted to clickable URLs in text.
   *
   * See https://reactnative.dev/docs/text.html#dataDetectorType
   */
  dataDetectorType: (PropTypes.oneOf(
    DataDetectorTypes,
  ): React$PropType$Primitive<
    'phoneNumber' | 'link' | 'email' | 'none' | 'all',
  >),
};

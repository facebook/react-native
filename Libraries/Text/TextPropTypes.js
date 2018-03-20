/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TextPropTypes
 * @flow
 * @format
 */

'use strict';

const ColorPropType = require('ColorPropType');
const EdgeInsetsPropType = require('EdgeInsetsPropType');
const PropTypes = require('prop-types');
const StyleSheetPropType = require('StyleSheetPropType');
const TextStylePropTypes = require('TextStylePropTypes');

const stylePropType = StyleSheetPropType(TextStylePropTypes);

module.exports = {
  /**
   * When `numberOfLines` is set, this prop defines how text will be
   * truncated.
   *
   * See https://facebook.github.io/react-native/docs/text.html#ellipsizemode
   */
  ellipsizeMode: PropTypes.oneOf(['head', 'middle', 'tail', 'clip']),
  /**
   * Used to truncate the text with an ellipsis.
   *
   * See https://facebook.github.io/react-native/docs/text.html#numberoflines
   */
  numberOfLines: PropTypes.number,
  /**
   * Set text break strategy on Android.
   *
   * See https://facebook.github.io/react-native/docs/text.html#textbreakstrategy
   */
  textBreakStrategy: PropTypes.oneOf(['simple', 'highQuality', 'balanced']),
  /**
   * Invoked on mount and layout changes.
   *
   * See https://facebook.github.io/react-native/docs/text.html#onlayout
   */
  onLayout: PropTypes.func,
  /**
   * This function is called on press.
   *
   * See https://facebook.github.io/react-native/docs/text.html#onpress
   */
  onPress: PropTypes.func,
  /**
   * This function is called on long press.
   *
   * See https://facebook.github.io/react-native/docs/text.html#onlongpress
   */
  onLongPress: PropTypes.func,
  /**
   * Defines how far your touch may move off of the button, before
   * deactivating the button.
   *
   * See https://facebook.github.io/react-native/docs/text.html#pressretentionoffset
   */
  pressRetentionOffset: EdgeInsetsPropType,
  /**
   * Lets the user select text.
   *
   * See https://facebook.github.io/react-native/docs/text.html#selectable
   */
  selectable: PropTypes.bool,
  /**
   * The highlight color of the text.
   *
   * See https://facebook.github.io/react-native/docs/text.html#selectioncolor
   */
  selectionColor: ColorPropType,
  /**
   * When `true`, no visual change is made when text is pressed down.
   *
   * See https://facebook.github.io/react-native/docs/text.html#supperhighlighting
   */
  suppressHighlighting: PropTypes.bool,
  style: stylePropType,
  /**
   * Used to locate this view in end-to-end tests.
   *
   * See https://facebook.github.io/react-native/docs/text.html#testid
   */
  testID: PropTypes.string,
  /**
   * Used to locate this view from native code.
   *
   * See https://facebook.github.io/react-native/docs/text.html#nativeid
   */
  nativeID: PropTypes.string,
  /**
   * Whether fonts should scale to respect Text Size accessibility settings.
   *
   * See https://facebook.github.io/react-native/docs/text.html#allowfontscaling
   */
  allowFontScaling: PropTypes.bool,
  /**
   * Indicates whether the view is an accessibility element.
   *
   * See https://facebook.github.io/react-native/docs/text.html#accessible
   */
  accessible: PropTypes.bool,
  /**
   * Whether font should be scaled down automatically.
   *
   * See https://facebook.github.io/react-native/docs/text.html#adjustsfontsizetofit
   */
  adjustsFontSizeToFit: PropTypes.bool,
  /**
   * Smallest possible scale a font can reach.
   *
   * See https://facebook.github.io/react-native/docs/text.html#minimumfontscale
   */
  minimumFontScale: PropTypes.number,
  /**
   * Specifies the disabled state of the text view for testing purposes.
   *
   * See https://facebook.github.io/react-native/docs/text.html#disabled
   */
  disabled: PropTypes.bool,
};

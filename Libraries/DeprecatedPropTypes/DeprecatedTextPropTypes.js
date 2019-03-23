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

const DeprecatedColorPropType = require('DeprecatedColorPropType');
const DeprecatedEdgeInsetsPropType = require('DeprecatedEdgeInsetsPropType');
const DeprecatedStyleSheetPropType = require('DeprecatedStyleSheetPropType');
const PropTypes = require('prop-types');
const TextStylePropTypes = require('TextStylePropTypes');

const stylePropType = DeprecatedStyleSheetPropType(TextStylePropTypes);

module.exports = {
  ellipsizeMode: PropTypes.oneOf(['head', 'middle', 'tail', 'clip']),
  numberOfLines: PropTypes.number,
  textBreakStrategy: PropTypes.oneOf(['simple', 'highQuality', 'balanced']),
  onLayout: PropTypes.func,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  pressRetentionOffset: DeprecatedEdgeInsetsPropType,
  selectable: PropTypes.bool,
  selectionColor: DeprecatedColorPropType,
  suppressHighlighting: PropTypes.bool,
  style: stylePropType,
  testID: PropTypes.string,
  nativeID: PropTypes.string,
  allowFontScaling: PropTypes.bool,
  maxFontSizeMultiplier: PropTypes.number,
  accessible: PropTypes.bool,
  adjustsFontSizeToFit: PropTypes.bool,
  minimumFontScale: PropTypes.number,
  disabled: PropTypes.bool,
};

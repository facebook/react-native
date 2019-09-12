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

const DeprecatedEdgeInsetsPropType = require('./DeprecatedEdgeInsetsPropType');
const DeprecatedImageSourcePropType = require('./DeprecatedImageSourcePropType');
const DeprecatedImageStylePropTypes = require('./DeprecatedImageStylePropTypes');
const DeprecatedStyleSheetPropType = require('./DeprecatedStyleSheetPropType');
const PropTypes = require('prop-types');

module.exports = {
  style: (DeprecatedStyleSheetPropType(
    DeprecatedImageStylePropTypes,
  ): ReactPropsCheckType),
  source: DeprecatedImageSourcePropType,
  defaultSource: (PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
      scale: PropTypes.number,
    }),
    PropTypes.number,
  ]): React$PropType$Primitive<
    {height?: number, scale?: number, uri?: string, width?: number} | number,
  >),

  accessible: PropTypes.bool,

  accessibilityLabel: PropTypes.node,

  blurRadius: PropTypes.number,

  capInsets: DeprecatedEdgeInsetsPropType,

  resizeMethod: (PropTypes.oneOf([
    'auto',
    'resize',
    'scale',
  ]): React$PropType$Primitive<'auto' | 'resize' | 'scale'>),

  resizeMode: (PropTypes.oneOf([
    'cover',
    'contain',
    'stretch',
    'repeat',
    'center',
  ]): React$PropType$Primitive<
    'cover' | 'contain' | 'stretch' | 'repeat' | 'center',
  >),

  testID: PropTypes.string,

  onLayout: PropTypes.func,

  onLoadStart: PropTypes.func,

  onProgress: PropTypes.func,

  onError: PropTypes.func,

  onPartialLoad: PropTypes.func,

  onLoad: PropTypes.func,

  onLoadEnd: PropTypes.func,
};

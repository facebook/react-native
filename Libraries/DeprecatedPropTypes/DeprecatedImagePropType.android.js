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

const DeprecatedImageStylePropTypes = require('./DeprecatedImageStylePropTypes');
const DeprecatedStyleSheetPropType = require('./DeprecatedStyleSheetPropType');
const DeprecatedViewPropTypes = require('./DeprecatedViewPropTypes');
const PropTypes = require('prop-types');

const DeprecatedImagePropType = {
  ...DeprecatedViewPropTypes,
  style: (DeprecatedStyleSheetPropType(
    DeprecatedImageStylePropTypes,
  ): ReactPropsCheckType),
  /**
   * See https://reactnative.dev/docs/image.html#source
   */
  source: (PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
      headers: PropTypes.objectOf(PropTypes.string),
    }),
    // Opaque type returned by require('./image.jpg')
    PropTypes.number,
    // Multiple sources
    PropTypes.arrayOf(
      PropTypes.shape({
        uri: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
        headers: PropTypes.objectOf(PropTypes.string),
      }),
    ),
  ]): React$PropType$Primitive<
    | {
        headers?: {[string]: string, ...},
        uri?: string,
        ...
      }
    | number
    | Array<{
        headers?: {[string]: string, ...},
        height?: number,
        uri?: string,
        width?: number,
        ...
      }>,
  >),
  /**
   * blurRadius: the blur radius of the blur filter added to the image
   *
   * See https://reactnative.dev/docs/image.html#blurradius
   */
  blurRadius: PropTypes.number,
  /**
   * See https://reactnative.dev/docs/image.html#defaultsource
   */
  defaultSource: PropTypes.number,
  /**
   * See https://reactnative.dev/docs/image.html#loadingindicatorsource
   */
  loadingIndicatorSource: (PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
    }),
    // Opaque type returned by require('./image.jpg')
    PropTypes.number,
  ]): React$PropType$Primitive<{uri?: string, ...} | number>),
  progressiveRenderingEnabled: PropTypes.bool,
  fadeDuration: PropTypes.number,
  /**
   * Analytics Tag used by this Image
   */
  internal_analyticTag: PropTypes.string,
  /**
   * Invoked on load start
   */
  onLoadStart: PropTypes.func,
  /**
   * Invoked on load error
   */
  onError: PropTypes.func,
  /**
   * Invoked when load completes successfully
   */
  onLoad: PropTypes.func,
  /**
   * Invoked when load either succeeds or fails
   */
  onLoadEnd: PropTypes.func,
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID: PropTypes.string,
  /**
   * The mechanism that should be used to resize the image when the image's dimensions
   * differ from the image view's dimensions. Defaults to `auto`.
   *
   * See https://reactnative.dev/docs/image.html#resizemethod
   */
  resizeMethod: (PropTypes.oneOf([
    'auto',
    'resize',
    'scale',
  ]): React$PropType$Primitive<'auto' | 'resize' | 'scale'>),
  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * See https://reactnative.dev/docs/image.html#resizemode
   */
  resizeMode: (PropTypes.oneOf([
    'cover',
    'contain',
    'stretch',
    'repeat',
    'center',
  ]): React$PropType$Primitive<
    'cover' | 'contain' | 'stretch' | 'repeat' | 'center',
  >),
};

module.exports = DeprecatedImagePropType;

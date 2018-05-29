/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const EdgeInsetsPropType = require('EdgeInsetsPropType');
const ImageSourcePropType = require('ImageSourcePropType');
const ImageStylePropTypes = require('ImageStylePropTypes');
const PropTypes = require('prop-types');
const StyleSheetPropType = require('StyleSheetPropType');

import type {ImageSource} from 'ImageSource';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {LayoutEvent, SyntheticEvent} from 'CoreEventTypes';
import type {ImageStyleProp} from 'StyleSheet';

export type ImageProps = {
  accessible?: boolean,
  accessibilityLabel?: ?(string | Array<any> | any),
  blurRadius?: number,
  capInsets?: ?EdgeInsetsProp,

  onError?: ?(event: SyntheticEvent<$ReadOnly<{||}>>) => void,
  onLayout?: ?(event: LayoutEvent) => void,
  onLoad?: ?() => void,
  onLoadEnd?: ?() => void,
  onLoadStart?: ?() => void,
  resizeMethod?: ?('auto' | 'resize' | 'scale'),
  resizeMode?: ?('cover' | 'contain' | 'stretch' | 'repeat' | 'center'),
  source?: ?ImageSource,
  style?: ImageStyleProp,
  testID?: ?string,

  // ios
  defaultSource?: ?ImageSource,
  onPartialLoad?: ?() => void,
  onProgress?: ?(
    event: SyntheticEvent<$ReadOnly<{|loaded: number, total: number|}>>,
  ) => void,
};

module.exports = {
  /**
   * See https://facebook.github.io/react-native/docs/image.html#style
   */
  style: StyleSheetPropType(ImageStylePropTypes),
  /**
   * The image source (either a remote URL or a local file resource).
   *
   * See https://facebook.github.io/react-native/docs/image.html#source
   */
  source: ImageSourcePropType,
  /**
   * A static image to display while loading the image source.
   *
   * See https://facebook.github.io/react-native/docs/image.html#defaultsource
   */
  defaultSource: PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
      width: PropTypes.number,
      height: PropTypes.number,
      scale: PropTypes.number,
    }),
    PropTypes.number,
  ]),
  /**
   * When true, indicates the image is an accessibility element.
   *
   * See https://facebook.github.io/react-native/docs/image.html#accessible
   */
  accessible: PropTypes.bool,
  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://facebook.github.io/react-native/docs/image.html#accessibilitylabel
   */
  accessibilityLabel: PropTypes.node,
  /**
   * blurRadius: the blur radius of the blur filter added to the image
   *
   * See https://facebook.github.io/react-native/docs/image.html#blurradius
   */
  blurRadius: PropTypes.number,
  /**
   * See https://facebook.github.io/react-native/docs/image.html#capinsets
   */
  capInsets: EdgeInsetsPropType,
  /**
   * See https://facebook.github.io/react-native/docs/image.html#resizemethod
   */
  resizeMethod: PropTypes.oneOf(['auto', 'resize', 'scale']),
  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * See https://facebook.github.io/react-native/docs/image.html#resizemode
   */
  resizeMode: PropTypes.oneOf([
    'cover',
    'contain',
    'stretch',
    'repeat',
    'center',
  ]),
  /**
   * A unique identifier for this element to be used in UI Automation
   * testing scripts.
   *
   * See https://facebook.github.io/react-native/docs/image.html#testid
   */
  testID: PropTypes.string,
  /**
   * Invoked on mount and layout changes with
   * `{nativeEvent: {layout: {x, y, width, height}}}`.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onlayout
   */
  onLayout: PropTypes.func,
  /**
   * Invoked on load start.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onloadstart
   */
  onLoadStart: PropTypes.func,
  /**
   * Invoked on download progress with `{nativeEvent: {loaded, total}}`.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onprogress
   */
  onProgress: PropTypes.func,
  /**
   * Invoked on load error with `{nativeEvent: {error}}`.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onerror
   */
  onError: PropTypes.func,
  /**
   * Invoked when a partial load of the image is complete.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onpartialload
   */
  onPartialLoad: PropTypes.func,
  /**
   * Invoked when load completes successfully.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onload
   */
  onLoad: PropTypes.func,
  /**
   * Invoked when load either succeeds or fails.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onloadend
   */
  onLoadEnd: PropTypes.func,
};

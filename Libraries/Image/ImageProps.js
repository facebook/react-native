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

import type {SyntheticEvent, LayoutEvent} from '../Types/CoreEventTypes';
import type {EdgeInsetsProp} from '../StyleSheet/EdgeInsetsPropType';
import type {ImageSource} from './ImageSource';
import type {ViewStyleProp, ImageStyleProp} from '../StyleSheet/StyleSheet';
import type {DimensionValue} from '../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../Components/View/ViewPropTypes';

export type ImageLoadEvent = SyntheticEvent<
  $ReadOnly<{|
    source: $ReadOnly<{|
      width: number,
      height: number,
      url: string,
    |}>,
    uri?: string, // Only on Android
  |}>,
>;

type IOSImageProps = $ReadOnly<{|
  /**
   * A static image to display while loading the image source.
   *
   * See https://facebook.github.io/react-native/docs/image.html#defaultsource
   */
  defaultSource?: ?ImageSource,
  /**
   * Invoked when a partial load of the image is complete.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onpartialload
   */
  onPartialLoad?: ?() => void,
  /**
   * Invoked on download progress with `{nativeEvent: {loaded, total}}`.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onprogress
   */
  onProgress?: ?(
    event: SyntheticEvent<$ReadOnly<{|loaded: number, total: number|}>>,
  ) => void,
|}>;

type AndroidImageProps = $ReadOnly<{|
  loadingIndicatorSource?: ?(number | $ReadOnly<{|uri: string|}>),
  progressiveRenderingEnabled?: ?boolean,
  fadeDuration?: ?number,
|}>;

export type ImageProps = {|
  ...$Diff<ViewProps, $ReadOnly<{|style: ?ViewStyleProp|}>>,
  ...IOSImageProps,
  ...AndroidImageProps,

  /**
   * When true, indicates the image is an accessibility element.
   *
   * See https://facebook.github.io/react-native/docs/image.html#accessible
   */
  accessible?: ?boolean,

  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://facebook.github.io/react-native/docs/image.html#accessibilitylabel
   */
  accessibilityLabel?: ?Stringish,

  /**
   * blurRadius: the blur radius of the blur filter added to the image
   *
   * See https://facebook.github.io/react-native/docs/image.html#blurradius
   */
  blurRadius?: ?number,

  /**
   * See https://facebook.github.io/react-native/docs/image.html#capinsets
   */
  capInsets?: ?EdgeInsetsProp,

  /**
   * Invoked on load error with `{nativeEvent: {error}}`.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onerror
   */
  onError?: ?(
    event: SyntheticEvent<
      $ReadOnly<{|
        error: string,
      |}>,
    >,
  ) => void,

  /**
   * Invoked on mount and layout changes with
   * `{nativeEvent: {layout: {x, y, width, height}}}`.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onlayout
   */

  onLayout?: ?(event: LayoutEvent) => mixed,

  /**
   * Invoked when load completes successfully.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onload
   */
  onLoad?: ?(event: ImageLoadEvent) => void,

  /**
   * Invoked when load either succeeds or fails.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onloadend
   */
  onLoadEnd?: ?() => void,

  /**
   * Invoked on load start.
   *
   * See https://facebook.github.io/react-native/docs/image.html#onloadstart
   */
  onLoadStart?: ?() => void,

  /**
   * See https://facebook.github.io/react-native/docs/image.html#resizemethod
   */
  resizeMethod?: ?('auto' | 'resize' | 'scale'),

  /**
   * The image source (either a remote URL or a local file resource).
   *
   * See https://facebook.github.io/react-native/docs/image.html#source
   */
  source?: ?ImageSource,

  /**
   * See https://facebook.github.io/react-native/docs/image.html#style
   */
  style?: ?ImageStyleProp,

  // Can be set via props or style, for now
  height?: ?DimensionValue,
  width?: ?DimensionValue,

  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * See https://facebook.github.io/react-native/docs/image.html#resizemode
   */
  resizeMode?: ?('cover' | 'contain' | 'stretch' | 'repeat' | 'center'),

  /**
   * A unique identifier for this element to be used in UI Automation
   * testing scripts.
   *
   * See https://facebook.github.io/react-native/docs/image.html#testid
   */
  testID?: ?string,

  src?: empty,
  children?: empty,
|};

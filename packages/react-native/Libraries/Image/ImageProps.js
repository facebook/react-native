/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {EdgeInsetsProp} from '../StyleSheet/EdgeInsetsPropType';
import type {
  ColorValue,
  ImageStyleProp,
  ViewStyleProp,
} from '../StyleSheet/StyleSheet';
import type {LayoutEvent, SyntheticEvent} from '../Types/CoreEventTypes';
import typeof Image from './Image';
import type {ImageSource} from './ImageSource';
import type {Node, Ref} from 'react';

export type ImageLoadEvent = SyntheticEvent<
  $ReadOnly<{|
    source: $ReadOnly<{|
      width: number,
      height: number,
      uri: string,
    |}>,
  |}>,
>;

type IOSImageProps = $ReadOnly<{|
  /**
   * A static image to display while loading the image source.
   *
   * See https://reactnative.dev/docs/image#defaultsource
   */
  defaultSource?: ?ImageSource,
  /**
   * Invoked when a partial load of the image is complete.
   *
   * See https://reactnative.dev/docs/image#onpartialload
   */
  onPartialLoad?: ?() => void,
  /**
   * Invoked on download progress with `{nativeEvent: {loaded, total}}`.
   *
   * See https://reactnative.dev/docs/image#onprogress
   */
  onProgress?: ?(
    event: SyntheticEvent<$ReadOnly<{|loaded: number, total: number|}>>,
  ) => void,
|}>;

type AndroidImageProps = $ReadOnly<{|
  loadingIndicatorSource?: ?(number | $ReadOnly<{|uri: string|}>),
  progressiveRenderingEnabled?: ?boolean,
  fadeDuration?: ?number,

  /**
   * The mechanism that should be used to resize the image when the image's
   * dimensions differ from the image view's dimensions. Defaults to `'auto'`.
   * See https://reactnative.dev/docs/image#resizemethod-android
   */
  resizeMethod?: ?('auto' | 'resize' | 'scale'),

  /**
   * When the `resizeMethod` is set to `resize`, the destination dimensions are
   * multiplied by this value. The `scale` method is used to perform the
   * remainder of the resize.
   * This is used to produce higher quality images when resizing to small dimensions.
   * Defaults to 1.0.
   */
  resizeMultiplier?: ?number,
|}>;

export type ImageProps = {|
  ...$Diff<ViewProps, $ReadOnly<{|style: ?ViewStyleProp|}>>,
  ...IOSImageProps,
  ...AndroidImageProps,

  /**
   * When true, indicates the image is an accessibility element.
   *
   * See https://reactnative.dev/docs/image#accessible
   */
  accessible?: ?boolean,

  /**
   * Internal prop to set an "Analytics Tag" that can will be set on the Image
   */
  internal_analyticTag?: ?string,

  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://reactnative.dev/docs/image#accessibilitylabel
   */
  accessibilityLabel?: ?Stringish,

  /**
   * Alias for accessibilityLabel
   * See https://reactnative.dev/docs/image#accessibilitylabel
   */
  'aria-label'?: ?Stringish,

  /**
   * Represents the nativeID of the associated label. When the assistive technology focuses on the component with this props.
   *
   * @platform android
   */
  'aria-labelledby'?: ?string,
  /**
   * The text that's read by the screen reader when the user interacts with
   * the image.
   *
   * See https://reactnative.dev/docs/image#alt
   */
  alt?: ?Stringish,

  /**
   * blurRadius: the blur radius of the blur filter added to the image
   *
   * See https://reactnative.dev/docs/image#blurradius
   */
  blurRadius?: ?number,

  /**
   * See https://reactnative.dev/docs/image#capinsets
   */
  capInsets?: ?EdgeInsetsProp,

  /**
   * Adds the CORS related header to the request.
   * Similar to crossorigin from HTML.
   *
   * See https://reactnative.dev/docs/image#crossorigin
   */
  crossOrigin?: ?('anonymous' | 'use-credentials'),

  /**
   * Height of the image component.
   *
   * See https://reactnative.dev/docs/image#height
   */
  height?: number,

  /**
   * Width of the image component.
   *
   * See https://reactnative.dev/docs/image#width
   */
  width?: number,

  /**
   * Invoked on load error with `{nativeEvent: {error}}`.
   *
   * See https://reactnative.dev/docs/image#onerror
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
   * See https://reactnative.dev/docs/image#onlayout
   */

  onLayout?: ?(event: LayoutEvent) => mixed,

  /**
   * Invoked when load completes successfully.
   *
   * See https://reactnative.dev/docs/image#onload
   */
  onLoad?: ?(event: ImageLoadEvent) => void,

  /**
   * Invoked when load either succeeds or fails.
   *
   * See https://reactnative.dev/docs/image#onloadend
   */
  onLoadEnd?: ?() => void,

  /**
   * Invoked on load start.
   *
   * See https://reactnative.dev/docs/image#onloadstart
   */
  onLoadStart?: ?() => void,

  /**
   * The image source (either a remote URL or a local file resource).
   *
   * See https://reactnative.dev/docs/image#source
   */
  source?: ?ImageSource,

  /**
   * See https://reactnative.dev/docs/image#style
   */
  style?: ?ImageStyleProp,

  /**
   * A string indicating which referrer to use when fetching the resource.
   * Similar to referrerpolicy from HTML.
   *
   * See https://reactnative.dev/docs/image#referrerpolicy
   */
  referrerPolicy?: ?(
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  ),

  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * See https://reactnative.dev/docs/image#resizemode
   */
  resizeMode?: ?('cover' | 'contain' | 'stretch' | 'repeat' | 'center'),

  /**
   * A unique identifier for this element to be used in UI Automation
   * testing scripts.
   *
   * See https://reactnative.dev/docs/image#testid
   */
  testID?: ?string,

  /**
   * Changes the color of all the non-transparent pixels to the tintColor.
   *
   * See https://reactnative.dev/docs/image#tintcolor
   */
  tintColor?: ColorValue,

  /**
   * A string representing the resource identifier for the image. Similar to
   * src from HTML.
   *
   * See https://reactnative.dev/docs/image#src
   */
  src?: ?string,

  /**
   * Similar to srcset from HTML.
   *
   * See https://reactnative.dev/docs/image#srcset
   */
  srcSet?: ?string,
  children?: empty,
|};

export type ImageBackgroundProps = $ReadOnly<{|
  ...ImageProps,
  children?: Node,

  /**
   * Style applied to the outer View component
   *
   * See https://reactnative.dev/docs/imagebackground#style
   */
  style?: ?ViewStyleProp,

  /**
   * Style applied to the inner Image component
   *
   * See https://reactnative.dev/docs/imagebackground#imagestyle
   */
  imageStyle?: ?ImageStyleProp,

  /**
   * Allows to set a reference to the inner Image component
   *
   * See https://reactnative.dev/docs/imagebackground#imageref
   */
  imageRef?: Ref<Image>,
|}>;

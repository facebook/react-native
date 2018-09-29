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

import type {SyntheticEvent} from 'CoreEventTypes';
import type {EdgeInsetsProp} from 'EdgeInsetsPropType';
import type {ImageSource} from 'ImageSource';
import type {ViewStyleProp, ImageStyleProp} from 'StyleSheet';
import type {DimensionValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

type OnLoadEvent = SyntheticEvent<
  $ReadOnly<{|
    // Only on Android
    uri?: string,

    source: $ReadOnly<{|
      width: number,
      height: number,
      url: string,
    |}>,
  |}>,
>;

type IOSImageProps = $ReadOnly<{|
  defaultSource?: ?ImageSource,
  onPartialLoad?: ?() => void,
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
  blurRadius?: ?number,
  capInsets?: ?EdgeInsetsProp,

  onError?: ?(event: SyntheticEvent<$ReadOnly<{||}>>) => void,
  onLoad?: ?(event: OnLoadEvent) => void,
  onLoadEnd?: ?() => void,
  onLoadStart?: ?() => void,
  resizeMethod?: ?('auto' | 'resize' | 'scale'),
  source?: ?ImageSource,
  style?: ?ImageStyleProp,

  // Can be set via props or style, for now
  height?: ?DimensionValue,
  width?: ?DimensionValue,
  resizeMode?: ?('cover' | 'contain' | 'stretch' | 'repeat' | 'center'),

  src?: empty,
  children?: empty,
|};

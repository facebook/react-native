/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {Constructor} from '../../types/private/Utilities';
import {HostInstance} from '../../types/public/ReactNativeTypes';
import {StyleProp} from '../StyleSheet/StyleSheet';
import {ImageStyle, ViewStyle} from '../StyleSheet/StyleSheetTypes';
import Image, {ImagePropsBase} from './Image';

export interface ImageBackgroundProps extends ImagePropsBase {
  children?: React.ReactNode | undefined;
  imageStyle?: StyleProp<ImageStyle> | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  imageRef?(image: Image): void;
}

declare class ImageBackgroundComponent extends React.Component<ImageBackgroundProps> {}
declare const ImageBackgroundBase: Constructor<HostInstance> &
  typeof ImageBackgroundComponent;
declare class ImageBackground extends ImageBackgroundBase {}

export default ImageBackground;

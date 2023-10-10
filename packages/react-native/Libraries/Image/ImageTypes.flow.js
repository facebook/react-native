/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../Types/RootTagTypes';
import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageProps as ImagePropsType} from './ImageProps';
import typeof ImageViewNativeComponent from './ImageViewNativeComponent';
import typeof TextInlineImageNativeComponent from './TextInlineImageNativeComponent';

import * as React from 'react';

type ImageComponentStaticsIOS = $ReadOnly<{
  getSize: (
    uri: string,
    success: (width: number, height: number) => void,
    failure?: (error: any) => void,
  ) => void,

  getSizeWithHeaders(
    uri: string,
    headers: {[string]: string, ...},
    success: (width: number, height: number) => void,
    failure?: (error: any) => void,
  ): any,

  prefetch(url: string): any,

  prefetchWithMetadata(
    url: string,
    queryRootName: string,
    rootTag?: ?RootTag,
  ): any,

  queryCache(
    urls: Array<string>,
  ): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}>,

  resolveAssetSource(source: any): ?ResolvedAssetSource,
}>;

type ImageComponentStaticsAndroid = $ReadOnly<{
  ...ImageComponentStaticsIOS,
  abortPrefetch(requestId: number): void,
}>;

export type AbstractImageAndroid = React.AbstractComponent<
  ImagePropsType,
  | React.ElementRef<TextInlineImageNativeComponent>
  | React.ElementRef<ImageViewNativeComponent>,
>;

export type ImageAndroid = AbstractImageAndroid & ImageComponentStaticsAndroid;

export type AbstractImageIOS = React.AbstractComponent<
  ImagePropsType,
  React.ElementRef<ImageViewNativeComponent>,
>;

export type ImageIOS = AbstractImageIOS & ImageComponentStaticsIOS;

export type Image = ImageIOS | ImageAndroid;

export type {ImageProps} from './ImageProps';

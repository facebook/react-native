/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RootTag} from '../Types/RootTagTypes';
import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageProps as ImagePropsType} from './ImageProps';
import type {ImageSource} from './ImageSource';
import typeof ImageViewNativeComponent from './ImageViewNativeComponent';
import typeof TextInlineImageNativeComponent from './TextInlineImageNativeComponent';

import * as React from 'react';

type ImageComponentStaticsIOS = $ReadOnly<{
  getSize(uri: string): Promise<{width: number, height: number}>,
  getSize(
    uri: string,
    success: (width: number, height: number) => void,
    failure?: (error: mixed) => void,
  ): void,

  getSizeWithHeaders(
    uri: string,
    headers: {[string]: string, ...},
  ): Promise<{width: number, height: number}>,
  getSizeWithHeaders(
    uri: string,
    headers: {[string]: string, ...},
    success: (width: number, height: number) => void,
    failure?: (error: mixed) => void,
  ): void,

  prefetch(url: string): Promise<boolean>,

  prefetchWithMetadata(
    url: string,
    queryRootName: string,
    rootTag?: ?RootTag,
  ): Promise<boolean>,

  queryCache(
    urls: Array<string>,
  ): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}>,

  resolveAssetSource(source: ImageSource): ?ResolvedAssetSource,
}>;

type ImageComponentStaticsAndroid = $ReadOnly<{
  ...ImageComponentStaticsIOS,
  abortPrefetch(requestId: number): void,
}>;

export type AbstractImageAndroid = component(
  ref: React.RefSetter<
    | React.ElementRef<TextInlineImageNativeComponent>
    | React.ElementRef<ImageViewNativeComponent>,
  >,
  ...props: ImagePropsType
);

export type ImageAndroid = AbstractImageAndroid & ImageComponentStaticsAndroid;

export type AbstractImageIOS = component(
  ref: React.RefSetter<React.ElementRef<ImageViewNativeComponent>>,
  ...props: ImagePropsType
);

export type ImageIOS = AbstractImageIOS & ImageComponentStaticsIOS;

export type Image = ImageIOS | ImageAndroid;

export type {ImageProps} from './ImageProps';

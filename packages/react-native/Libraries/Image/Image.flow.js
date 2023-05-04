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

import ImageViewNativeComponent from './ImageViewNativeComponent';
import TextInlineImageNativeComponent from './TextInlineImageNativeComponent';
import * as React from 'react';

type ImageComponentStaticsIOS = $ReadOnly<{|
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
|}>;

type ImageComponentStaticsAndroid = {
  ...ImageComponentStaticsIOS,
  abortPrefetch(requestId: number): void,
};

export type ImageAndroid = React.AbstractComponent<
  ImagePropsType,
  | React.ElementRef<typeof TextInlineImageNativeComponent>
  | React.ElementRef<typeof ImageViewNativeComponent>,
> &
  ImageComponentStaticsAndroid;

export type ImageIOS = React.AbstractComponent<
  ImagePropsType,
  React.ElementRef<typeof ImageViewNativeComponent>,
> &
  ImageComponentStaticsIOS;

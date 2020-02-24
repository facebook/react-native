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

const DeprecatedImagePropType = require('../DeprecatedPropTypes/DeprecatedImagePropType');
const React = require('react');
const ReactNative = require('../Renderer/shims/ReactNative'); // eslint-disable-line no-unused-vars
const StyleSheet = require('../StyleSheet/StyleSheet');

const flattenStyle = require('../StyleSheet/flattenStyle');
const resolveAssetSource = require('./resolveAssetSource');

import type {ImageProps as ImagePropsType} from './ImageProps';

import type {ImageStyleProp} from '../StyleSheet/StyleSheet';
import NativeImageLoaderIOS from './NativeImageLoaderIOS';

import ImageViewNativeComponent from './ImageViewNativeComponent';

function getSize(
  uri: string,
  success: (width: number, height: number) => void,
  failure?: (error: any) => void,
) {
  NativeImageLoaderIOS.getSize(uri)
    .then(([width, height]) => success(width, height))
    .catch(
      failure ||
        function() {
          console.warn('Failed to get size for image ' + uri);
        },
    );
}

function getSizeWithHeaders(
  uri: string,
  headers: {[string]: string, ...},
  success: (width: number, height: number) => void,
  failure?: (error: any) => void,
): any {
  return NativeImageLoaderIOS.getSizeWithHeaders(uri, headers)
    .then(function(sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(
      failure ||
        function() {
          console.warn('Failed to get size for image: ' + uri);
        },
    );
}

function prefetch(url: string): any {
  return NativeImageLoaderIOS.prefetchImage(url);
}

async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return await NativeImageLoaderIOS.queryCache(urls);
}

type ImageComponentStatics = $ReadOnly<{|
  getSize: typeof getSize,
  getSizeWithHeaders: typeof getSizeWithHeaders,
  prefetch: typeof prefetch,
  queryCache: typeof queryCache,
  resolveAssetSource: typeof resolveAssetSource,
  propTypes: typeof DeprecatedImagePropType,
|}>;

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://reactnative.dev/docs/image.html
 */
let Image = (props: ImagePropsType, forwardedRef) => {
  const source = resolveAssetSource(props.source) || {
    uri: undefined,
    width: undefined,
    height: undefined,
  };

  let sources;
  let style: ImageStyleProp;
  if (Array.isArray(source)) {
    // $FlowFixMe flattenStyle is not strong enough
    style = flattenStyle([styles.base, props.style]) || {};
    sources = source;
  } else {
    const {width, height, uri} = source;
    // $FlowFixMe flattenStyle is not strong enough
    style = flattenStyle([{width, height}, styles.base, props.style]) || {};
    sources = [source];

    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
  }

  const resizeMode = props.resizeMode || style.resizeMode || 'cover';
  const tintColor = style.tintColor;

  if (props.src != null) {
    console.warn(
      'The <Image> component requires a `source` property rather than `src`.',
    );
  }

  if (props.children != null) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }

  return (
    <ImageViewNativeComponent
      {...props}
      ref={forwardedRef}
      style={style}
      resizeMode={resizeMode}
      tintColor={tintColor}
      source={sources}
    />
  );
};

Image = React.forwardRef<
  ImagePropsType,
  React.ElementRef<typeof ImageViewNativeComponent>,
>(Image);
Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it.
 *
 * See https://reactnative.dev/docs/image.html#getsize
 */
/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request.
 *
 * See https://reactnative.dev/docs/image.html#getsizewithheaders
 */
/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache.
 *
 * See https://reactnative.dev/docs/image.html#prefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.prefetch = prefetch;

/**
 * Performs cache interrogation.
 *
 *  See https://reactnative.dev/docs/image.html#querycache
 */
/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.queryCache = queryCache;

/**
 * Resolves an asset reference into an object.
 *
 * See https://reactnative.dev/docs/image.html#resolveassetsource
 */
/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.resolveAssetSource = resolveAssetSource;

/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.propTypes = DeprecatedImagePropType;

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = ((Image: any): React.AbstractComponent<
  ImagePropsType,
  React.ElementRef<typeof ImageViewNativeComponent>,
> &
  ImageComponentStatics);

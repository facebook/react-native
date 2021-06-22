/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import DeprecatedImagePropType from '../DeprecatedPropTypes/DeprecatedImagePropType';
import ImageViewNativeComponent from './ImageViewNativeComponent';
import * as React from 'react';
import StyleSheet from '../StyleSheet/StyleSheet';
import TextAncestor from '../Text/TextAncestor';
import ImageInjection from './ImageInjection';
import ImageAnalyticsTagContext from './ImageAnalyticsTagContext';
import flattenStyle from '../StyleSheet/flattenStyle';
import resolveAssetSource from './resolveAssetSource';

import NativeImageLoaderAndroid from './NativeImageLoaderAndroid';

import TextInlineImageNativeComponent from './TextInlineImageNativeComponent';

import type {ImageProps as ImagePropsType} from './ImageProps';
import type {RootTag} from '../Types/RootTagTypes';

let _requestId = 1;
function generateRequestId() {
  return _requestId++;
}

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image.html#getsize
 */
function getSize(
  url: string,
  success: (width: number, height: number) => void,
  failure?: (error: any) => void,
): any {
  return NativeImageLoaderAndroid.getSize(url)
    .then(function(sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(
      failure ||
        function() {
          console.warn('Failed to get size for image: ' + url);
        },
    );
}

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image.html#getsizewithheaders
 */
function getSizeWithHeaders(
  url: string,
  headers: {[string]: string, ...},
  success: (width: number, height: number) => void,
  failure?: (error: any) => void,
): any {
  return NativeImageLoaderAndroid.getSizeWithHeaders(url, headers)
    .then(function(sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(
      failure ||
        function() {
          console.warn('Failed to get size for image: ' + url);
        },
    );
}

function prefetchWithMetadata(
  url: string,
  queryRootName: string,
  rootTag?: ?RootTag,
  callback: ?Function,
): any {
  // TODO: T79192300 Log queryRootName and rootTag
  prefetch(url, callback);
}

function prefetch(url: string, callback: ?Function): any {
  const requestId = generateRequestId();
  callback && callback(requestId);
  return NativeImageLoaderAndroid.prefetchImage(url, requestId);
}

function abortPrefetch(requestId: number) {
  NativeImageLoaderAndroid.abortRequest(requestId);
}

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image.html#querycache
 */
async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return await NativeImageLoaderAndroid.queryCache(urls);
}

type ImageComponentStatics = $ReadOnly<{|
  getSize: typeof getSize,
  getSizeWithHeaders: typeof getSizeWithHeaders,
  prefetch: typeof prefetch,
  prefetchWithMetadata: typeof prefetchWithMetadata,
  abortPrefetch: typeof abortPrefetch,
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
  let source = resolveAssetSource(props.source);
  const defaultSource = resolveAssetSource(props.defaultSource);
  const loadingIndicatorSource = resolveAssetSource(
    props.loadingIndicatorSource,
  );

  if (source) {
    const uri = source.uri;
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
  }

  if (props.src) {
    console.warn(
      'The <Image> component requires a `source` property rather than `src`.',
    );
  }

  if (props.children) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }

  if (props.defaultSource && props.loadingIndicatorSource) {
    throw new Error(
      'The <Image> component cannot have defaultSource and loadingIndicatorSource at the same time. Please use either defaultSource or loadingIndicatorSource.',
    );
  }

  if (source && !source.uri && !Array.isArray(source)) {
    source = null;
  }

  let style;
  let sources;
  if (source?.uri != null) {
    const {width, height} = source;
    style = flattenStyle([{width, height}, styles.base, props.style]);
    sources = [{uri: source.uri}];
  } else {
    style = flattenStyle([styles.base, props.style]);
    sources = source;
  }

  const {onLoadStart, onLoad, onLoadEnd, onError} = props;
  const nativeProps = {
    ...props,
    style,
    shouldNotifyLoadEvents: !!(onLoadStart || onLoad || onLoadEnd || onError),
    src: sources,
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    headers: source?.headers,
    defaultSrc: defaultSource ? defaultSource.uri : null,
    loadingIndicatorSrc: loadingIndicatorSource
      ? loadingIndicatorSource.uri
      : null,
    ref: forwardedRef,
  };

  return (
    <ImageAnalyticsTagContext.Consumer>
      {analyticTag => {
        const nativePropsWithAnalytics =
          analyticTag !== null
            ? {
                ...nativeProps,
                internal_analyticTag: analyticTag,
              }
            : nativeProps;
        return (
          <TextAncestor.Consumer>
            {hasTextAncestor =>
              hasTextAncestor ? (
                <TextInlineImageNativeComponent {...nativePropsWithAnalytics} />
              ) : (
                <ImageViewNativeComponent {...nativePropsWithAnalytics} />
              )
            }
          </TextAncestor.Consumer>
        );
      }}
    </ImageAnalyticsTagContext.Consumer>
  );
};

Image = React.forwardRef<
  ImagePropsType,
  | React.ElementRef<typeof TextInlineImageNativeComponent>
  | React.ElementRef<typeof ImageViewNativeComponent>,
>(Image);

if (ImageInjection.unstable_createImageComponent != null) {
  Image = ImageInjection.unstable_createImageComponent(Image);
}

Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image.html#getsize
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image.html#getsizewithheaders
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache
 *
 * See https://reactnative.dev/docs/image.html#prefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.prefetch = prefetch;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache, and adds metadata for queryRootName and rootTag.
 *
 * See https://reactnative.dev/docs/image.html#prefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.prefetchWithMetadata = prefetchWithMetadata;

/**
 * Abort prefetch request.
 *
 * See https://reactnative.dev/docs/image.html#abortprefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.abortPrefetch = abortPrefetch;

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image.html#querycache
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.queryCache = queryCache;

/**
 * Resolves an asset reference into an object.
 *
 * See https://reactnative.dev/docs/image.html#resolveassetsource
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.resolveAssetSource = resolveAssetSource;

/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
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
  | React.ElementRef<typeof TextInlineImageNativeComponent>
  | React.ElementRef<typeof ImageViewNativeComponent>,
> &
  ImageComponentStatics);

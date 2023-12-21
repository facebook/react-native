/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ImageStyleProp} from '../StyleSheet/StyleSheet';
import type {RootTag} from '../Types/RootTagTypes';
import type {AbstractImageAndroid, ImageAndroid} from './ImageTypes.flow';

import flattenStyle from '../StyleSheet/flattenStyle';
import StyleSheet from '../StyleSheet/StyleSheet';
import TextAncestor from '../Text/TextAncestor';
import ImageAnalyticsTagContext from './ImageAnalyticsTagContext';
import {
  unstable_getImageComponentDecorator,
  useWrapRefWithImageAttachedCallbacks,
} from './ImageInjection';
import {getImageSourcesFromImageProps} from './ImageSourceUtils';
import {convertObjectFitToResizeMode} from './ImageUtils';
import ImageViewNativeComponent from './ImageViewNativeComponent';
import NativeImageLoaderAndroid from './NativeImageLoaderAndroid';
import resolveAssetSource from './resolveAssetSource';
import TextInlineImageNativeComponent from './TextInlineImageNativeComponent';
import * as React from 'react';

let _requestId = 1;
function generateRequestId() {
  return _requestId++;
}

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image#getsize
 */
function getSize(
  url: string,
  success: (width: number, height: number) => void,
  failure?: (error: mixed) => void,
): void {
  NativeImageLoaderAndroid.getSize(url)
    .then(function (sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + url);
        },
    );
}

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
function getSizeWithHeaders(
  url: string,
  headers: {[string]: string, ...},
  success: (width: number, height: number) => void,
  failure?: (error: mixed) => void,
): void {
  NativeImageLoaderAndroid.getSizeWithHeaders(url, headers)
    .then(function (sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + url);
        },
    );
}

function prefetchWithMetadata(
  url: string,
  queryRootName: string,
  rootTag?: ?RootTag,
  callback: ?(requestId: number) => void,
): Promise<boolean> {
  // TODO: T79192300 Log queryRootName and rootTag
  return prefetch(url, callback);
}

function prefetch(
  url: string,
  callback: ?(requestId: number) => void,
): Promise<boolean> {
  const requestId = generateRequestId();
  callback && callback(requestId);
  return NativeImageLoaderAndroid.prefetchImage(url, requestId);
}

function abortPrefetch(requestId: number): void {
  NativeImageLoaderAndroid.abortRequest(requestId);
}

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image#querycache
 */
async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return NativeImageLoaderAndroid.queryCache(urls);
}

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://reactnative.dev/docs/image
 */
let BaseImage: AbstractImageAndroid = React.forwardRef(
  (props, forwardedRef) => {
    let source = getImageSourcesFromImageProps(props) || {
      uri: undefined,
      width: undefined,
      height: undefined,
    };
    const defaultSource = resolveAssetSource(props.defaultSource);
    const loadingIndicatorSource = resolveAssetSource(
      props.loadingIndicatorSource,
    );

    if (props.children) {
      throw new Error(
        'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
      );
    }

    if (props.defaultSource != null && props.loadingIndicatorSource != null) {
      throw new Error(
        'The <Image> component cannot have defaultSource and loadingIndicatorSource at the same time. Please use either defaultSource or loadingIndicatorSource.',
      );
    }

    let style;
    let sources;
    if (Array.isArray(source)) {
      style = flattenStyle<ImageStyleProp>([styles.base, props.style]);
      sources = source;
    } else {
      const {uri} = source;
      const width = source.width ?? props.width;
      const height = source.height ?? props.height;
      style = flattenStyle<ImageStyleProp>([
        {width, height},
        styles.base,
        props.style,
      ]);
      sources = [source];
      if (uri === '') {
        console.warn('source.uri should not be an empty string');
      }
    }

    const {height, width, ...restProps} = props;

    const {onLoadStart, onLoad, onLoadEnd, onError} = props;
    const nativeProps = {
      ...restProps,
      style,
      shouldNotifyLoadEvents: !!(onLoadStart || onLoad || onLoadEnd || onError),
      src: sources,
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      headers: (source?.[0]?.headers || source?.headers: ?{[string]: string}),
      defaultSrc: defaultSource ? defaultSource.uri : null,
      loadingIndicatorSrc: loadingIndicatorSource
        ? loadingIndicatorSource.uri
        : null,
      accessibilityLabel:
        props['aria-label'] ?? props.accessibilityLabel ?? props.alt,
      accessibilityLabelledBy:
        props?.['aria-labelledby'] ?? props?.accessibilityLabelledBy,
      accessible: props.alt !== undefined ? true : props.accessible,
      accessibilityState: {
        busy: props['aria-busy'] ?? props.accessibilityState?.busy,
        checked: props['aria-checked'] ?? props.accessibilityState?.checked,
        disabled: props['aria-disabled'] ?? props.accessibilityState?.disabled,
        expanded: props['aria-expanded'] ?? props.accessibilityState?.expanded,
        selected: props['aria-selected'] ?? props.accessibilityState?.selected,
      },
    };

    const objectFit = style?.objectFit
      ? convertObjectFitToResizeMode(style.objectFit)
      : null;
    const resizeMode =
      objectFit || props.resizeMode || style?.resizeMode || 'cover';

    const actualRef = useWrapRefWithImageAttachedCallbacks(forwardedRef);

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
              {hasTextAncestor => {
                if (hasTextAncestor) {
                  return (
                    <TextInlineImageNativeComponent
                      // $FlowFixMe[incompatible-type]
                      style={style}
                      resizeMode={resizeMode}
                      headers={nativeProps.headers}
                      src={sources}
                      ref={actualRef}
                    />
                  );
                }

                return (
                  <ImageViewNativeComponent
                    {...nativePropsWithAnalytics}
                    resizeMode={resizeMode}
                    ref={actualRef}
                  />
                );
              }}
            </TextAncestor.Consumer>
          );
        }}
      </ImageAnalyticsTagContext.Consumer>
    );
  },
);

const imageComponentDecorator = unstable_getImageComponentDecorator();
if (imageComponentDecorator != null) {
  BaseImage = imageComponentDecorator(BaseImage);
}

// $FlowExpectedError[incompatible-type] Eventually we need to move these functions from statics of the component to exports in the module.
const Image: ImageAndroid = BaseImage;

Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image#getsize
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache
 *
 * See https://reactnative.dev/docs/image#prefetch
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.prefetch = prefetch;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache, and adds metadata for queryRootName and rootTag.
 *
 * See https://reactnative.dev/docs/image#prefetch
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.prefetchWithMetadata = prefetchWithMetadata;

/**
 * Abort prefetch request.
 *
 * See https://reactnative.dev/docs/image#abortprefetch
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.abortPrefetch = abortPrefetch;

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image#querycache
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.queryCache = queryCache;

/**
 * Resolves an asset reference into an object.
 *
 * See https://reactnative.dev/docs/image#resolveassetsource
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.resolveAssetSource = resolveAssetSource;

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = Image;

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
import type {ImageAndroid} from './Image.flow';
import type {ImageProps as ImagePropsType} from './ImageProps';

import flattenStyle from '../StyleSheet/flattenStyle';
import StyleSheet from '../StyleSheet/StyleSheet';
import TextAncestor from '../Text/TextAncestor';
import ImageAnalyticsTagContext from './ImageAnalyticsTagContext';
import ImageInjection from './ImageInjection';
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
  failure?: (error: any) => void,
): any {
  return NativeImageLoaderAndroid.getSize(url)
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
  failure?: (error: any) => void,
): any {
  return NativeImageLoaderAndroid.getSizeWithHeaders(url, headers)
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
 * See https://reactnative.dev/docs/image#querycache
 */
async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return await NativeImageLoaderAndroid.queryCache(urls);
}

export type ImageComponentStatics = $ReadOnly<{|
  getSize: typeof getSize,
  getSizeWithHeaders: typeof getSizeWithHeaders,
  prefetch: typeof prefetch,
  prefetchWithMetadata: typeof prefetchWithMetadata,
  abortPrefetch?: typeof abortPrefetch,
  queryCache: typeof queryCache,
  resolveAssetSource: typeof resolveAssetSource,
|}>;

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://reactnative.dev/docs/image
 */
/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const BaseImage = (props: ImagePropsType, forwardedRef) => {
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

  if (props.defaultSource && props.loadingIndicatorSource) {
    throw new Error(
      'The <Image> component cannot have defaultSource and loadingIndicatorSource at the same time. Please use either defaultSource or loadingIndicatorSource.',
    );
  }

  let style;
  let sources;
  if (Array.isArray(source)) {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    style = flattenStyle([styles.base, props.style]);
    sources = source;
  } else {
    // $FlowFixMe[incompatible-type]
    const {width = props.width, height = props.height, uri} = source;
    // $FlowFixMe[underconstrained-implicit-instantiation]
    style = flattenStyle([{width, height}, styles.base, props.style]);
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
    ref: forwardedRef,
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

  const objectFit =
    // $FlowFixMe[prop-missing]
    style && style.objectFit
      ? // $FlowFixMe[incompatible-call]
        convertObjectFitToResizeMode(style.objectFit)
      : null;
  // $FlowFixMe[prop-missing]
  const resizeMode =
    // $FlowFixMe[prop-missing]
    objectFit || props.resizeMode || (style && style.resizeMode) || 'cover';

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
                    // $FlowFixMe[incompatible-type]
                    resizeMode={resizeMode}
                    headers={nativeProps.headers}
                    src={sources}
                    ref={forwardedRef}
                  />
                );
              }

              return (
                <ImageViewNativeComponent
                  {...nativePropsWithAnalytics}
                  // $FlowFixMe[incompatible-type]
                  resizeMode={resizeMode}
                />
              );
            }}
          </TextAncestor.Consumer>
        );
      }}
    </ImageAnalyticsTagContext.Consumer>
  );
};

let Image = React.forwardRef<
  ImagePropsType,
  | React.ElementRef<typeof TextInlineImageNativeComponent>
  | React.ElementRef<typeof ImageViewNativeComponent>,
>(BaseImage);

if (ImageInjection.unstable_createImageComponent != null) {
  Image = ImageInjection.unstable_createImageComponent(Image);
}

Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 *
 * See https://reactnative.dev/docs/image#getsize
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache
 *
 * See https://reactnative.dev/docs/image#prefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.prefetch = prefetch;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache, and adds metadata for queryRootName and rootTag.
 *
 * See https://reactnative.dev/docs/image#prefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.prefetchWithMetadata = prefetchWithMetadata;

/**
 * Abort prefetch request.
 *
 * See https://reactnative.dev/docs/image#abortprefetch
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.abortPrefetch = abortPrefetch;

/**
 * Perform cache interrogation.
 *
 * See https://reactnative.dev/docs/image#querycache
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.queryCache = queryCache;

/**
 * Resolves an asset reference into an object.
 *
 * See https://reactnative.dev/docs/image#resolveassetsource
 */
/* $FlowFixMe(>=0.89.0 site=react_native_android_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
Image.resolveAssetSource = resolveAssetSource;

/**
 * Switch to `deprecated-react-native-prop-types` for compatibility with future
 * releases. This is deprecated and will be removed in the future.
 */
Image.propTypes = require('deprecated-react-native-prop-types').ImagePropTypes;

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = ((Image: any): ImageAndroid);

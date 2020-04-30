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

const DeprecatedImageStylePropTypes = require('../DeprecatedPropTypes/DeprecatedImageStylePropTypes');
const DeprecatedStyleSheetPropType = require('../DeprecatedPropTypes/DeprecatedStyleSheetPropType');
const DeprecatedViewPropTypes = require('../DeprecatedPropTypes/DeprecatedViewPropTypes');
import ImageViewNativeComponent from './ImageViewNativeComponent';
const PropTypes = require('prop-types');
const React = require('react');
const ReactNative = require('../Renderer/shims/ReactNative'); // eslint-disable-line no-unused-vars
const StyleSheet = require('../StyleSheet/StyleSheet');
const TextAncestor = require('../Text/TextAncestor');

const ImageAnalyticsTagContext = require('./ImageAnalyticsTagContext').default;
const flattenStyle = require('../StyleSheet/flattenStyle');
const resolveAssetSource = require('./resolveAssetSource');

import NativeImageLoaderAndroid from './NativeImageLoaderAndroid';

const TextInlineImageNativeComponent = require('./TextInlineImageNativeComponent');

import type {ImageProps as ImagePropsType} from './ImageProps';

let _requestId = 1;
function generateRequestId() {
  return _requestId++;
}

const ImageProps = {
  ...DeprecatedViewPropTypes,
  style: (DeprecatedStyleSheetPropType(
    DeprecatedImageStylePropTypes,
  ): ReactPropsCheckType),
  /**
   * See https://reactnative.dev/docs/image.html#source
   */
  source: (PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
      headers: PropTypes.objectOf(PropTypes.string),
    }),
    // Opaque type returned by require('./image.jpg')
    PropTypes.number,
    // Multiple sources
    PropTypes.arrayOf(
      PropTypes.shape({
        uri: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
        headers: PropTypes.objectOf(PropTypes.string),
      }),
    ),
  ]): React$PropType$Primitive<
    | {
        headers?: {[string]: string, ...},
        uri?: string,
        ...
      }
    | number
    | Array<{
        headers?: {[string]: string, ...},
        height?: number,
        uri?: string,
        width?: number,
        ...
      }>,
  >),
  /**
   * blurRadius: the blur radius of the blur filter added to the image
   *
   * See https://reactnative.dev/docs/image.html#blurradius
   */
  blurRadius: PropTypes.number,
  /**
   * See https://reactnative.dev/docs/image.html#defaultsource
   */
  defaultSource: PropTypes.number,
  /**
   * See https://reactnative.dev/docs/image.html#loadingindicatorsource
   */
  loadingIndicatorSource: (PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string,
    }),
    // Opaque type returned by require('./image.jpg')
    PropTypes.number,
  ]): React$PropType$Primitive<{uri?: string, ...} | number>),
  progressiveRenderingEnabled: PropTypes.bool,
  fadeDuration: PropTypes.number,
  /**
   * Analytics Tag used by this Image
   */
  internal_analyticTag: PropTypes.string,
  /**
   * Invoked on load start
   */
  onLoadStart: PropTypes.func,
  /**
   * Invoked on load error
   */
  onError: PropTypes.func,
  /**
   * Invoked when load completes successfully
   */
  onLoad: PropTypes.func,
  /**
   * Invoked when load either succeeds or fails
   */
  onLoadEnd: PropTypes.func,
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID: PropTypes.string,
  /**
   * The mechanism that should be used to resize the image when the image's dimensions
   * differ from the image view's dimensions. Defaults to `auto`.
   *
   * See https://reactnative.dev/docs/image.html#resizemethod
   */
  resizeMethod: (PropTypes.oneOf([
    'auto',
    'resize',
    'scale',
  ]): React$PropType$Primitive<'auto' | 'resize' | 'scale'>),
  /**
   * Determines how to resize the image when the frame doesn't match the raw
   * image dimensions.
   *
   * See https://reactnative.dev/docs/image.html#resizemode
   */
  resizeMode: (PropTypes.oneOf([
    'cover',
    'contain',
    'stretch',
    'repeat',
    'center',
  ]): React$PropType$Primitive<
    'cover' | 'contain' | 'stretch' | 'repeat' | 'center',
  >),
};

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
  abortPrefetch: typeof abortPrefetch,
  queryCache: typeof queryCache,
  resolveAssetSource: typeof resolveAssetSource,
  propTypes: typeof ImageProps,
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

  if (source && source.uri === '') {
    console.warn('source.uri should not be an empty string');
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
Image.propTypes = ImageProps;

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

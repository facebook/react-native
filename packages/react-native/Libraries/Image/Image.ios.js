/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ImageStyleProp} from '../StyleSheet/StyleSheet';
import type {RootTag} from '../Types/RootTagTypes';
import type {AbstractImageIOS, ImageIOS} from './ImageTypes.flow';

import flattenStyle from '../StyleSheet/flattenStyle';
import StyleSheet from '../StyleSheet/StyleSheet';
import ImageAnalyticsTagContext from './ImageAnalyticsTagContext';
import ImageInjection from './ImageInjection';
import {getImageSourcesFromImageProps} from './ImageSourceUtils';
import {convertObjectFitToResizeMode} from './ImageUtils';
import ImageViewNativeComponent from './ImageViewNativeComponent';
import NativeImageLoaderIOS from './NativeImageLoaderIOS';
import resolveAssetSource from './resolveAssetSource';
import * as React from 'react';

function getSize(
  uri: string,
  success: (width: number, height: number) => void,
  failure?: (error: any) => void,
) {
  NativeImageLoaderIOS.getSize(uri)
    .then(([width, height]) => success(width, height))
    .catch(
      failure ||
        function () {
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
    .then(function (sizes) {
      success(sizes.width, sizes.height);
    })
    .catch(
      failure ||
        function () {
          console.warn('Failed to get size for image: ' + uri);
        },
    );
}

function prefetchWithMetadata(
  url: string,
  queryRootName: string,
  rootTag?: ?RootTag,
): any {
  if (NativeImageLoaderIOS.prefetchImageWithMetadata) {
    // number params like rootTag cannot be nullable before TurboModules is available
    return NativeImageLoaderIOS.prefetchImageWithMetadata(
      url,
      queryRootName,
      // NOTE: RootTag type
      // $FlowFixMe[incompatible-call] RootTag: number is incompatible with RootTag
      rootTag ? rootTag : 0,
    );
  } else {
    return NativeImageLoaderIOS.prefetchImage(url);
  }
}

function prefetch(url: string): any {
  return NativeImageLoaderIOS.prefetchImage(url);
}

async function queryCache(
  urls: Array<string>,
): Promise<{[string]: 'memory' | 'disk' | 'disk/memory', ...}> {
  return await NativeImageLoaderIOS.queryCache(urls);
}

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://reactnative.dev/docs/image
 */
let BaseImage: AbstractImageIOS = React.forwardRef((props, forwardedRef) => {
  const source = getImageSourcesFromImageProps(props) || {
    uri: undefined,
    width: undefined,
    height: undefined,
  };

  let sources;
  let style: ImageStyleProp;
  if (Array.isArray(source)) {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    style = flattenStyle([styles.base, props.style]) || {};
    sources = source;
  } else {
    // $FlowFixMe[incompatible-type]
    const {width = props.width, height = props.height, uri} = source;
    // $FlowFixMe[underconstrained-implicit-instantiation]
    style = flattenStyle([{width, height}, styles.base, props.style]) || {};
    sources = [source];

    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
  }

  const objectFit =
    // $FlowFixMe[prop-missing]
    style && style.objectFit
      ? // $FlowFixMe[incompatible-call]
        convertObjectFitToResizeMode(style.objectFit)
      : null;
  const resizeMode =
    // $FlowFixMe[prop-missing]
    objectFit || props.resizeMode || (style && style.resizeMode) || 'cover';
  // $FlowFixMe[prop-missing]
  const tintColor = props.tintColor || style.tintColor;

  if (props.children != null) {
    throw new Error(
      'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
    );
  }
  const {
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-selected': ariaSelected,
    height,
    src,
    width,
    ...restProps
  } = props;

  const _accessibilityState = {
    busy: ariaBusy ?? props.accessibilityState?.busy,
    checked: ariaChecked ?? props.accessibilityState?.checked,
    disabled: ariaDisabled ?? props.accessibilityState?.disabled,
    expanded: ariaExpanded ?? props.accessibilityState?.expanded,
    selected: ariaSelected ?? props.accessibilityState?.selected,
  };
  const accessibilityLabel = props['aria-label'] ?? props.accessibilityLabel;

  return (
    <ImageAnalyticsTagContext.Consumer>
      {analyticTag => {
        return (
          <ImageViewNativeComponent
            accessibilityState={_accessibilityState}
            {...restProps}
            accessible={props.alt !== undefined ? true : props.accessible}
            accessibilityLabel={accessibilityLabel ?? props.alt}
            ref={forwardedRef}
            style={style}
            // $FlowFixMe[incompatible-type]
            resizeMode={resizeMode}
            tintColor={tintColor}
            source={sources}
            internal_analyticTag={analyticTag}
          />
        );
      }}
    </ImageAnalyticsTagContext.Consumer>
  );
});

if (ImageInjection.unstable_createImageComponent != null) {
  BaseImage = ImageInjection.unstable_createImageComponent(BaseImage);
}

// $FlowExpectedError[incompatible-type] Eventually we need to move these functions from statics of the component to exports in the module.
const Image: ImageIOS = BaseImage;

Image.displayName = 'Image';

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it.
 *
 * See https://reactnative.dev/docs/image#getsize
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSize = getSize;

/**
 * Retrieve the width and height (in pixels) of an image prior to displaying it
 * with the ability to provide the headers for the request.
 *
 * See https://reactnative.dev/docs/image#getsizewithheaders
 */
// $FlowFixMe[incompatible-use] This property isn't writable but we're actually defining it here for the first time.
Image.getSizeWithHeaders = getSizeWithHeaders;

/**
 * Prefetches a remote image for later use by downloading it to the disk
 * cache.
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
 * Performs cache interrogation.
 *
 *  See https://reactnative.dev/docs/image#querycache
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

module.exports = Image;

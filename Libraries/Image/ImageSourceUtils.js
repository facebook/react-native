/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageProps} from './ImageProps';

import resolveAssetSource from './resolveAssetSource';

/**
 * A function which returns the appropriate value for image source
 * by resolving the `source`, `src` and `srcSet` props.
 */
export function getImageSourcesFromImageProps(
  imageProps: ImageProps,
): ?ResolvedAssetSource | $ReadOnlyArray<{uri: string, ...}> {
  let source = resolveAssetSource(imageProps.source);

  let sources;

  const {crossOrigin, referrerPolicy, src, srcSet} = imageProps;

  const getHeaders = () => {
    const headers: {[string]: string} = {};
    if (crossOrigin === 'use-credentials') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    if (referrerPolicy != null) {
      headers['Referrer-Policy'] = referrerPolicy;
    }
    return headers;
  };

  if (srcSet != null) {
    const sourceList = [];
    const srcSetList = srcSet.split(', ');
    // `src` prop should be used with default scale if `srcSet` does not have 1x scale.
    let shouldUseSrcForDefaultScale = true;
    const {width, height} = imageProps;
    srcSetList.forEach(imageSrc => {
      const [uri, xScale = '1x'] = imageSrc.split(' ');
      const scale = parseInt(xScale.split('x')[0], 10);
      if (scale) {
        if (scale === 1) {
          // 1x scale is provided in `srcSet` prop so ignore the `src` prop if provided.
          shouldUseSrcForDefaultScale = false;
        }
        sourceList.push({headers: getHeaders(), scale, uri, width, height});
      }
    });

    if (shouldUseSrcForDefaultScale && src != null) {
      sourceList.push({
        headers: getHeaders(),
        scale: 1,
        uri: src,
        width,
        height,
      });
    }
    if (sourceList.length === 0) {
      console.warn('The provided value for srcSet is not valid.');
    }

    sources = sourceList;
  } else if (src != null) {
    const {width, height} = imageProps;
    sources = [{uri: src, headers: getHeaders(), width, height}];
  } else {
    sources = source;
  }
  return sources;
}

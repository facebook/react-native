/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule nativeImageSource
 * @flow
 */
'use strict';

const Platform = require('Platform');

type SourceSpec = {
  ios?: string,
  android?: string,

  // For more details on width and height, see
  // http://facebook.github.io/react-native/docs/images.html#why-not-automatically-size-everything
  width: number,
  height: number,
}

/**
 * In hybrid apps, use `nativeImageSource` to access images that are already available
 * on the native side, for example in Xcode Asset Catalogs or Android's drawable folder.
 *
 * However, keep in mind that React Native Packager does not guarantee that the image exists. If
 * the image is missing you'll get an empty box. When adding new images your app needs to be
 * recompiled.
 *
 * Prefer Static Image Resources system which provides more guarantees, automates measurements and
 * allows adding new images without rebuilding the native app. For more details visit:
 *
 *   http://facebook.github.io/react-native/docs/images.html
 *
 */
function nativeImageSource(spec: SourceSpec): Object {
  const uri = Platform.select(spec);
  if (!uri) {
    console.warn(`No image name given for ${Platform.OS}: ${JSON.stringify(spec)}`);
  }

  return {
    uri,
    width: spec.width,
    height: spec.height,
  };
}

module.exports = nativeImageSource;

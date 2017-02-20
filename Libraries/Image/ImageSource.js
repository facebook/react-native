/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ImageSource
 * @flow
 */
'use strict';

// This is to sync with ImageSourcePropTypes.js.

type ImageURISource = {
  uri?: string,
  bundle?: string,
  method?: string,
  headers?: Object,
  body?: string,
  cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached',
  width?: number,
  height?: number,
  scale?: number,
};

export type ImageSource = ImageURISource | number | Array<ImageURISource>;

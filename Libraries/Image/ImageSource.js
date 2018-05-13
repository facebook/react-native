/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

// This is to sync with ImageSourcePropTypes.js.

type ImageURISource = $ReadOnly<{|
  uri?: string,
  bundle?: string,
  method?: string,
  headers?: Object,
  body?: string,
  cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached',
  width?: number,
  height?: number,
  scale?: number,
|}>;

export type ImageSource = ImageURISource | number | Array<ImageURISource>;

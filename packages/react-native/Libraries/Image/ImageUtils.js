/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

type ResizeMode = 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';

const objectFitMap: {[string]: ResizeMode} = {
  contain: 'contain',
  cover: 'cover',
  fill: 'stretch',
  'scale-down': 'contain',
};

export function convertObjectFitToResizeMode(objectFit: ?string): ?ResizeMode {
  return objectFit != null ? objectFitMap[objectFit] : undefined;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * ImageObjectFit partially equals to ImageResizeMode, defines valid values for different image resizing modes set
 * via the `objectFit` style property on `<Image>`.
 */
export type ImageObjectFit =
  // Resize such that the entire area of the view is covered by the image,
  // potentially clipping parts of the image.
  | 'cover'

  // Resize by stretching it to fill the entire frame of the view without
  // clipping. This may change the aspect ratio of the image, distorting it.
  | 'fill'

  // Resize such that it will be completely visible, contained within the frame
  // of the View.
  | 'scale-down'

  // Resize such that it will be completely visible, contained within the frame
  // of the View.
  | 'contain';

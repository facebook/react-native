/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Accelerate/Accelerate.h>
#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTDefines.h>

RCT_EXTERN UIImage *RCTBlurredImageWithRadius(UIImage *inputImage, CGFloat radius);

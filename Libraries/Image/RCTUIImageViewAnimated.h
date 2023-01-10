/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTAnimatedImage.h>
#import <React/RCTDefines.h>

#if !TARGET_OS_OSX // [macOS]
@interface RCTUIImageViewAnimated : UIImageView
#else // [macOS
@interface RCTUIImageViewAnimated : NSImageView
#endif  // macOS]

@end

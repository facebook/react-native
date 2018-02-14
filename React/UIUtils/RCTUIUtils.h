/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

#ifdef __cplusplus
extern "C" {
#endif

// Get window and screen dimensions
typedef struct {
  struct {
    CGFloat width, height, scale, fontScale;
  } window, screen;
} RCTDimensions;
extern __attribute__((visibility("default")))
RCTDimensions RCTGetDimensions(CGFloat fontScale);

// Get font size multiplier for font base size (Large) by content size category
extern __attribute__((visibility("default")))
CGFloat RCTGetMultiplierForContentSizeCategory(UIContentSizeCategory category);

#ifdef __cplusplus
}
#endif

NS_ASSUME_NONNULL_END

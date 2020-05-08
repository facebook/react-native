/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

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
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
RCTDimensions RCTGetDimensions(CGFloat fontScale);
#else // [TODO(macOS ISS#2323203)
RCTDimensions RCTGetDimensions(RCTPlatformView *rootView);
#endif // ]TODO(macOS ISS#2323203)

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
// Get font size multiplier for font base size (Large) by content size category
extern __attribute__((visibility("default")))
CGFloat RCTGetMultiplierForContentSizeCategory(UIContentSizeCategory category);
#endif // TODO(macOS ISS#2323203)

#ifdef __cplusplus
}
#endif

NS_ASSUME_NONNULL_END

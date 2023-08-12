/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTResizeMode) {
#if !TARGET_OS_OSX // [macOS]
  RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  RCTResizeModeStretch = UIViewContentModeScaleToFill,
  RCTResizeModeCenter = UIViewContentModeCenter,
#else // [macOS
  RCTResizeModeCover = -2, // Not supported by NSImageView
  RCTResizeModeContain = NSImageScaleProportionallyUpOrDown,
  RCTResizeModeStretch = NSImageScaleAxesIndependently,
  RCTResizeModeCenter = NSImageScaleNone, // assumes NSImageAlignmentCenter
#endif // macOS]
  RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface RCTConvert (RCTResizeMode)

+ (RCTResizeMode)RCTResizeMode:(id)json;

@end

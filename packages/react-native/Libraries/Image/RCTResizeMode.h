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

static inline RCTResizeMode RCTResizeModeFromUIViewContentMode(UIViewContentMode mode)
{
  switch (mode) {
    case UIViewContentModeScaleToFill:
      return RCTResizeModeStretch;
      break;
    case UIViewContentModeScaleAspectFit:
      return RCTResizeModeContain;
      break;
    case UIViewContentModeScaleAspectFill:
      return RCTResizeModeCover;
      break;
    case UIViewContentModeCenter:
      return RCTResizeModeCenter;
      break;
#if !TARGET_OS_OSX // [macOS]
    case UIViewContentModeRedraw:
    case UIViewContentModeTop:
    case UIViewContentModeBottom:
    case UIViewContentModeLeft:
    case UIViewContentModeRight:
    case UIViewContentModeTopLeft:
    case UIViewContentModeTopRight:
    case UIViewContentModeBottomLeft:
    case UIViewContentModeBottomRight:
      return RCTResizeModeRepeat;
#endif // [macOS]
  }
};

@interface RCTConvert (RCTResizeMode)

+ (RCTResizeMode)RCTResizeMode:(id)json;

@end

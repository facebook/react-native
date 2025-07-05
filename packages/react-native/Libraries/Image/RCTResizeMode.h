/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTResizeMode) {
  RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  RCTResizeModeStretch = UIViewContentModeScaleToFill,
  RCTResizeModeCenter = UIViewContentModeCenter,
  RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
  RCTResizeModeNone = UIViewContentModeTopLeft,
};

static inline RCTResizeMode RCTResizeModeFromUIViewContentMode(UIViewContentMode mode)
{
  switch (mode) {
    case UIViewContentModeScaleToFill:
      return RCTResizeModeStretch;
    case UIViewContentModeScaleAspectFit:
      return RCTResizeModeContain;
    case UIViewContentModeScaleAspectFill:
      return RCTResizeModeCover;
    case UIViewContentModeTopLeft:
      return RCTResizeModeNone;
    case UIViewContentModeRedraw:
    case UIViewContentModeTop:
    case UIViewContentModeBottom:
    case UIViewContentModeLeft:
    case UIViewContentModeRight:
    case UIViewContentModeTopRight:
    case UIViewContentModeBottomLeft:
    case UIViewContentModeBottomRight:
      return RCTResizeModeRepeat;
    case UIViewContentModeCenter:
    default:
      return RCTResizeModeCenter;
  }
};

@interface RCTConvert (RCTResizeMode)

+ (RCTResizeMode)RCTResizeMode:(id)json;

@end

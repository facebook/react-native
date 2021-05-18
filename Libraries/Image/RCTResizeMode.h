/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTResizeMode) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTResizeModeCover = UIViewContentModeScaleAspectFill,
  RCTResizeModeContain = UIViewContentModeScaleAspectFit,
  RCTResizeModeStretch = UIViewContentModeScaleToFill,
  RCTResizeModeCenter = UIViewContentModeCenter,
#else // [TODO(macOS GH#774)
  RCTResizeModeCover = -2, // Not supported by NSImageView
  RCTResizeModeContain = NSImageScaleProportionallyUpOrDown,
  RCTResizeModeStretch = NSImageScaleAxesIndependently,
  RCTResizeModeCenter = NSImageScaleNone, // assumes NSImageAlignmentCenter
#endif // ]TODO(macOS GH#774)
  RCTResizeModeRepeat = -1, // Use negative values to avoid conflicts with iOS enum values.
};

@interface RCTConvert(RCTResizeMode)

+ (RCTResizeMode)RCTResizeMode:(id)json;

@end

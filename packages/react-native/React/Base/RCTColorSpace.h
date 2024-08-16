/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTColorSpace) {
  RCTColorSpaceSRGB,
  RCTColorSpaceDisplayP3,
};

// Change the default color space
RCTColorSpace RCTGetDefaultColorSpace(void);
RCT_EXTERN void RCTSetDefaultColorSpace(RCTColorSpace colorSpace);
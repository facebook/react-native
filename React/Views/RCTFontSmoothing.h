/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// [macOS]

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTFontSmoothing) {
  RCTFontSmoothingAuto = 0,
  RCTFontSmoothingNone,
  RCTFontSmoothingAntialiased,
  RCTFontSmoothingSubpixelAntialiased,
};
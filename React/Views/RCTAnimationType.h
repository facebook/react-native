/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTAnimationType) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTAnimationTypeSpring = 0,
#endif // TODO(macOS GH#774)
  RCTAnimationTypeLinear,
  RCTAnimationTypeEaseIn,
  RCTAnimationTypeEaseOut,
  RCTAnimationTypeEaseInEaseOut,
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTAnimationTypeKeyboard,
#endif // TODO(macOS GH#774)
};

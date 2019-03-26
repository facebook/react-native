/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTAnimationType) {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  RCTAnimationTypeSpring = 0,
#endif // TODO(macOS ISS#2323203)
  RCTAnimationTypeLinear,
  RCTAnimationTypeEaseIn,
  RCTAnimationTypeEaseOut,
  RCTAnimationTypeEaseInEaseOut,
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  RCTAnimationTypeKeyboard,
#endif // TODO(macOS ISS#2323203)
};

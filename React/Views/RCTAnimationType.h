/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RCTAnimationType) {
  RCTAnimationTypeSpring = 0,
  RCTAnimationTypeLinear,
  RCTAnimationTypeEaseIn,
  RCTAnimationTypeEaseOut,
  RCTAnimationTypeEaseInEaseOut,
  RCTAnimationTypeKeyboard,
};

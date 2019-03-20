/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTResizeMode.h"

@implementation RCTConvert(RCTResizeMode)

RCT_ENUM_CONVERTER(RCTResizeMode, (@{
  @"cover": @(RCTResizeModeCover),
  @"contain": @(RCTResizeModeContain),
  @"stretch": @(RCTResizeModeStretch),
  @"center": @(RCTResizeModeCenter),
  @"repeat": @(RCTResizeModeRepeat),
}), RCTResizeModeStretch, integerValue)

@end

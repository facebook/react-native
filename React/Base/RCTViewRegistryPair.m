/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTViewRegistryPair.h"

@implementation RCTViewRegistryPair

- (instancetype)initWithView:(UIView *)view viewController:(UIViewController *)viewController {
  return [super initWithFirst:view second:viewController];
}

- (UIView *)view {
  return self.first;
}

- (UIViewController *)viewController {
  return self.second;
}

- (id<RCTComponent>)component {
  return self.first;
}

@end

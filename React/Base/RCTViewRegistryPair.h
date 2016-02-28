/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTComponentRetrievable.h"
#import "RCTPair.h"

@interface RCTViewRegistryPair<RCTComponentRetrievable> : RCTPair<UIView *, UIViewController *>

@property (nonatomic, strong, readonly) UIView *view;
@property (nonatomic, strong, readonly) UIViewController *viewController;

- (instancetype)initWithView:(UIView *)view viewController:(UIViewController *)viewController;

@end

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropCoordinator.h"
#import <React/RCTViewManager.h>

@implementation RCTLegacyViewManagerInteropCoordinator {
  RCTViewManager *_viewManager;
}

- (instancetype)initWithViewManager:(RCTViewManager *)viewManager;
{
  if (self = [super init]) {
    _viewManager = viewManager;
  }
  return self;
}

- (UIView *)view
{
  return _viewManager.view;
}

@end

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import "RCTWrapperExampleViewController.h"

#import <RCTWrapper/RCTWrapper.h>

#import "RCTWrapperExampleView.h"

@implementation RCTWrapperExampleViewController

- (void)loadView {
  self.view = [RCTWrapperExampleView new];
}

@end

RCT_WRAPPER_FOR_VIEW_CONTROLLER(RCTWrapperExampleViewController)

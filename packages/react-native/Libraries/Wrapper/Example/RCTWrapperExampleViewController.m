/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWrapperExampleViewController.h"

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <RCTWrapper/RCTWrapper.h>

#import "RCTWrapperExampleView.h"

@implementation RCTWrapperExampleViewController

- (void)loadView
{
  self.view = [RCTWrapperExampleView new];
}

@end

RCT_WRAPPER_FOR_VIEW_CONTROLLER(RCTWrapperExampleViewController)

#endif // RCT_FIT_RM_OLD_COMPONENT

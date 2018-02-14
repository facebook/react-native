// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTWrapperExampleViewController.h"

#import <RCTWrapper/RCTWrapper.h>

#import "RCTWrapperExampleView.h"

@implementation RCTWrapperExampleViewController

- (void)loadView {
  self.view = [RCTWrapperExampleView new];
}

@end

RCT_WRAPPER_FOR_VIEW_CONTROLLER(RCTWrapperExampleViewController)

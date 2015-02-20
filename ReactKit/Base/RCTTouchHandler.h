// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTBridge;

@interface RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end

// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTInvalidating.h"

@class RCTBridge;

@interface RCTTouchHandler : UIGestureRecognizer<RCTInvalidating>

- (instancetype)initWithBridge:(RCTBridge *)bridge;
- (void)startOrResetInteractionTiming;
- (NSDictionary *)endAndResetInteractionTiming;

@end

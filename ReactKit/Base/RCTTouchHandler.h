// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTEventDispatcher;

@interface RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
                               rootView:(UIView *)rootView;

@end

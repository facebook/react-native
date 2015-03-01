// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTInvalidating.h"

@class RCTEventDispatcher;

@interface RCTNavigator : UIView <RCTInvalidating>

@property (nonatomic, strong) UIView *reactNavSuperviewLink;
@property (nonatomic, assign) NSInteger requestedTopOfStack;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

/**
 * Schedules a JavaScript navigation and prevents `UIKit` from navigating until
 * JavaScript has sent its scheduled navigation.
 *
 * @returns Whether or not a JavaScript driven navigation could be
 * scheduled/reserved. If returning `NO`, JavaScript should usually just do
 * nothing at all.
 */
- (BOOL)requestSchedulingJavaScriptNavigation;

@end

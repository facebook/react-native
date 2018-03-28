/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTFrameUpdate.h>

@class RCTBridge;

@interface RCTNavigator : UIView <RCTFrameUpdateObserver>

@property (nonatomic, strong) UIView *reactNavSuperviewLink;
@property (nonatomic, assign) NSInteger requestedTopOfStack;
@property (nonatomic, assign) BOOL interactivePopGestureEnabled;

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

/**
 * Schedules a JavaScript navigation and prevents `UIKit` from navigating until
 * JavaScript has sent its scheduled navigation.
 *
 * @returns Whether or not a JavaScript driven navigation could be
 * scheduled/reserved. If returning `NO`, JavaScript should usually just do
 * nothing at all.
 */
- (BOOL)requestSchedulingJavaScriptNavigation;

- (void)uiManagerDidPerformMounting;

@end

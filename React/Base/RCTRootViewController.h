/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTRootView;

@protocol RCTRootViewControllerProtocol <NSObject>

/**
 * RCTStatusBarManager calls this to update the status bar style.
 *
 * Conforming view controllers should use this to update preferred status bar style
 */
- (void)updateStatusBarStyle:(UIStatusBarStyle)style
                      hidden:(BOOL)hidden
                   animation:(UIStatusBarAnimation)animation
                    animated:(BOOL)animate;

@end

@interface RCTRootViewController : UIViewController <RCTRootViewControllerProtocol>

/**
 * - Designated initializer -
 */
- (instancetype)initWithRootView:(RCTRootView *)rootView NS_DESIGNATED_INITIALIZER;

/**
 * The root view used by the view controller.
 */
@property (nonatomic, strong, readonly) RCTRootView *rootView;

/**
 * See: RCTRootViewControllerProtocol
 */
- (void)updateStatusBarStyle:(UIStatusBarStyle)style
                      hidden:(BOOL)hidden
                   animation:(UIStatusBarAnimation)animation
                    animated:(BOOL)animate;

@end

NS_ASSUME_NONNULL_END

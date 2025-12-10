/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if RNTESTER_USE_APPDELEGATE

#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <RCTReactNativeFactory.h>
#import <UIKit/UIKit.h>

@interface AppDelegate : RCTDefaultReactNativeFactoryDelegate <UIApplicationDelegate>

@property (nonatomic, strong, nonnull) UIWindow *window;
@property (nonatomic, strong, nonnull) RCTReactNativeFactory *reactNativeFactory;

@end

#else

#import <UIKit/UIKit.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@end

#endif

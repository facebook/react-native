/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <RCTReactNativeFactory.h>
#import <UIKit/UIKit.h>

@class ReactNativeDelegate;
@class RCTReactNativeFactory;

@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>

@property (strong, nonatomic) UIWindow *window;
@property (strong, nonatomic) ReactNativeDelegate *reactNativeDelegate;
@property (strong, nonatomic) RCTReactNativeFactory *reactNativeFactory;

- (NSDictionary *)prepareInitialProps;

@end

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate

@end

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class RCTReactNativeFactory;

NS_ASSUME_NONNULL_BEGIN

API_AVAILABLE(ios(13.0))
@interface RCTSceneDelegate : UIResponder <UIWindowSceneDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, weak) RCTReactNativeFactory *reactNativeFactory;

@end

NS_ASSUME_NONNULL_END

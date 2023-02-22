/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@class RCTBridge;

#if !TARGET_OS_OSX // [macOS]
@interface AppDelegate : UIResponder <UIApplicationDelegate>
#else // [macOS
@interface AppDelegate : NSObject <NSApplicationDelegate>
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, strong) UIWindow *window;
#else // [macOS
@property (nonatomic, strong) NSWindow *window;
#endif // macOS]

@property (nonatomic, readonly) RCTBridge *bridge;

@end

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTConvert.h>
#import <React/RCTEventEmitter.h>

@interface RCTConvert (UIStatusBar)

#if !TARGET_OS_OSX // [macOS]
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif // [macOS]

@end

@interface RCTStatusBarManager : RCTEventEmitter

@end

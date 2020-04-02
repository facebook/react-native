/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <React/RCTConvert.h>
#import <React/RCTEventEmitter.h>

@interface RCTConvert (UIStatusBar)

#if !TARGET_OS_TV && !TARGET_OS_OSX // TODO(macOS ISS#2323203)
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface RCTStatusBarManager : RCTEventEmitter

@end

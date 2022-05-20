/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)

@interface RCTLogBoxWindow : UIWindow // TODO(macOS GH#774) Renamed from _view to _window

- (instancetype)initWithFrame:(CGRect)frame;

- (void)createRootViewController:(UIView *)view;

- (instancetype)initWithFrame:(CGRect)frame bridge:(RCTBridge *)bridge;

- (void)hide; // TODO(macOS GH#774)

- (void)show;

@end

#else // [TODO(macOS GH#774)

@interface RCTLogBoxWindow : NSWindow // TODO(macOS GH#774) Renamed from _view to _window

- (instancetype)initWithBridge:(RCTBridge *)bridge;

- (void)hide;

- (void)show;

@end

#endif // ]TODO(macOS GH#774)

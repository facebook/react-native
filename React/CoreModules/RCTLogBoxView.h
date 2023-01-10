/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUIKit.h> // [macOS]

#if !TARGET_OS_OSX // [macOS]

@interface RCTLogBoxView : UIWindow

- (instancetype)initWithFrame:(CGRect)frame;

- (void)createRootViewController:(UIView *)view;

- (instancetype)initWithFrame:(CGRect)frame surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;

- (instancetype)initWithWindow:(UIWindow *)window bridge:(RCTBridge *)bridge;

- (void)show;

@end

#else // [macOS

@interface RCTLogBoxView : NSWindow

- (instancetype)initWithSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;

- (instancetype)initWithBridge:(RCTBridge *)bridge;

- (void)setHidden:(BOOL)hidden;

- (void)show;

@end

#endif // macOS]

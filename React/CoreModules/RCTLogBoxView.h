/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)

@interface RCTLogBoxView : UIWindow

- (instancetype)initWithFrame:(CGRect)frame;

- (void)createRootViewController:(UIView *)view;

- (instancetype)initWithFrame:(CGRect)frame surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;

- (instancetype)initWithWindow:(UIWindow *)window bridge:(RCTBridge *)bridge;

- (void)show;

@end

#else // [TODO(macOS GH#774)

@interface RCTLogBoxView : NSWindow // TODO(macOS GH#774)

- (instancetype)initWithSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;

- (instancetype)initWithBridge:(RCTBridge *)bridge;

- (void)setHidden:(BOOL)hidden;

- (void)show;

@end

#endif // ]TODO(macOS GH#774)

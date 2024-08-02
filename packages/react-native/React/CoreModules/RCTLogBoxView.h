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
#else // [macOS
@interface RCTLogBoxView : NSWindow
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
- (instancetype)initWithFrame:(CGRect)frame;
#endif // [macOS]

- (void)createRootViewController:(RCTUIView *)view; // [macOS]

- (instancetype)initWithWindow:(RCTUIWindow *)window bridge:(RCTBridge *)bridge; // [macOS]
- (instancetype)initWithWindow:(RCTUIWindow *)window surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter; // [macOS]

- (void)show;
#if TARGET_OS_OSX // [macOS
- (void)setHidden:(BOOL)hidden;
#endif // macOS]

@end



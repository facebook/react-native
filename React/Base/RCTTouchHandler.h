/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTFrameUpdate.h>

@class RCTBridge;

@interface RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)attachToView:(RCTUIView *)view; // [macOS]
- (void)detachFromView:(RCTUIView *)view; // [macOS]

- (void)cancel;
#if TARGET_OS_OSX // [macOS
- (void)willShowMenuWithEvent:(NSEvent*)event;
#endif // macOS]

@end

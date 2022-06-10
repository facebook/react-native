/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTFrameUpdate.h>

@class RCTBridge;

@interface RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)attachToView:(RCTUIView *)view; // TODO(macOS ISS#3536887)
- (void)detachFromView:(RCTUIView *)view; // TODO(macOS ISS#3536887)

- (void)cancel;
#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)willShowMenuWithEvent:(NSEvent*)event;
#endif // ]TODO(macOS GH#774)

@end

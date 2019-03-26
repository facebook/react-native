/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <React/RCTFrameUpdate.h>

@class RCTBridge;

@interface RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (void)attachToView:(UIView *)view;
- (void)detachFromView:(UIView *)view;

- (void)cancel;
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)willShowMenuWithEvent:(NSEvent*)event;
#endif // ]TODO(macOS ISS#2323203)

@end

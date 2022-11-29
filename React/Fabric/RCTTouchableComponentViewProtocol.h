/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)
#import <react/renderer/components/view/TouchEventEmitter.h>

@protocol RCTTouchableComponentViewProtocol <NSObject>
- (facebook::react::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end

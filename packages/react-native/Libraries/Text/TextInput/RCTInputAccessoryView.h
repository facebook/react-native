/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

@class RCTBridge;
@class RCTInputAccessoryViewContent;

@interface RCTInputAccessoryView : RCTUIView // [macOS]

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end

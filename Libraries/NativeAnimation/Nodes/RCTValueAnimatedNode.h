/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimatedNode.h"
#import <UIKit/UIKit.h>

@class RCTValueAnimatedNode;

@protocol RCTValueAnimatedNodeObserver <NSObject>

- (void)animatedNode:(RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value;

@end

@interface RCTValueAnimatedNode : RCTAnimatedNode

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, weak) id<RCTValueAnimatedNodeObserver> valueObserver;

@end

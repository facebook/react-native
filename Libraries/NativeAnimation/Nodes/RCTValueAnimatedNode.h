/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "RCTAnimatedNode.h"

@class RCTValueAnimatedNode;

@protocol RCTValueAnimatedNodeObserver <NSObject>

- (void)animatedNode:(RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value;

@end

@interface RCTValueAnimatedNode : RCTAnimatedNode

- (void)setOffset:(CGFloat)offset;
- (void)flattenOffset;
- (void)extractOffset;

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, strong) id animatedObject;
@property (nonatomic, weak) id<RCTValueAnimatedNodeObserver> valueObserver;

@end

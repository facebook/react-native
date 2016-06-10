/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import "RCTBridgeModule.h"

@class RCTValueAnimatedNode;

NS_ASSUME_NONNULL_BEGIN

@interface RCTAnimationDriverNode : NSObject

@property (nonatomic, readonly) NSNumber *animationId;
@property (nonatomic, readonly) NSNumber *outputValue;

@property (nonatomic, readonly) BOOL animationHasBegun;
@property (nonatomic, readonly) BOOL animationHasFinished;

- (instancetype)initWithId:(NSNumber *)animationId
                     delay:(NSTimeInterval)delay
                   toValue:(CGFloat)toValue
                    frames:(NSArray<NSNumber *> *)frames
                   forNode:(RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback NS_DESIGNATED_INITIALIZER;

- (void)startAnimation;
- (void)stopAnimation;
- (void)stepAnimation;
- (void)removeAnimation;
- (void)cleanupAnimationUpdate;

@end

NS_ASSUME_NONNULL_END

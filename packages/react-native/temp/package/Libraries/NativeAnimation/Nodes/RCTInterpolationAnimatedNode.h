/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTValueAnimatedNode.h"

#import <React/RCTDefines.h>

NS_ASSUME_NONNULL_BEGIN

RCT_EXTERN NSString *RCTInterpolateString(
    NSString *pattern,
    CGFloat inputValue,
    NSArray<NSNumber *> *inputRange,
    NSArray<NSArray<NSNumber *> *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight);

@interface RCTInterpolationAnimatedNode : RCTValueAnimatedNode

@end

NS_ASSUME_NONNULL_END

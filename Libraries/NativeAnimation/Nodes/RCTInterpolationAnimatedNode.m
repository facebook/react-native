/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInterpolationAnimatedNode.h"

#import "RCTAnimationUtils.h"

@implementation RCTInterpolationAnimatedNode
{
  __weak RCTValueAnimatedNode *_parentNode;
  NSArray<NSNumber *> *_inputRange;
  NSArray<NSNumber *> *_outputRange;
  NSString *_extrapolateLeft;
  NSString *_extrapolateRight;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _inputRange = [config[@"inputRange"] copy];
    NSMutableArray *outputRange = [NSMutableArray array];
    for (id value in config[@"outputRange"]) {
      if ([value isKindOfClass:[NSNumber class]]) {
        [outputRange addObject:value];
      }
    }
    _outputRange = [outputRange copy];
    _extrapolateLeft = config[@"extrapolateLeft"];
    _extrapolateRight = config[@"extrapolateRight"];
  }
  return self;
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[RCTValueAnimatedNode class]]) {
    _parentNode = (RCTValueAnimatedNode *)parent;
  }
}

- (void)onDetachedFromNode:(RCTAnimatedNode *)parent
{
  [super onDetachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (void)performUpdate
{
  [super performUpdate];
  if (!_parentNode) {
    return;
  }

  CGFloat inputValue = _parentNode.value;

  self.value = RCTInterpolateValueInRange(inputValue,
                                          _inputRange,
                                          _outputRange,
                                          _extrapolateLeft,
                                          _extrapolateRight);
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

- (void)performUpdate
{
  [super performUpdate];
  _parentNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"parent"]];
  if (!_parentNode) {
    return;
  }
  
  CGFloat inputValue = _parentNode.value;
  
  NSUInteger rangeIndex = RCTFindIndexOfNearestValue(inputValue, _inputRange);
  CGFloat inputMin = _inputRange[rangeIndex].doubleValue;
  CGFloat inputMax = _inputRange[rangeIndex + 1].doubleValue;
  
  NSNumber *minTag = _outputRange[rangeIndex];
  RCTValueAnimatedNode *outputMin = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:minTag];
  
  NSNumber *maxTag = _outputRange[rangeIndex + 1];
  RCTValueAnimatedNode *outputMax = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:maxTag];
  
  CGFloat outputMinValue = outputMin.value;
  CGFloat outputMaxValue = outputMax.value;
  
  self.value = RCTInterpolateValue(inputValue,
                                   inputMin,
                                   inputMax,
                                   outputMinValue,
                                   outputMaxValue,
                                   _extrapolateLeft,
                                   _extrapolateRight);
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTInterpolationAnimatedNode.h"
#import "RCTAnimation.h"

@interface RCTInterpolationAnimatedNode ()

@property (nonatomic, weak) RCTValueAnimatedNode *parentNode;
@property (nonatomic, strong) NSArray *inputRange;
@property (nonatomic, strong) NSArray *outputRange;

@end

@implementation RCTInterpolationAnimatedNode

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary *)config {
  self = [super initWithTag:tag config:config];
  if (self) {
    self.inputRange = config[@"inputRange"];
    NSMutableArray *outputRange = [NSMutableArray array];
    for (id value in config[@"outputRange"]) {
      if ([value isKindOfClass:[NSNumber class]]) {
        [outputRange addObject:value];
      }
      if ([value isKindOfClass:[NSString class]]) {
        NSString *str = (NSString *)value;
        if ([str containsString:@"deg"]) {
          NSString *newString = [str stringByReplacingOccurrencesOfString:@"deg" withString:@""];
          double degrees = newString.floatValue;
          [outputRange addObject:@(DegreesToRadians(degrees))];
        } else if ([str containsString:@"rad"]) {
          NSString *newString = [str stringByReplacingOccurrencesOfString:@"rad" withString:@""];
          [outputRange addObject:@(newString.floatValue)];
        }
        
      }
    }
    
    self.outputRange = outputRange;
  }
  return self;
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent {
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[RCTValueAnimatedNode class]]) {
    self.parentNode = (RCTValueAnimatedNode *)parent;
  }
  
}

- (void)onDettachedFromNode:(RCTAnimatedNode *)parent {
  [super onDettachedFromNode:parent];
  if (self.parentNode == parent) {
    self.parentNode = nil;
  }
}

- (NSUInteger)findIndexOfNearestValue:(CGFloat)value inRange:(NSArray<NSNumber *> *)range {
  NSUInteger index;
  NSUInteger rangeCount = range.count;
  
  for (index = 1; index < rangeCount - 1; index++) {
    NSNumber *inputValue = range[index];
    if (inputValue.floatValue >= value) {
      break;
    }
  }
  return index - 1;
}

- (void)performUpdate {
  [super performUpdate];
  if (!self.parentNode) {
    return;
  }
  
  NSUInteger rangeIndex = [self findIndexOfNearestValue:self.parentNode.value inRange:self.inputRange];
  NSNumber *inputMin = self.inputRange[rangeIndex];
  NSNumber *inputMax = self.inputRange[rangeIndex + 1];
  NSNumber *outputMin = self.outputRange[rangeIndex];
  NSNumber *outputMax = self.outputRange[rangeIndex + 1];
  
  double outputValue = InterpolateValue(self.parentNode.value,
                                        inputMin.floatValue,
                                        inputMax.floatValue,
                                        outputMin.floatValue,
                                        outputMax.floatValue);
  self.value = outputValue;
}

@end

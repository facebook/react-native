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

- (NSUInteger)findRangeIndexForValue:(NSNumber *)value {
  NSUInteger index;
  for (index = 1; index < self.inputRange.count - 1; index++) {
    NSNumber *inputValue = self.inputRange[index];
    if (inputValue.doubleValue >= value.doubleValue) {
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
  
  NSUInteger rangeIndex = [self findRangeIndexForValue:self.parentNode.value];
  NSNumber *inputMin = self.inputRange[rangeIndex];
  NSNumber *inputMax = self.inputRange[rangeIndex + 1];
  NSNumber *outputMin = self.outputRange[rangeIndex];
  NSNumber *outputMax = self.outputRange[rangeIndex + 1];
  
  double outputValue = RemapValue(self.parentNode.value.doubleValue,
                                  inputMin.doubleValue,
                                  inputMax.doubleValue,
                                  outputMin.doubleValue,
                                  outputMax.doubleValue);
  self.value = @(outputValue);
}

@end

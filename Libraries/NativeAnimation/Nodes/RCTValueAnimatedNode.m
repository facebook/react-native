/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTValueAnimatedNode.h>

@interface RCTValueAnimatedNode ()

@property (nonatomic, assign) CGFloat offset;

@end

@implementation RCTValueAnimatedNode

@synthesize value = _value;

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _offset = [self.config[@"offset"] floatValue];
    _value = [self.config[@"value"] floatValue];
  }
  return self;
}

- (void)flattenOffset
{
  _value += _offset;
  _offset = 0;
}

- (void)extractOffset
{
  _offset += _value;
  _value = 0;
}

- (CGFloat)value
{
  return _value + _offset;
}

- (void)setValue:(CGFloat)value
{
  _value = value;

  if (_valueObserver) {
    [_valueObserver animatedNode:self didUpdateValue:_value];
  }
}

@end

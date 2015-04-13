#import "RCTSlider.h"

@implementation RCTSlider {
  float _value;
}

- (void)setValue:(float)value
{
  _value = value;
  [super setValue:value];
}

- (void)setMinimumValue:(float)minimumValue
{
  [super setMinimumValue:minimumValue];
  [super setValue:_value];
}

- (void)setMaximumValue:(float)maximumValue
{
  [super setMaximumValue:maximumValue];
  [super setValue:_value];
}

@end

//
//  RCTSegmentedControl.m
//  React
//
//  Created by Clay Allsopp on 3/31/15.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import "RCTSegmentedControl.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

@implementation RCTSegmentedControl
{
  RCTEventDispatcher *_eventDispatcher;
}

- (id)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
    _selectedIndex = self.selectedSegmentIndex;
    [self addTarget:self action:@selector(onChange:)
   forControlEvents:UIControlEventValueChanged];
  }
  return self;
}

- (void)setValues:(NSArray *)values
{
  _values = [values copy];
  [self removeAllSegments];
  for (NSString *value in values) {
    [self insertSegmentWithTitle:value atIndex:self.numberOfSegments animated:NO];
  }
  super.selectedSegmentIndex = _selectedIndex;
}

- (void)setSelectedIndex:(NSInteger)selectedIndex
{
  _selectedIndex = selectedIndex;
  super.selectedSegmentIndex = selectedIndex;
}

- (void)onChange:(UISegmentedControl *)sender
{
  NSDictionary *event = @{
    @"target": self.reactTag,
    @"value": [self titleForSegmentAtIndex:sender.selectedSegmentIndex],
    @"selectedSegmentIndex": @(sender.selectedSegmentIndex)
  };
  [_eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

@end

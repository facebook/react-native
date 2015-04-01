//
//  RCTSegmentedControl.m
//  React
//
//  Created by Clay Allsopp on 3/31/15.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import "RCTSegmentedControl.h"
#import "UIView+React.h"
#import "RCTEventDispatcher.h"

@implementation RCTSegmentedControl
{
  RCTEventDispatcher *_eventDispatcher;
}

- (id)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
  }
  return self;
}


- (void)setValuesAndSelectedSegmentIndex:(NSDictionary *)valuesAndSelectedSegmentIndex
{
  [self removeAllSegments];

  NSArray *values = valuesAndSelectedSegmentIndex[@"values"];
  NSNumber *selectedSegmentIndex = valuesAndSelectedSegmentIndex[@"selectedSegmentIndex"];

  NSUInteger insertAtIndex = 0;
  for (NSString *value in values) {
    [self insertSegmentWithTitle:value atIndex:insertAtIndex animated:NO];
    insertAtIndex += 1;
  }

  if (selectedSegmentIndex) {
    [self setSelectedSegmentIndex:[selectedSegmentIndex integerValue]];
  }
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

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPicker.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"

const NSInteger UNINITIALIZED_INDEX = -1;

@interface RCTPicker() <UIPickerViewDataSource, UIPickerViewDelegate>

@end

@implementation RCTPicker
{
  RCTEventDispatcher *_eventDispatcher;
  NSArray *_items;
  NSInteger _selectedIndex;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
    _selectedIndex = UNINITIALIZED_INDEX;
    self.delegate = self;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)setItems:(NSArray *)items
{
  _items = [items copy];
  [self setNeedsLayout];
}

- (void)setSelectedIndex:(NSInteger)selectedIndex
{
  if (_selectedIndex != selectedIndex) {
    BOOL animated = _selectedIndex != UNINITIALIZED_INDEX; // Don't animate the initial value
    _selectedIndex = selectedIndex;
    dispatch_async(dispatch_get_main_queue(), ^{
      [self selectRow:selectedIndex inComponent:0 animated:animated];
    });
  }
}

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView
numberOfRowsInComponent:(__unused NSInteger)component
{
  return _items.count;
}

#pragma mark - UIPickerViewDelegate methods

- (NSDictionary *)itemForRow:(NSInteger)row
{
  return _items[row];
}

- (id)valueForRow:(NSInteger)row
{
  return [self itemForRow:row][@"value"];
}

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row forComponent:(__unused NSInteger)component
{
  return [self itemForRow:row][@"label"];
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
{
  _selectedIndex = row;
  NSDictionary *event = @{
    @"target": self.reactTag,
    @"newIndex": @(row),
    @"newValue": [self valueForRow:row]
  };

  [_eventDispatcher sendInputEventWithName:@"change" body:event];
}

@end

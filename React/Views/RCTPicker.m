/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPicker.h"

#import "RCTUtils.h"

@interface RCTPicker() <UIPickerViewDataSource, UIPickerViewDelegate>
@end

@implementation RCTPicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _selectedIndex = NSNotFound;
    self.delegate = self;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)setItems:(NSArray<NSDictionary *> *)items
{
  _items = [items copy];
  [self setNeedsLayout];
}

- (void)setSelectedIndex:(NSInteger)selectedIndex
{
  if (_selectedIndex != selectedIndex) {
    BOOL animated = _selectedIndex != NSNotFound; // Don't animate the initial value
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

- (UIView *)pickerView:(UIPickerView *)pickerView viewForRow:(NSInteger)row
 forComponent:(NSInteger)component reusingView:(UIView *)view {

  UILabel *retval = (UILabel*)view;
  if (!retval) {
      retval = [[UILabel alloc] initWithFrame:CGRectMake(0.0f, 0.0f, [pickerView rowSizeForComponent:component].width, [pickerView rowSizeForComponent:component].height)];
  }

  retval.font = [UIFont systemFontOfSize:[self fontSize]];
  retval.textColor = [self color];
  retval.textAlignment = [self textAlign];
  retval.text = [self itemForRow:row][@"label"];

  return retval;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
{
  _selectedIndex = row;
  if (_onChange) {
    _onChange(@{
      @"newIndex": @(row),
      @"newValue": [self valueForRow:row]
    });
  }
}

@end

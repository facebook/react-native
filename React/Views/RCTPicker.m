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
#import "RCTUtils.h"

@interface RCTPicker() <UIPickerViewDataSource, UIPickerViewDelegate>
@end

@implementation RCTPicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _color = [UIColor blackColor];
    _font = [UIFont systemFontOfSize:21]; // TODO: selected title default should be 23.5
    _textAlign = NSTextAlignmentCenter;
    self.delegate = self;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)setComponents:(NSArray<NSArray *> *)components
{
  _components = [components copy];
  [self setNeedsLayout];
}

- (void)setSelectedIndexes:(NSArray *)selectedIndexes
{
  if (_selectedIndexes != selectedIndexes) {
    BOOL animated = _selectedIndexes != nil; // Don't animate the initial value
    _selectedIndexes = selectedIndexes;
    dispatch_async(dispatch_get_main_queue(), ^{
      for (int component = 0; component < selectedIndexes.count; component++) {
        [self selectRow:[selectedIndexes[component] integerValue]
            inComponent:component
               animated:animated];
      }
    });
  }
}

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return _components.count;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView
numberOfRowsInComponent:(NSInteger)component
{
  return _components[component].count;
}

#pragma mark - UIPickerViewDelegate methods

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(NSInteger)component
{
  return [RCTConvert NSString:_components[component][row][@"label"]];
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UILabel *)label
{
  if (!label) {
    label = [[UILabel alloc] initWithFrame:(CGRect){
      CGPointZero,
      {
        [pickerView rowSizeForComponent:component].width,
        [pickerView rowSizeForComponent:component].height,
      }
    }];
  }
  
  label.font = _font;
  label.textColor = _color;
  label.textAlignment = _textAlign;
  label.text = [self pickerView:pickerView titleForRow:row forComponent:component];
  return label;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(NSInteger)component
{
  NSMutableArray *selectedIndexes = [NSMutableArray arrayWithArray:_selectedIndexes];
  selectedIndexes[component] = @(row);
  _selectedIndexes = [NSArray arrayWithArray:selectedIndexes];
  
  if (_onChange) {
    _onChange(@{
      @"component": @(component),
      @"newIndex": @(row),
      @"newValue": RCTNullIfNil(_components[component][row][@"value"]),
    });
  }
}

@end

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
    _selectedIndex = NSNotFound;
    _textAlign = NSTextAlignmentCenter;
    self.delegate = self;
    [self selectRow:0 inComponent:0 animated:YES]; // Workaround for missing selection indicator lines (see https://stackoverflow.com/questions/39564660/uipickerview-selection-indicator-not-visible-in-ios10)
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

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(__unused NSInteger)component
{
  return [RCTConvert NSString:_items[row][@"label"]];
}

- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(NSInteger)__unused component {
  return _font.pointSize + 19;
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

  label.textColor = [RCTConvert UIColor:_items[row][@"textColor"]] ?: _color;

  label.textAlignment = _textAlign;
  label.text = [self pickerView:pickerView titleForRow:row forComponent:component];
  return label;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row inComponent:(__unused NSInteger)component
{
  _selectedIndex = row;
  if (_onChange && _items.count > (NSUInteger)row) {
    _onChange(@{
      @"newIndex": @(row),
      @"newValue": RCTNullIfNil(_items[row][@"value"]),
    });
  }
}

@end

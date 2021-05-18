/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPicker.h"

#import "RCTConvert.h"
#import "RCTUtils.h"

@interface RCTPicker ()
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
  <UIPickerViewDataSource, UIPickerViewDelegate, UIPickerViewAccessibilityDelegate>
#else
  <NSComboBoxDataSource, NSComboBoxDelegate>
#endif // ]TODO(macOS GH#774)
@end

@implementation RCTPicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    _color = [RCTUIColor blackColor]; // TODO(OSS Candidate ISS#2710739)
    _font = [UIFont systemFontOfSize:21]; // TODO: selected title default should be 23.5
#else // [TODO(macOS GH#774)
    _color = [NSColor labelColor];
    [self setFont:[NSFont systemFontOfSize:[NSFont systemFontSize]]];
#endif // ]TODO(macOS GH#774)
    _selectedIndex = NSNotFound;
    _textAlign = NSTextAlignmentCenter;
    self.delegate = self;
#if TARGET_OS_OSX // [TODO(macOS GH#774)
    self.controlSize = NSControlSizeRegular;
    self.editable = NO;
    self.drawsBackground = NO;
    self.usesDataSource = YES;
    self.dataSource = self;
#else
    [self selectRow:0 inComponent:0
           animated:
               YES]; // Workaround for missing selection indicator lines (see
                     // https://stackoverflow.com/questions/39564660/uipickerview-selection-indicator-not-visible-in-ios10)
#endif // ]TODO(macOS GH#774)
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)setItems:(NSArray<NSDictionary *> *)items
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  _items = [items copy];
  [self setNeedsLayout];
#else // [TODO(macOS GH#774)
  CGFloat maxHeight = 0.0;
  NSMutableParagraphStyle *mutableParagraphStyle = [[NSMutableParagraphStyle alloc] init];
  mutableParagraphStyle.alignment = _textAlign;
  NSParagraphStyle *paragraphStyle = [mutableParagraphStyle copy];
  NSMutableArray *mutableItems = [[NSMutableArray alloc] initWithCapacity:items.count];
  for (NSDictionary *item in items) {
    NSMutableDictionary *mutableItem = item.mutableCopy;
    NSAttributedString *attrString = [[NSAttributedString alloc] initWithString:[RCTConvert NSString:item[@"label"]]
                                                                     attributes:@{NSForegroundColorAttributeName : [RCTConvert UIColor:item[@"textColor"]] ?: _color,
                                                                                  NSFontAttributeName: [self font] /* Use the font prop instead of the ivar so it's compatible on iOS and macOS TODO(OSS Candidate ISS#2710739) */,
                                                                                  NSParagraphStyleAttributeName: paragraphStyle}];
    NSSize size = attrString.size;
    if (size.height > maxHeight) {
      maxHeight = size.height;
    }
    mutableItem[@"label"] = attrString;
    [mutableItems addObject:mutableItem.copy];
  }
  self.itemHeight = maxHeight;
  _items = mutableItems.copy;
  self.needsLayout = YES;
#endif // ]TODO(macOS GH#774)
}

- (void)setSelectedIndex:(NSInteger)selectedIndex
{
  if (_selectedIndex != selectedIndex) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    BOOL animated = _selectedIndex != NSNotFound; // Don't animate the initial value
#endif // TODO(macOS GH#774)
    _selectedIndex = selectedIndex;
    dispatch_async(dispatch_get_main_queue(), ^{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
      [self selectRow:selectedIndex inComponent:0 animated:animated];
#else // [TODO(macOS GH#774)
      self.delegate = nil;
      [self selectItemAtIndex:selectedIndex];
      self.attributedStringValue = _items[selectedIndex][@"label"];
      self.delegate = self;
#endif // ]TODO(macOS GH#774)
    });
  }
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView numberOfRowsInComponent:(__unused NSInteger)component
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

- (CGFloat)pickerView:(__unused UIPickerView *)pickerView rowHeightForComponent:(NSInteger)__unused component
{
  return _font.pointSize + 19;
}

- (UIView *)pickerView:(UIPickerView *)pickerView
            viewForRow:(NSInteger)row
          forComponent:(NSInteger)component
           reusingView:(UILabel *)label
{
  if (!label) {
    label = [[UILabel alloc] initWithFrame:(CGRect){CGPointZero,
                                                    {
                                                        [pickerView rowSizeForComponent:component].width,
                                                        [pickerView rowSizeForComponent:component].height,
                                                    }}];
  }

  label.font = _font;

  label.textColor = [RCTConvert UIColor:_items[row][@"textColor"]] ?: _color;

  label.textAlignment = _textAlign;
  label.text = [self pickerView:pickerView titleForRow:row forComponent:component];
  return label;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(__unused NSInteger)component
{
// [TODO(macOS GH#774)
  [self didSelectRowAtIndex:row];
}

#pragma mark - UIPickerViewAccessibilityDelegate protocol

- (NSString *)pickerView:(UIPickerView *)pickerView accessibilityLabelForComponent:(NSInteger)component
{
  return super.accessibilityLabel;
}

#else

#pragma mark - NSComboBoxDataSource protocol

- (BOOL)usesDataSource
{
  return YES;
}

- (NSInteger)numberOfItemsInComboBox:(__unused NSComboBox *)theComboBox
{
  return _items.count;
}

- (id)comboBox:(__unused NSComboBox *)aComboBox objectValueForItemAtIndex:(NSInteger)index
{
  return index >= 0 ? _items[index][@"label"] : nil;
}

#pragma mark - NSComboBoxDelegate methods

- (void)comboBoxSelectionDidChange:(__unused NSNotification *)notification
{
  [self didSelectRowAtIndex:self.indexOfSelectedItem];
}

#endif

- (void)didSelectRowAtIndex:(NSInteger)idx
{
  _selectedIndex = idx;
  if (_onChange && _items.count > (NSUInteger)idx) {
// ]TODO(macOS GH#774)
    _onChange(@{
// [TODO(macOS GH#774)
      @"newIndex" : @(idx),
      @"newValue" : RCTNullIfNil(_items[idx][@"value"]),
// ]TODO(macOS GH#774)
    });
  }
}

@end

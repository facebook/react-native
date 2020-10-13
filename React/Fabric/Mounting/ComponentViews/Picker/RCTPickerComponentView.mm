/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPickerComponentView.h"

#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>
#import <react/renderer/components/iospicker/PickerComponentDescriptor.h>
#import <react/renderer/components/iospicker/PickerEventEmitter.h>
#import <react/renderer/components/iospicker/PickerProps.h>

#import "FBRCTFabricComponentsPlugins.h"
#import "RCTConversions.h"

using namespace facebook::react;

@interface RCTPickerComponentView () <UIPickerViewAccessibilityDelegate, UIPickerViewDelegate, UIPickerViewDataSource>

@end

@implementation RCTPickerComponentView {
  UIPickerView *_pickerView;
  UIColor *_textColor;
  UIFont *_font;
  NSTextAlignment _textAlignment;
  std::vector<PickerItemsStruct> _items;
  NSInteger _selectedIndex;
  NSString *_accessibilityLabel;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _pickerView = [[UIPickerView alloc] initWithFrame:self.bounds];
    self.contentView = _pickerView;
    [self setPropsToDefault];
  }

  return self;
}

- (void)setPropsToDefault
{
  static const auto defaultProps = std::make_shared<const PickerProps>();
  _props = defaultProps;

  _pickerView.delegate = self;
  _pickerView.dataSource = self;
  _textColor = [UIColor blackColor];
  _font = [UIFont systemFontOfSize:21];
  _textAlignment = NSTextAlignmentCenter;
  _selectedIndex = NSNotFound;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _selectedIndex = NSNotFound;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<PickerComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldPickerProps = *std::static_pointer_cast<const PickerProps>(_props);
  const auto &newPickerProps = *std::static_pointer_cast<const PickerProps>(props);

  if (oldPickerProps.items != newPickerProps.items) {
    _items = newPickerProps.items;
  }

  if (oldPickerProps.selectedIndex != newPickerProps.selectedIndex) {
    _selectedIndex = newPickerProps.selectedIndex;
  }

  // TODO (T75217510) - Figure out how to forward styling.
  if (oldPickerProps.style != newPickerProps.style) {
  }

  // TODO (T75217510) - Figure out testID.
  if (oldPickerProps.testID != newPickerProps.testID) {
  }

  if (oldPickerProps.accessibilityLabel != newPickerProps.accessibilityLabel) {
    _accessibilityLabel = [NSString stringWithUTF8String:newPickerProps.accessibilityLabel.c_str()];
  }

  [super updateProps:props oldProps:oldProps];
}

// TODO (T75217510) - Handle Native Commands
#pragma mark - Native Commands

#pragma mark - UIPickerViewDataSource protocol

- (NSInteger)numberOfComponentsInPickerView:(__unused UIPickerView *)pickerView
{
  return 1;
}

- (NSInteger)pickerView:(__unused UIPickerView *)pickerView numberOfRowsInComponent:(__unused NSInteger)component
{
  return _items.size();
}

#pragma mark - UIPickerViewDelegate methods

- (NSString *)pickerView:(__unused UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(__unused NSInteger)component
{
  return [NSString stringWithUTF8String:_items[row].label.c_str()];
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
  label.textColor = RCTUIColorFromSharedColor(_items[row].textColor) ?: _textColor;
  label.textAlignment = _textAlignment;
  label.text = [self pickerView:pickerView titleForRow:row forComponent:component];
  return label;
}

- (void)pickerView:(__unused UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(__unused NSInteger)component
{
  _selectedIndex = row;
  PickerEventEmitter::PickerIOSChangeEvent event = {.newValue = _items[row].value, .newIndex = (int)row};
  if (_eventEmitter) {
    std::static_pointer_cast<PickerEventEmitter const>(_eventEmitter)->onChange(event);
  }
}

#pragma mark - UIPickerViewAccessibilityDelegate protocol

- (NSString *)pickerView:(UIPickerView *)pickerView accessibilityLabelForComponent:(NSInteger)component
{
  return _accessibilityLabel;
}

@end

Class<RCTComponentViewProtocol> RCTPickerCls(void)
{
  return RCTPickerComponentView.class;
}

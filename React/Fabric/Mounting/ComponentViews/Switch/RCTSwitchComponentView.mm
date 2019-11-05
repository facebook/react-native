/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitchComponentView.h"

#import <react/components/rncore/ComponentDescriptors.h>
#import <react/components/rncore/EventEmitters.h>
#import <react/components/rncore/Props.h>
#import <react/components/rncore/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface RCTSwitchComponentView () <RCTSwitchViewProtocol>
@end

@implementation RCTSwitchComponentView {
  UISwitch *_switchView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _switchView = [[UISwitch alloc] initWithFrame:self.bounds];

    [_switchView addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];

    self.contentView = _switchView;

    [self setPropsToDefault];
  }

  return self;
}

- (void)setPropsToDefault
{
  static const auto defaultProps = std::make_shared<const SwitchProps>();
  _props = defaultProps;
  _switchView.on = defaultProps->value;
}

#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self setPropsToDefault];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SwitchComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldSwitchProps = *std::static_pointer_cast<const SwitchProps>(_props);
  const auto &newSwitchProps = *std::static_pointer_cast<const SwitchProps>(props);

  // `value`
  if (oldSwitchProps.value != newSwitchProps.value) {
    _switchView.on = newSwitchProps.value;
  }

  // `disabled`
  if (oldSwitchProps.disabled != newSwitchProps.disabled) {
    _switchView.enabled = !newSwitchProps.disabled;
  }

  // `tintColor`
  if (oldSwitchProps.tintColor != newSwitchProps.tintColor) {
    _switchView.tintColor = [UIColor colorWithCGColor:newSwitchProps.tintColor.get()];
  }

  // `onTintColor
  if (oldSwitchProps.onTintColor != newSwitchProps.onTintColor) {
    _switchView.onTintColor = [UIColor colorWithCGColor:newSwitchProps.onTintColor.get()];
  }

  // `thumbTintColor`
  if (oldSwitchProps.thumbTintColor != newSwitchProps.thumbTintColor) {
    _switchView.thumbTintColor = [UIColor colorWithCGColor:newSwitchProps.thumbTintColor.get()];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)onChange:(UISwitch *)sender
{
  const auto &props = *std::static_pointer_cast<const SwitchProps>(_props);
  if (props.value == sender.on) {
    return;
  }

  std::dynamic_pointer_cast<const SwitchEventEmitter>(_eventEmitter)
      ->onChange(SwitchOnChangeStruct{.value = static_cast<bool>(sender.on)});
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTSwitchHandleCommand(self, commandName, args);
}

- (void)setValue:(BOOL)value
{
  [_switchView setOn:value animated:YES];
}

@end

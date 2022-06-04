/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSwitchComponentView.h"

#import <React/RCTConversions.h>

#import <react/renderer/components/rncore/ComponentDescriptors.h>
#import <react/renderer/components/rncore/EventEmitters.h>
#import <react/renderer/components/rncore/Props.h>
#import <react/renderer/components/rncore/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RCTSwitchComponentView () <RCTSwitchViewProtocol>
@end

@implementation RCTSwitchComponentView {
  UISwitch *_switchView;
  BOOL _isInitialValueSet;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SwitchProps>();
    _props = defaultProps;

    _switchView = [[UISwitch alloc] initWithFrame:self.bounds];

    [_switchView addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];

    self.contentView = _switchView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _isInitialValueSet = NO;
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
    BOOL shouldAnimate = _isInitialValueSet == YES;
    [_switchView setOn:newSwitchProps.value animated:shouldAnimate];
    _isInitialValueSet = YES;
  }

  // `disabled`
  if (oldSwitchProps.disabled != newSwitchProps.disabled) {
    _switchView.enabled = !newSwitchProps.disabled;
  }

  // `tintColor`
  if (oldSwitchProps.tintColor != newSwitchProps.tintColor) {
    _switchView.tintColor = RCTUIColorFromSharedColor(newSwitchProps.tintColor);
  }

  // `onTintColor
  if (oldSwitchProps.onTintColor != newSwitchProps.onTintColor) {
    _switchView.onTintColor = RCTUIColorFromSharedColor(newSwitchProps.onTintColor);
  }

  // `thumbTintColor`
  if (oldSwitchProps.thumbTintColor != newSwitchProps.thumbTintColor) {
    _switchView.thumbTintColor = RCTUIColorFromSharedColor(newSwitchProps.thumbTintColor);
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
      ->onChange(SwitchEventEmitter::OnChange{.value = static_cast<bool>(sender.on)});
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

Class<RCTComponentViewProtocol> RCTSwitchCls(void)
{
  return RCTSwitchComponentView.class;
}

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaViewComponentView.h"

#import <React/RCTUtils.h>
#import <react/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <react/components/safeareaview/SafeAreaViewState.h>
#import "FBRCTFabricComponentsPlugins.h"
#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTSafeAreaViewComponentView {
  SafeAreaViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<SafeAreaViewProps const>();
    _props = defaultProps;
    self.clipsToBounds = YES;
  }

  return self;
}

- (UIEdgeInsets)_safeAreaInsets
{
  if (@available(iOS 11.0, tvOS 11.0, *)) {
    return self.safeAreaInsets;
  }

  return UIEdgeInsetsZero;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
}

- (void)safeAreaInsetsDidChange
{
  [super safeAreaInsetsDidChange];

  [self _updateStateIfNecessary];
}

- (void)_updateStateIfNecessary
{
  if (!_state) {
    return;
  }

  UIEdgeInsets insets = [self _safeAreaInsets];
  insets.left = RCTRoundPixelValue(insets.left);
  insets.top = RCTRoundPixelValue(insets.top);
  insets.right = RCTRoundPixelValue(insets.right);
  insets.bottom = RCTRoundPixelValue(insets.bottom);

  auto oldPadding = _state->getData().padding;
  auto newPadding = RCTEdgeInsetsFromUIEdgeInsets(insets);
  auto threshold = 1.0 / RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.
  auto deltaPadding = newPadding - oldPadding;

  if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
      std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold) {
    return;
  }

  _state->updateState(SafeAreaViewState{newPadding});
}

#pragma mark - RCTComponentViewProtocol

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<SafeAreaViewShadowNode::ConcreteState const>(state);
  [self _updateStateIfNecessary];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

@end

Class<RCTComponentViewProtocol> RCTSafeAreaViewCls(void)
{
  return RCTSafeAreaViewComponentView.class;
}

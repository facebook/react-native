/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaViewComponentView.h"

#import <React/RCTUtils.h>
#import <react/renderer/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <react/renderer/components/safeareaview/SafeAreaViewState.h>
#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTSafeAreaViewComponentView {
  SafeAreaViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = SafeAreaViewShadowNode::defaultSharedProps();
  }

  return self;
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

  UIEdgeInsets insets = self.safeAreaInsets;
  insets.left = RCTRoundPixelValue(insets.left);
  insets.top = RCTRoundPixelValue(insets.top);
  insets.right = RCTRoundPixelValue(insets.right);
  insets.bottom = RCTRoundPixelValue(insets.bottom);

  auto newPadding = RCTEdgeInsetsFromUIEdgeInsets(insets);
  auto threshold = 1.0 / RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.

  _state->updateState(
      [=](const SafeAreaViewShadowNode::ConcreteState::Data &oldData)
          -> SafeAreaViewShadowNode::ConcreteState::SharedData {
        auto oldPadding = oldData.padding;
        auto deltaPadding = newPadding - oldPadding;

        if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
            std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold) {
          return nullptr;
        }

        auto newData = oldData;
        newData.padding = newPadding;
        return std::make_shared<const SafeAreaViewShadowNode::ConcreteState::Data>(newData);
      });
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState
{
  _state = std::static_pointer_cast<const SafeAreaViewShadowNode::ConcreteState>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  [self _updateStateIfNecessary];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
}

@end

Class<RCTComponentViewProtocol> RCTSafeAreaViewCls(void)
{
  return RCTSafeAreaViewComponentView.class;
}

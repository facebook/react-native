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
    static auto const defaultProps = std::make_shared<SafeAreaViewProps const>();
    _props = defaultProps;
  }

  return self;
}

- (UIEdgeInsets)_safeAreaInsets
{
  if (@available(iOS 11.0, *)) {
    return self.safeAreaInsets;
  }

  return UIEdgeInsetsZero;
}

#if !TARGET_OS_OSX // [macOS]
- (void)safeAreaInsetsDidChange
{
  [super safeAreaInsetsDidChange];

  [self _updateStateIfNecessary];
}
#endif // [macOS]

- (void)_updateStateIfNecessary
{
  if (!_state) {
    return;
  }

  UIEdgeInsets insets = [self _safeAreaInsets];
  CGFloat scale = _layoutMetrics.pointScaleFactor; // [macOS]
#if !TARGET_OS_OSX // [macOS]
  insets.left = RCTRoundPixelValue(insets.left);
  insets.top = RCTRoundPixelValue(insets.top);
  insets.right = RCTRoundPixelValue(insets.right);
  insets.bottom = RCTRoundPixelValue(insets.bottom);
#else // [macOS
  insets.left = RCTRoundPixelValue(insets.left, scale);
  insets.top = RCTRoundPixelValue(insets.top, scale);
  insets.right = RCTRoundPixelValue(insets.right, scale);
  insets.bottom = RCTRoundPixelValue(insets.bottom, scale);
#endif // macOS]

  auto newPadding = RCTEdgeInsetsFromUIEdgeInsets(insets);
  auto threshold = 1.0 / scale + 0.01; // Size of a pixel plus some small threshold. [macOS]
  
  _state->updateState(
      [=](SafeAreaViewShadowNode::ConcreteState::Data const &oldData)
          -> SafeAreaViewShadowNode::ConcreteState::SharedData {
        auto oldPadding = oldData.padding;
        auto deltaPadding = newPadding - oldPadding;

        if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
            std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold) {
          return nullptr;
        }

        auto newData = oldData;
        newData.padding = newPadding;
        return std::make_shared<SafeAreaViewShadowNode::ConcreteState::Data const>(newData);
      });
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<SafeAreaViewShadowNode::ConcreteState const>(state);
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

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaViewComponentView.h"

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
    static const auto defaultProps = std::make_shared<const SafeAreaViewProps>();
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
  if (_state != nullptr) {
    auto newState = SafeAreaViewState{RCTEdgeInsetsFromUIEdgeInsets(self._safeAreaInsets)};
    _state->updateState(std::move(newState));
  }
}

#pragma mark - RCTComponentViewProtocol

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const SafeAreaViewShadowNode::ConcreteState>(state);
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

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropComponentView.h"

#import <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#import <react/components/legacyviewmanagerinterop/RCTLegacyViewManagerInteropCoordinator.h>
#import <react/utils/ManagedObjectWrapper.h>

using namespace facebook::react;

@implementation RCTLegacyViewManagerInteropComponentView {
  UIView *_view;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LegacyViewManagerInteropViewProps>();
    _props = defaultProps;
  }

  return self;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  static NSSet<NSString *> *supportedComponents = [NSSet setWithObjects:@"ActivityIndicatorView", nil];
  return [supportedComponents containsObject:componentName];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LegacyViewManagerInteropComponentDescriptor>();
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<LegacyViewManagerInteropShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  assert(_props && _state);
  if (!_view) {
    const auto &state = _state->getData();
    RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
    UIView *view = [coordinator view];
    self.contentView = view;
    _view = view;
  }
}

@end

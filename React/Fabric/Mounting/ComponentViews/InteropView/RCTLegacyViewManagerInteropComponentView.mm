/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropComponentView.h"

#import <React/UIView+React.h>
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
  static NSSet<NSString *> *supportedComponents =
      [NSSet setWithObjects:@"Picker", @"DatePicker", @"ProgressView", @"SegmentedControl", nil];
  return [supportedComponents containsObject:componentName];
}

- (RCTLegacyViewManagerInteropCoordinator *)coordinator
{
  if (_state != nullptr) {
    const auto &state = _state->getData();
    return unwrapManagedObject(state.coordinator);
  } else {
    return NULL;
  }
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  const auto &state = _state->getData();
  RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
  return coordinator.componentViewName;
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
    __weak __typeof(self) weakSelf = self;
    UIView *view = [self.coordinator viewWithInterceptor:^(std::string eventName, folly::dynamic event) {
      if (weakSelf) {
        __typeof(self) strongSelf = weakSelf;
        auto eventEmitter =
            std::static_pointer_cast<LegacyViewManagerInteropViewEventEmitter const>(strongSelf->_eventEmitter);
        eventEmitter->dispatchEvent(eventName, event);
      }
    }];
    self.contentView = view;
    _view = view;
  }

  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = *std::static_pointer_cast<const LegacyViewManagerInteropViewProps>(_props);
    [self.coordinator setProps:newProps.otherProps forView:_view];
  }
}

@end

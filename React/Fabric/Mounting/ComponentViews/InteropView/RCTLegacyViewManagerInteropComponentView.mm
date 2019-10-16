/*
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
  UIView *_paperView;

  /**
   * A temporar storage of views that are being mounted to this component white paper component isn't yet ready.
   */
  NSMutableArray<UIView *> *_insertedViews;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LegacyViewManagerInteropViewProps>();
    _props = defaultProps;
    _insertedViews = [NSMutableArray new];
  }

  return self;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  static NSSet<NSString *> *supportedComponents =
      [NSSet setWithObjects:@"Picker", @"DatePicker", @"ProgressView", @"SegmentedControl", @"MaskedView", nil];
  return [supportedComponents containsObject:componentName];
}

- (RCTLegacyViewManagerInteropCoordinator *)coordinator
{
  if (_state != nullptr) {
    const auto &state = _state->getData();
    return unwrapManagedObject(state.coordinator);
  } else {
    return nil;
  }
}

- (UIView *)paperView
{
  if (!_paperView) {
    __weak __typeof(self) weakSelf = self;
    UIView *view = [self.coordinator viewWithInterceptor:^(std::string eventName, folly::dynamic event) {
      if (weakSelf) {
        __typeof(self) strongSelf = weakSelf;
        auto eventEmitter =
            std::static_pointer_cast<LegacyViewManagerInteropViewEventEmitter const>(strongSelf->_eventEmitter);
        eventEmitter->dispatchEvent(eventName, event);
      }
    }];
    if (view) {
      for (NSUInteger i = 0; i < _insertedViews.count; i++) {
        [view insertReactSubview:_insertedViews[i] atIndex:i];
      }

      [_insertedViews removeAllObjects];

      [view didUpdateReactSubviews];
      _paperView = view;
    }
  }

  return _paperView;
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  const auto &state = _state->getData();
  RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
  return coordinator.componentViewName;
}

#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [_insertedViews removeAllObjects];
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (self.paperView) {
    [self.paperView insertReactSubview:childComponentView atIndex:index];
    [self.paperView didUpdateReactSubviews];
  } else {
    [_insertedViews insertObject:childComponentView atIndex:index];
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (self.paperView) {
    [self.paperView removeReactSubview:childComponentView];
    [self.paperView didUpdateReactSubviews];
  } else {
    [_insertedViews removeObjectAtIndex:index];
  }
}

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

  if (!self.contentView) {
    self.contentView = self.paperView;
  }

  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = *std::static_pointer_cast<const LegacyViewManagerInteropViewProps>(_props);
    [self.coordinator setProps:newProps.otherProps forView:self.paperView];
  }
}

@end

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
  NSMutableDictionary<NSNumber *, UIView *> *_viewsToBeMounted;
  NSMutableArray<UIView *> *_viewsToBeUnmounted;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LegacyViewManagerInteropViewProps>();
    _props = defaultProps;
    _viewsToBeMounted = [NSMutableDictionary new];
    _viewsToBeUnmounted = [NSMutableArray new];
  }

  return self;
}

- (void)setTag:(NSInteger)tag
{
  [self.coordinator removeObserveForTag:self.tag];
  [super setTag:tag];
}

+ (NSMutableSet<NSString *> *)supportedViewManagers
{
  static NSMutableSet<NSString *> *supported =
      [NSMutableSet setWithObjects:@"Picker", @"DatePicker", @"ProgressView", @"SegmentedControl", @"MaskedView", nil];
  return supported;
}

+ (BOOL)isSupported:(NSString *)componentName
{
  return [[RCTLegacyViewManagerInteropComponentView supportedViewManagers] containsObject:componentName];
}

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName
{
  [[RCTLegacyViewManagerInteropComponentView supportedViewManagers] addObject:componentName];
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

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  const auto &state = _state->getData();
  RCTLegacyViewManagerInteropCoordinator *coordinator = unwrapManagedObject(state.coordinator);
  return coordinator.componentViewName;
}

#pragma mark - RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [_viewsToBeMounted removeAllObjects];
  [_viewsToBeUnmounted removeAllObjects];
  [_paperView removeFromSuperview];
  _paperView = nil;
  _state.reset();
  [super prepareForRecycle];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewsToBeMounted setObject:childComponentView forKey:[NSNumber numberWithInteger:index]];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewsToBeUnmounted addObject:childComponentView];
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

  if (!_paperView) {
    __weak __typeof(self) weakSelf = self;
    _paperView = self.coordinator.paperView;
    [self.coordinator addObserveForTag:self.tag
                            usingBlock:^(std::string eventName, folly::dynamic event) {
                              if (weakSelf) {
                                __typeof(self) strongSelf = weakSelf;
                                auto eventEmitter =
                                    std::static_pointer_cast<LegacyViewManagerInteropViewEventEmitter const>(
                                        strongSelf->_eventEmitter);
                                eventEmitter->dispatchEvent(eventName, event);
                              }
                            }];

    _paperView.reactTag = [NSNumber numberWithInteger:self.tag];
    self.contentView = _paperView;
  }

  for (NSNumber *key in _viewsToBeMounted) {
    [_paperView insertReactSubview:_viewsToBeMounted[key] atIndex:key.integerValue];
  }

  [_viewsToBeMounted removeAllObjects];

  for (UIView *view in _viewsToBeUnmounted) {
    [_paperView removeReactSubview:view];
  }

  [_viewsToBeUnmounted removeAllObjects];

  [_paperView didUpdateReactSubviews];

  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = *std::static_pointer_cast<const LegacyViewManagerInteropViewProps>(_props);
    [self.coordinator setProps:newProps.otherProps forView:_paperView];
  }
}

@end

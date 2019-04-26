/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTPrimitives.h>
#import <react/core/EventEmitter.h>
#import <react/core/LayoutMetrics.h>
#import <react/core/LocalData.h>
#import <react/core/Props.h>
#import <react/core/State.h>
#import <react/uimanager/ComponentDescriptorProvider.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Bitmask for all types of possible updates performing during mounting.
 */
typedef NS_OPTIONS(NSInteger, RNComponentViewUpdateMask) {
  RNComponentViewUpdateMaskNone = 0,
  RNComponentViewUpdateMaskProps = 1 << 0,
  RNComponentViewUpdateMaskEventEmitter = 1 << 1,
  RNComponentViewUpdateMaskLocalData = 1 << 2,
  RNComponentViewUpdateMaskState = 1 << 3,
  RNComponentViewUpdateMaskLayoutMetrics = 1 << 4,

  RNComponentViewUpdateMaskAll = RNComponentViewUpdateMaskProps | RNComponentViewUpdateMaskEventEmitter |
      RNComponentViewUpdateMaskLocalData | RNComponentViewUpdateMaskState | RNComponentViewUpdateMaskLayoutMetrics
};

/*
 * Represents a `UIView` instance managed by React.
 * All methods are non-@optional.
 * `UIView+ComponentViewProtocol` category provides default implementation
 * for all of them.
 */
@protocol RCTComponentViewProtocol <NSObject>

/*
 * Returns a `ComponentDescriptorProvider` of a particular `ComponentDescriptor` which this component view
 * represents.
 */
+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider;

/*
 * Returns a list of supplemental  `ComponentDescriptorProvider`s (with do not have `ComponentView` counterparts) that
 * require for this component view.
 */
+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

/*
 * Called for mounting (attaching) a child component view inside `self`
 * component view.
 * Receiver must add `childComponentView` as a subview.
 */
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self`
 * component view.
 * Receiver must remove `childComponentView` as a subview.
 */
- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for updating component's props.
 * Receiver must update native view props accordingly changed props.
 */
- (void)updateProps:(facebook::react::SharedProps)props oldProps:(facebook::react::SharedProps)oldProps;

/*
 * Called for updating component's local data.
 * Receiver must update native view props accordingly changed local data.
 */
- (void)updateLocalData:(facebook::react::SharedLocalData)localData
           oldLocalData:(facebook::react::SharedLocalData)oldLocalData;

/*
 * Called for updating component's state.
 * Receiver must update native view according to changed state.
 */
- (void)updateState:(facebook::react::State::Shared)state oldState:(facebook::react::State::Shared)oldState;

/*
 * Called for updating component's event handlers set.
 * Receiver must cache `eventEmitter` object inside and use it for emitting
 * events when needed.
 */
- (void)updateEventEmitter:(facebook::react::SharedEventEmitter)eventEmitter;

/*
 * Called for updating component's layout metrics.
 * Receiver must update `UIView` layout-related fields (such as `frame`,
 * `bounds`, `layer.zPosition`, and so on) accordingly.
 */
- (void)updateLayoutMetrics:(facebook::react::LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(facebook::react::LayoutMetrics)oldLayoutMetrics;

/*
 * Called right after all update methods were called for a particular component view.
 * Useful for performing updates that require knowledge of several independent aspects of the compound mounting change
 * (e.g. props *and* layout constraints).
 */
- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask;

/*
 * Called right after the component view is moved to a recycle pool.
 * Receiver must reset any local state and release associated
 * non-reusable resources.
 */
- (void)prepareForRecycle;

/**
 * Read the last props used to update the view.
 */
- (facebook::react::SharedProps)props;

@end

NS_ASSUME_NONNULL_END

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/core/LocalData.h>
#import <fabric/core/Props.h>
#import <fabric/core/LayoutMetrics.h>
#import <fabric/events/EventEmitter.h>
#import <React/RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Represents a `UIView` instance managed by React.
 * All methods are non-@optional.
 * `UIView+ComponentViewProtocol` category provides default implementation
 * for all of them.
 */
@protocol RCTComponentViewProtocol <NSObject>

/*
 * Called for mounting (attaching) a child component view inside `self`
 * component view.
 * Receiver must add `childComponentView` as a subview.
 */
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self`
 * component view.
 * Receiver must remove `childComponentView` as a subview.
 */
- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index;

/*
 * Called for updating component's props.
 * Receiver must update native view props accordingly changed props.
 */
- (void)updateProps:(facebook::react::SharedProps)props
           oldProps:(facebook::react::SharedProps)oldProps;

/*
 * Called for updating component's local data.
 * Receiver must update native view props accordingly changed local data.
 */
- (void)updateLocalData:(facebook::react::SharedLocalData)localData
           oldLocalData:(facebook::react::SharedLocalData)oldLocalData;

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
 * Called right after the component view is moved to a recycle pool.
 * Receiver must reset any local state and release associated
 * non-reusable resources.
 */
- (void)prepareForRecycle;

@end

NS_ASSUME_NONNULL_END

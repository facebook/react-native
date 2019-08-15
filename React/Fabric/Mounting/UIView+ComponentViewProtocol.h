/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol)

+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(facebook::react::SharedProps)props oldProps:(facebook::react::SharedProps)oldProps;

- (void)updateEventEmitter:(facebook::react::SharedEventEmitter)eventEmitter;

- (void)updateLocalData:(facebook::react::SharedLocalData)localData
           oldLocalData:(facebook::react::SharedLocalData)oldLocalData;

- (void)updateState:(facebook::react::State::Shared)state oldState:(facebook::react::State::Shared)oldState;

- (void)updateLayoutMetrics:(facebook::react::LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(facebook::react::LayoutMetrics)oldLayoutMetrics;

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (facebook::react::SharedProps)props;

@end

NS_ASSUME_NONNULL_END

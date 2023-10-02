/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of RCTComponentViewProtocol.
 */
@interface RCTUIView (ComponentViewProtocol) <RCTComponentViewProtocol> // [macOS]

+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(RCTUIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index; // [macOS]

- (void)unmountChildComponentView:(RCTUIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index; // [macOS]

- (void)updateProps:(const facebook::react::Props::Shared &)props
           oldProps:(const facebook::react::Props::Shared &)oldProps;

- (void)updateEventEmitter:(const facebook::react::EventEmitter::Shared &)eventEmitter;

- (void)updateState:(const facebook::react::State::Shared &)state
           oldState:(const facebook::react::State::Shared &)oldState;

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics;

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (facebook::react::Props::Shared)props;

- (void)setIsJSResponder:(BOOL)isJSResponder;

- (NSNumber *)reactTag; // [macOS]
- (void)setReactTag:(NSNumber *)reactTag; // [macOS]

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)props;
- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(RCTUIView *)clipView; // [macOS]

@end

NS_ASSUME_NONNULL_END

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#import <react/renderer/core/ComponentDescriptor.h>
#import <react/renderer/core/EventListener.h>
#import <react/renderer/core/LayoutConstraints.h>
#import <react/renderer/core/LayoutContext.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/scheduler/SchedulerToolbox.h>
#import <react/renderer/scheduler/SurfaceHandler.h>
#import <react/renderer/uimanager/UIManager.h>
#import <react/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTMountingManager;

/**
 * Exactly same semantic as `facebook::react::SchedulerDelegate`.
 */
@protocol RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(facebook::react::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(facebook::react::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const &)args;

- (void)setNativeProps_DEPRECATED:(facebook::react::ShadowView const &)shadowView
                        withProps:(facebook::react::Props::Shared)props;

- (void)schedulerDidSendAccessibilityEvent:(facebook::react::ShadowView const &)shadowView
                                 eventType:(std::string const &)eventType;

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(facebook::react::ShadowView const &)shadowView;

@end

/**
 * `facebook::react::Scheduler` as an Objective-C class.
 */
@interface RCTScheduler : NSObject

@property (atomic, weak, nullable) id<RCTSchedulerDelegate> delegate;
@property (readonly) std::shared_ptr<facebook::react::UIManager> const uiManager;

- (instancetype)initWithToolbox:(facebook::react::SchedulerToolbox)toolbox;

- (void)registerSurface:(facebook::react::SurfaceHandler const &)surfaceHandler;
- (void)unregisterSurface:(facebook::react::SurfaceHandler const &)surfaceHandler;

- (facebook::react::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (facebook::react::ComponentHandle)handle;

- (void)setupAnimationDriver:(facebook::react::SurfaceHandler const &)surfaceHandler;

- (void)onAnimationStarted;

- (void)onAllAnimationsComplete;

- (void)animationTick;

- (void)addEventListener:(std::shared_ptr<facebook::react::EventListener> const &)listener;

- (void)removeEventListener:(std::shared_ptr<facebook::react::EventListener> const &)listener;

@end

NS_ASSUME_NONNULL_END

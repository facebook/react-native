/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <React/RCTPrimitives.h>
#import <react/core/ComponentDescriptor.h>
#import <react/core/LayoutConstraints.h>
#import <react/core/LayoutContext.h>
#import <react/mounting/MountingCoordinator.h>
#import <react/uimanager/ComponentDescriptorFactory.h>
#import <react/uimanager/SchedulerToolbox.h>
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
                               args:(folly::dynamic const)args;

@end

/**
 * `facebook::react::Scheduler` as an Objective-C class.
 */
@interface RCTScheduler : NSObject

@property (atomic, weak, nullable) id<RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(facebook::react::SchedulerToolbox)toolbox;

- (void)startSurfaceWithSurfaceId:(facebook::react::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                    layoutContext:(facebook::react::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(facebook::react::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                                layoutContext:(facebook::react::LayoutContext)layoutContext
                                    surfaceId:(facebook::react::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                                       layoutContext:(facebook::react::LayoutContext)layoutContext
                                           surfaceId:(facebook::react::SurfaceId)surfaceId;

- (facebook::react::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (facebook::react::ComponentHandle)handle;

- (facebook::react::MountingCoordinator::Shared)mountingCoordinatorWithSurfaceId:(facebook::react::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END

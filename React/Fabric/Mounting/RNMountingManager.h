/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RNMountingManagerDelegate.h>
#import <React/RNPrimitives.h>
#import <react/core/ComponentDescriptor.h>
#import <react/core/ReactPrimitives.h>
#import <react/mounting/MountingCoordinator.h>
#import <react/mounting/ShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@class RNComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface RNMountingManager : NSObject

@property (nonatomic, weak) id<RNMountingManagerDelegate> delegate;
@property (nonatomic, strong) RNComponentViewRegistry *componentViewRegistry;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(facebook::react::MountingCoordinator::Shared const &)mountingCoordinator;

/**
 * Dispatch a command to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)dispatchCommand:(ReactTag)reactTag commandName:(NSString *)commandName args:(NSArray *)args;

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const facebook::react::ComponentDescriptor &)componentDescriptor;
@end

NS_ASSUME_NONNULL_END

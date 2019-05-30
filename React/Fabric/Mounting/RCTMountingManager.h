/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTPrimitives.h>
#import <react/core/ComponentDescriptor.h>
#import <react/core/ReactPrimitives.h>
#import <react/mounting/MountingCoordinator.h>
#import <react/mounting/ShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface RCTMountingManager : NSObject

@property (nonatomic, weak) id<RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) RCTComponentViewRegistry *componentViewRegistry;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(facebook::react::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const facebook::react::ComponentDescriptor &)componentDescriptor;

@end

NS_ASSUME_NONNULL_END

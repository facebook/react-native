/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RNPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class RNMountingManager;

/**
 * MountingManager's delegate.
 */
@protocol RNMountingManagerDelegate <NSObject>

/*
 * Called right *before* execution of mount items which affect a Surface with
 * given `rootTag`.
 * Always called on the main queue.
 */
- (void)mountingManager:(RNMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)MountingManager;

/*
 * Called right *after* execution of mount items which affect a Surface with
 * given `rootTag`.
 * Always called on the main queue.
 */
- (void)mountingManager:(RNMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag;

@end

NS_ASSUME_NONNULL_END

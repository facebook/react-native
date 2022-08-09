/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/renderer/mounting/MountingTransactionMetadata.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * # Achtung!
 * Remember, with great power comes great responsibility.
 * Observers of this protocol are being called several times on every single mount transaction. Any thoughtless or
 * suboptimal implementation of this protocol will slow down the whole app. Please, be responsible.
 *
 * # Usecases
 * React Native platform-specific mounting layer has limitations when it comes to notifying view components about
 * (coming or just happened) changes in the view tree. Implementing that generically for all components would make
 * everything way to slow. For instance, the mounting layer does not have dedicated APIs to notify some component that:
 * - Some ancestor of the component was reparented;
 * - Some descendant of the component was added, removed or reparented;
 * - Some ancestor of the component got new layout metrics (which might affect the absolute position of the component);
 * - The transaction which affected the component's children just finished.
 *
 * If some very specific component (e.g. a performance logger) needs to handle some of the similar use-cases, it might
 * rely on this protocol.
 *
 * # How to use
 * - Declare conformance to this protocol for the ComponentView class.
 * - Implement methods *only* suitable for a particular use case. Do not implement all methods if it is not strictly
 * required.
 * - Alternatively, an observer can be registered explicitly via `RCTSurface`.
 *
 * # Implementation details
 * The framework checks all registered view classes for conformance to the protocol and for a set of implemented
 * methods, then it stores this information for future use. When a view got created, the framework checks the info
 * associated with the class and adds the view object to the list of listeners of the particular events (if needed).
 * When a view got destroyed, the framework removes the view from suitable collections.
 */
@protocol RCTMountingTransactionObserving <NSObject>

@optional

/*
 * Called right before the fist mutation instruction is executed.
 * Is not being called for a component view which is being mounted as part of the transaction (because the view is not
 * registered as an observer yet).
 */
- (void)mountingTransactionWillMountWithMetadata:(facebook::react::MountingTransactionMetadata const &)metadata;

/*
 * Called right after the last mutation instruction is executed.
 * Is not being called for a component view which was being unmounted as part of the transaction (because the view is
 * not registered as an observer already).
 */
- (void)mountingTransactionDidMountWithMetadata:(facebook::react::MountingTransactionMetadata const &)metadata;

@end

NS_ASSUME_NONNULL_END

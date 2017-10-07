/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTViewManager.h>

/**
 * Allows hooking into UIManager internals. This can be used to execute code at
 * specific points during the view updating process.
 * New observers must not be added inside observer handlers.
 * The particular order of handler invocation is not guaranteed.
 * All observer handlers are called on UIManager queue.
 */
@protocol RCTUIManagerObserver <NSObject>

@optional

/**
 * Called just before the UIManager layout views.
 * It allows performing some operation for components which contain custom
 * layout logic right before regular Yoga based layout. So, for instance,
 * some components which have own React-independent state can compute and cache
 * own intrinsic content size (which will be used by Yoga) at this point.
 */
- (void)uiManagerWillPerformLayout:(RCTUIManager *)manager;

/**
 * Called just after the UIManager layout views.
 * It allows performing custom layout logic right after regular Yoga based layout.
 * So, for instance, this can be used for computing final layout for a component,
 * since it has its final frame set by Yoga at this point.
 */
- (void)uiManagerDidPerformLayout:(RCTUIManager *)manager;

/**
 * Called before flushing UI blocks at the end of a batch. Note that this won't
 * get called for partial batches when using `unsafeFlushUIChangesBeforeBatchEnds`.
 * This is called from the UIManager queue. Can be used to add UI operations in that batch.
 */
- (void)uiManagerWillFlushUIBlocks:(RCTUIManager *)manager;

@end

/**
 * Simple helper which take care of RCTUIManager's observers.
 */
@interface RCTUIManagerObserverCoordinator : NSObject <RCTUIManagerObserver>

/**
 * Add a UIManagerObserver. See the `RCTUIManagerObserver` protocol for more info.
 * References to observers are held weakly.
 * This method can be called safely from any queue.
 */
- (void)addObserver:(id<RCTUIManagerObserver>)observer;

/**
 * Remove a `UIManagerObserver`.
 * This method can be called safely from any queue.
 */
- (void)removeObserver:(id<RCTUIManagerObserver>)observer;

@end

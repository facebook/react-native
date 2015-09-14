/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"
#import "RCTInvalidating.h"
#import "RCTViewManager.h"

/**
 * Posted right before re-render happens. This is a chance for views to invalidate their state so
 * next render cycle will pick up updated views and layout appropriately.
 */
RCT_EXTERN NSString *const RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification;

/**
 * Posted whenever a new root view is registered with RCTUIManager. The userInfo property
 * will contain a RCTUIManagerRootViewKey with the registered root view.
 */
RCT_EXTERN NSString *const RCTUIManagerDidRegisterRootViewNotification;

/**
 * Posted whenever a root view is removed from the RCTUIManager. The userInfo property
 * will contain a RCTUIManagerRootViewKey with the removed root view.
 */
RCT_EXTERN NSString *const RCTUIManagerDidRemoveRootViewNotification;

/**
 * Key for the root view property in the above notifications
 */
RCT_EXTERN NSString *const RCTUIManagerRootViewKey;

@protocol RCTScrollableProtocol;

/**
 * The RCTUIManager is the module responsible for updating the view hierarchy.
 */
@interface RCTUIManager : NSObject <RCTBridgeModule, RCTInvalidating>

/**
 * The UIIManager has the concept of a designated "main scroll view", which is
 * useful for apps built around a central scrolling content area (e.g. a
 * timeline).
 */
@property (nonatomic, weak) id<RCTScrollableProtocol> mainScrollView;

/**
 * Allows native environment code to respond to "the main scroll view" events.
 * see `RCTUIManager`'s `setMainScrollViewTag`.
 */
@property (nonatomic, readwrite, weak) id<UIScrollViewDelegate> nativeMainScrollDelegate;

/**
 * Register a root view with the RCTUIManager.
 */
- (void)registerRootView:(UIView *)rootView;

/**
 * Gets the view associated with a reactTag.
 */
- (UIView *)viewForReactTag:(NSNumber *)reactTag;

/**
 * Update the frame of a view. This might be in response to a screen rotation
 * or some other layout event outside of the React-managed view hierarchy.
 */
- (void)setFrame:(CGRect)frame forView:(UIView *)view;

/**
 * Update the background color of a root view. This is usually triggered by
 * manually setting the background color of the root view with native code.
 */
- (void)setBackgroundColor:(UIColor *)color forRootView:(UIView *)rootView;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic after all currently queued view updates have completed.
 */
- (void)addUIBlock:(RCTViewManagerUIBlock)block;

/**
 * The view that is currently first responder, according to the JS context.
 */
+ (UIView *)JSResponder;

@end

/**
 * This category makes the current RCTUIManager instance available via the
 * RCTBridge, which is useful for RCTBridgeModules or RCTViewManagers that
 * need to access the RCTUIManager.
 */
@interface RCTBridge (RCTUIManager)

@property (nonatomic, readonly) RCTUIManager *uiManager;

@end

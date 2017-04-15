/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>
#import <React/RCTRootView.h>
#import <React/RCTViewManager.h>

/**
 * UIManager queue
 */
RCT_EXTERN dispatch_queue_t RCTGetUIManagerQueue(void);

/**
 * Default name for the UIManager queue
 */
RCT_EXTERN char *const RCTUIManagerQueueName;

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

@class RCTUIManager;

/**
 * Allows to hook into UIManager internals. This can be used to execute code at
 * specific points during the view updating process.
 */
@protocol RCTUIManagerObserver <NSObject>

/**
 * Called before flushing UI blocks at the end of a batch. Note that this won't
 * get called for partial batches when using `unsafeFlushUIChangesBeforeBatchEnds`.
 * This is called from the UIManager queue. Can be used to add UI operations in that batch.
 */
- (void)uiManagerWillFlushUIBlocks:(RCTUIManager *)manager;

@end

@protocol RCTScrollableProtocol;

/**
 * The RCTUIManager is the module responsible for updating the view hierarchy.
 */
@interface RCTUIManager : NSObject <RCTBridgeModule, RCTInvalidating>

/**
 * Register a root view with the RCTUIManager.
 */
- (void)registerRootView:(UIView *)rootView;

/**
 * Gets the view name associated with a reactTag.
 */
- (NSString *)viewNameForReactTag:(NSNumber *)reactTag;

/**
 * Gets the view associated with a reactTag.
 */
- (UIView *)viewForReactTag:(NSNumber *)reactTag;

/**
 * Set the available size (`availableSize` property) for a root view.
 * This might be used in response to changes in external layout constraints.
 * This value will be directly trasmitted to layout engine and defines how big viewport is;
 * this value does not affect root node size style properties.
 * Can be considered as something similar to `setSize:forView:` but applicable only for root view.
 */
- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView;

/**
 * Set the size of a view. This might be in response to a screen rotation
 * or some other layout event outside of the React-managed view hierarchy.
 */
- (void)setSize:(CGSize)size forView:(UIView *)view;

/**
 * Set the natural size of a view, which is used when no explicit size is set.
 * Use `UIViewNoIntrinsicMetric` to ignore a dimension.
 * The `size` must NOT include padding and border.
 */
- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view;

/**
 * Update the background color of a view. The source of truth for
 * backgroundColor is the shadow view, so if to update backgroundColor from
 * native code you will need to call this method.
 */
- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic after all currently queued view updates have completed.
 */
- (void)addUIBlock:(RCTViewManagerUIBlock)block;

/**
 * Schedule a block to be executed on the UI thread. Useful if you need to execute
 * view logic before all currently queued view updates have completed.
 */
- (void)prependUIBlock:(RCTViewManagerUIBlock)block;

/**
 * Add a UIManagerObserver. See the RCTUIManagerObserver protocol for more info. This
 * method can be called safely from any queue.
 */
- (void)addUIManagerObserver:(id<RCTUIManagerObserver>)observer;

/**
 * Remove a UIManagerObserver. This method can be called safely from any queue.
 */
- (void)removeUIManagerObserver:(id<RCTUIManagerObserver>)observer;

/**
 * Used by native animated module to bypass the process of updating the values through the shadow
 * view hierarchy. This method will directly update native views, which means that updates for
 * layout-related propertied won't be handled properly.
 * Make sure you know what you're doing before calling this method :)
 */
- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props;

/**
 * Given a reactTag from a component, find its root view, if possible.
 * Otherwise, this will give back nil.
 *
 * @param reactTag the component tag
 * @param completion the completion block that will hand over the rootView, if any.
 *
 */
- (void)rootViewForReactTag:(NSNumber *)reactTag withCompletion:(void (^)(UIView *view))completion;

/**
 * The view that is currently first responder, according to the JS context.
 */
+ (UIView *)JSResponder;

/**
 * Normally, UI changes are not applied until the complete batch of method
 * invocations from JavaScript to native has completed.
 *
 * Setting this to YES will flush UI changes sooner, which could potentially
 * result in inconsistent UI updates.
 *
 * The default is NO (recommended).
 */
@property (atomic, assign) BOOL unsafeFlushUIChangesBeforeBatchEnds;

/**
 * In some cases we might want to trigger layout from native side.
 * React won't be aware of this, so we need to make sure it happens.
 */
- (void)setNeedsLayout;

@end

@interface RCTUIManager (Deprecated)

/**
 * This method is deprecated and will be removed in next releases.
 * Use `setSize:forView:` or `setIntrinsicContentSize:forView:` instead.
 * Only frames with `origin` equals {0, 0} are supported.
 */
- (void)setFrame:(CGRect)frame forView:(UIView *)view
__deprecated_msg("Use `setSize:forView:` or `setIntrinsicContentSize:forView:` instead.");


/**
 * This method is deprecated and will be removed in next releases.
 * Use `registerRootView:` instead. There is no need to specify `sizeFlexibility` anymore.
 */
- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(RCTRootViewSizeFlexibility)sizeFlexibility
__deprecated_msg("Use `registerRootView:` instead.");

@end

/**
 * This category makes the current RCTUIManager instance available via the
 * RCTBridge, which is useful for RCTBridgeModules or RCTViewManagers that
 * need to access the RCTUIManager.
 */
@interface RCTBridge (RCTUIManager)

@property (nonatomic, readonly) RCTUIManager *uiManager;

@end

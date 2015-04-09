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

extern NSString *const RCTJavaScriptDidLoadNotification;
extern NSString *const RCTReloadNotification;
extern NSString *const RCTReloadViewsNotification;

@interface RCTRootView : UIView <RCTInvalidating>

/**
 * - Designated initializer -
 */
- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName NS_DESIGNATED_INITIALIZER;

/**
 * - Convenience initializer -
 * A bridge will be created internally.
 * This initializer is intended to be used when the app has a single RCTRootView,
 * otherwise create an `RCTBridge` and pass it in via `initWithBridge:moduleName:`
 * to all the instances.
 */
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                    launchOptions:(NSDictionary *)launchOptions;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
@property (nonatomic, copy, readonly) NSString *moduleName;

/**
 * The bridge used by the root view. Bridges can be shared between multiple
 * root views, so you can use this property to initialize another RCTRootView.
 */
@property (nonatomic, strong, readonly) RCTBridge *bridge;

/**
 * The default properties to apply to the view when the script bundle
 * is first loaded. Defaults to nil/empty.
 */
@property (nonatomic, copy) NSDictionary *initialProperties;

/**
 * The class of the RCTJavaScriptExecutor to use with this view.
 * If not specified, it will default to using RCTContextExecutor.
 * Changes will take effect next time the bundle is reloaded.
 */
@property (nonatomic, strong) Class executorClass;

/**
 * If YES will watch for shake gestures and show development menu
 * with options like "Reload", "Enable Debugging", etc.
 */
@property (nonatomic, assign) BOOL enableDevMenu;

/**
 * Reload this root view, or all root views, respectively.
 */
- (void)reload;
+ (void)reloadAll;

@property (nonatomic, weak) UIViewController *backingViewController;

@property (nonatomic, strong, readonly) UIView *contentView;

- (void)startOrResetInteractionTiming;
- (NSDictionary *)endAndResetInteractionTiming;

@end

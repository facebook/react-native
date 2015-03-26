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

@interface RCTRootView : UIView<RCTInvalidating>

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                    launchOptions:(NSDictionary *)launchOptions /* NS_DESIGNATED_INITIALIZER */;

/**
 * The URL of the bundled application script (required).
 * Setting this will clear the view contents, and trigger
 * an asynchronous load/download and execution of the script.
 */
@property (nonatomic, strong, readonly) NSURL *scriptURL;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
@property (nonatomic, copy, readonly) NSString *moduleName;

/**
 * A block that returns an array of pre-allocated modules.  These
 * modules will take precedence over any automatically registered
 * modules of the same name.
 */
@property (nonatomic, copy, readonly) RCTBridgeModuleProviderBlock moduleProvider;

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

- (void)startOrResetInteractionTiming;
- (NSDictionary *)endAndResetInteractionTiming;

@end

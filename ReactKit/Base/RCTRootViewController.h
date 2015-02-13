// Copyright 2004-present Facebook. All rights reserved.

#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTJSMethodRegistrar.h"

@class RCTRootView;

/**
 * Convenience class for initializing a React Native view controller. It creates
 * default JavaScript executors and creates an `RCTRootView` for its view.
 *
 * The view controller also manages reloading the JavaScript source code and
 * the contents of its `RCTRootView`.
 *
 * In more advanced applications, you may want to use `RCTRootView` and
 * `RCTBridge` directly.
 */
@interface RCTRootViewController : UIViewController <RCTJSMethodRegistrar>

/**
 * The same view as `self.view` but statically typed as `RCTRootView`.
 */
@property (nonatomic, strong, readonly) RCTRootView *reactRootView;

/**
 * The URL of the bundled application script (required).
 * Setting this will clear the view contents, and trigger
 * an asynchronous load/download and execution of the script.
 */
@property (nonatomic, strong) NSURL *scriptURL;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
@property (nonatomic, copy) NSString *moduleName;

/**
 * A block that returns an array of pre-allocated modules.  These
 * modules will take precedence over any automatically registered
 * modules of the same name.
 */
@property (nonatomic, copy) RCTBridgeModuleProviderBlock moduleProvider;

/**
 * The default properties to apply to the view when the script bundle
 * is first loaded. Defaults to nil/empty.
 */
@property (nonatomic, copy) NSDictionary *initialProperties;

/**
 * The class of the RCTJavaScriptExecutor to use with this view controller.
 * If not specified, it will default to using RCTContextExecutor.
 * Changes will take effect next time the bundle is reloaded.
 */
@property (nonatomic, strong) Class executorClass;

/**
 * Reload the root view, or all root views, respectively.
 */
- (void)reload;
+ (void)reloadAll;

- (void)startOrResetInteractionTiming;
- (NSDictionary *)endAndResetInteractionTiming;

@end

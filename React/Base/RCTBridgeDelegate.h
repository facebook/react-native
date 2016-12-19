/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTJavaScriptLoader.h>

@class RCTBridge;
@protocol RCTBridgeModule;

@protocol RCTBridgeDelegate <NSObject>

/**
 * The location of the JavaScript source file. When running from the packager
 * this should be an absolute URL, e.g. `http://localhost:8081/index.ios.bundle`.
 * When running from a locally bundled JS file, this should be a `file://` url
 * pointing to a path inside the app resources, e.g. `file://.../main.jsbundle`.
 */
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

@optional

/**
 * The bridge will attempt to load the JS source code from the location specified
 * by the `sourceURLForBridge:` method, if loading fails, you can implement this
 * method to specify fallbackSourceURL.
 * NOTE: We don't plan to support this API permanently (this method will be
 * removed after we track down why a valid sourceURL fails to load sometimes).
 */
- (NSURL *)fallbackSourceURLForBridge:(RCTBridge *)bridge;

/**
 * The bridge initializes any registered RCTBridgeModules automatically, however
 * if you wish to instantiate your own module instances, you can return them
 * from this method.
 *
 * Note: You should always return a new instance for each call, rather than
 * returning the same instance each time the bridge is reloaded. Module instances
 * should not be shared between bridges, and this may cause unexpected behavior.
 *
 * It is also possible to override standard modules with your own implementations
 * by returning a class with the same `moduleName` from this method, but this is
 * not recommended in most cases - if the module methods and behavior do not
 * match exactly, it may lead to bugs or crashes.
 */
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge;

/**
 * Customize how bridge native modules are initialized.
 *
 * By default all modules are created lazily except those that have constants to export
 * or require main thread initialization. If you want to limit the set of native
 * modules that this should be considered for, implement this method.
 *
 * Return nil to whitelist all modules found. Modules passed in extraModulesForBridge:
 * are automatically whitelisted.
 *
 * @experimental
 */
- (NSArray<Class> *)whitelistedModulesForBridge:(RCTBridge *)bridge;

/**
 * When loading initial JavaScript, do so synchronously when the bridge is created iff
 * this returns true.  Otherwise, the JS will be fetched on a network thread, and
 * executed on the JS thread.  Currently used only by C++ bridge.
 *
 * @experimental
 */
- (BOOL)shouldBridgeLoadJavaScriptSynchronously:(RCTBridge *)bridge;

/**
 * When initializing native modules that require main thread initialization, the bridge
 * will default to dispatch module creation blocks asynchrously. If we're blockingly
 * waiting on the main thread to finish bridge creation on the main thread, this will
 * deadlock. Override this method to initialize modules synchronously instead.
 *
 * @experimental
 */
- (BOOL)shouldBridgeInitializeNativeModulesSynchronously:(RCTBridge *)bridge;

/**
 * Configure whether the JSCExecutor created should use the system JSC API or
 * alternative hooks provided. When returning YES from this method, you must have
 * previously called facebook::react::setCustomJSCWrapper.
 *
 * @experimental
 */
- (BOOL)shouldBridgeUseCustomJSC:(RCTBridge *)bridge;

/**
 * The bridge will automatically attempt to load the JS source code from the
 * location specified by the `sourceURLForBridge:` method, however, if you want
 * to handle loading the JS yourself, you can do so by implementing this method.
 */
- (void)loadSourceForBridge:(RCTBridge *)bridge
                 onProgress:(RCTSourceLoadProgressBlock)onProgress
                 onComplete:(RCTSourceLoadBlock)loadCallback;

/**
 * Similar to loadSourceForBridge:onProgress:onComplete: but without progress
 * reporting.
 */
- (void)loadSourceForBridge:(RCTBridge *)bridge
                  withBlock:(RCTSourceLoadBlock)loadCallback;

@end

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
 * Configure whether the JSCExecutor created should use the system JSC API or
 * alternative hooks provided. When returning YES from this method, you must have
 * previously called facebook::react::setCustomJSCWrapper.
 *
 * @experimental
 */
- (BOOL)shouldBridgeUseCustomJSC:(RCTBridge *)bridge;

/**
* The bridge will call this method when a module been called from JS
* cannot be found among registered modules.
* It should return YES if the module with name 'moduleName' was registered
* in the implementation, and the system must attempt to look for it again among registered.
* If the module was not registered, return NO to prevent further searches.
*/
- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName;

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

/**
 * Retrieve the list of lazy-native-modules names for the given bridge.
 */
- (NSDictionary<NSString *, Class> *)extraLazyModuleClassesForBridge:(RCTBridge *)bridge;

@end

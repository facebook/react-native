/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>

#ifndef FB_REFERENCE_IMAGE_DIR
#define FB_REFERENCE_IMAGE_DIR ""
#endif

#define RCT_RUN_RUNLOOP_WHILE(CONDITION)                                                          \
{                                                                                                 \
  NSDate *timeout = [NSDate dateWithTimeIntervalSinceNow:30];                                      \
  NSRunLoop *runloop = [NSRunLoop mainRunLoop];                                                   \
  while ((CONDITION)) {                                                                           \
    [runloop runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.01]]; \
    if ([timeout timeIntervalSinceNow] <= 0) {                                                    \
      XCTFail(@"Runloop timed out before condition was met");                                     \
      break;                                                                                      \
    }                                                                                             \
  }                                                                                               \
}

/**
 * Use the RCTInitRunnerForApp macro for typical usage. See FBSnapshotTestCase.h for more information
 * on how to configure the snapshotting system.
 */
#define RCTInitRunnerForApp(app__, moduleProvider__, scriptURL__) \
[[RCTTestRunner alloc] initWithApp:(app__) \
                referenceDirectory:@FB_REFERENCE_IMAGE_DIR \
                    moduleProvider:(moduleProvider__) \
                         scriptURL: scriptURL__]

#define RCTInitRunnerForAppWithDelegate(app__, bridgeDelegate__) \
[[RCTTestRunner alloc] initWithApp:(app__) \
                referenceDirectory:@FB_REFERENCE_IMAGE_DIR \
                    bridgeDelegate:(bridgeDelegate__)]

@protocol RCTBridgeModule;
@class RCTBridge;

@class RCTRootView;

@interface RCTTestRunner : NSObject

/**
 * Controls the mode snapshots are run in. If set to true, new snapshots are written to disk,
 * otherwise, the UI will be compared to the existing snapshot.
 */
@property (nonatomic, assign) BOOL recordMode;

@property (nonatomic, assign, readwrite) BOOL useBundler;

@property (nonatomic, assign, readwrite) BOOL useJSDebugger;

@property (nonatomic, copy) NSString *testSuffix;

@property (nonatomic, readonly) NSURL *scriptURL;

/**
 * Initialize a runner.  It's recommended that you use the RCTInitRunnerForApp
 * macro instead of calling this directly.
 *
 * @param app The path to the app bundle without suffixes, e.g. IntegrationTests/IntegrationTestsApp
 * @param referenceDirectory The path for snapshot references images.
 * @param block A block that returns an array of extra modules to be used by the test runner.
 * @param scriptURL URL to the JS bundle to use.
 * @param bridgeDelegate Custom delegate for bridge activities.
 */
- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(RCTBridgeModuleListProvider)block
                  scriptURL:(NSURL *)scriptURL
             bridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(RCTBridgeModuleListProvider)block
                  scriptURL:(NSURL *)scriptURL;

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             bridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate;

- (NSURL *)defaultScriptURL;

/**
 * Simplest runTest function simply mounts the specified JS module with no
 * initialProps and waits for it to call
 *
 *   RCTTestModule.markTestCompleted()
 *
 * JS errors/exceptions and timeouts will fail the test.  Snapshot tests call
 * RCTTestModule.verifySnapshot whenever they want to verify what has been
 * rendered (typically via requestAnimationFrame to make sure the latest state
 * has been rendered in native.
 *
 * @param test Selector of the test, usually just `_cmd`.
 * @param moduleName Name of the JS component as registered by `AppRegistry.registerComponent` in JS.
 */
- (void)runTest:(SEL)test module:(NSString *)moduleName;

/**
 * Same as runTest:, but allows for passing initialProps for providing mock data
 * or requesting different behaviors, configurationBlock provides arbitrary logic for the hosting
 * root view manipulation.
 *
 * @param test Selector of the test, usually just `_cmd`.
 * @param moduleName Name of the JS component as registered by `AppRegistry.registerComponent` in JS.
 * @param initialProps props that are passed into the component when rendered.
 * @param configurationBlock A block that takes the hosting root view and performs arbitrary manipulation after its creation.
 */
- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(RCTRootView *rootView))configurationBlock;

/**
 * Same as runTest:, but allows for passing initialProps for providing mock data
 * or requesting different behaviors, configurationBlock provides arbitrary logic for the hosting
 * root view manipulation, and expectErrorRegex verifies that the error you expected was thrown.
 *
 * @param test Selector of the test, usually just `_cmd`.
 * @param moduleName Name of the JS component as registered by `AppRegistry.registerComponent` in JS.
 * @param initialProps props that are passed into the component when rendered.
 * @param configurationBlock A block that takes the hosting root view and performs arbitrary manipulation after its creation.
 * @param expectErrorRegex A regex that must match the error thrown.  If no error is thrown, the test fails.
 */
- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(RCTRootView *rootView))configurationBlock
expectErrorRegex:(NSString *)expectErrorRegex;

/**
 * Same as runTest:, but allows for passing initialProps for providing mock data
 * or requesting different behaviors, configurationBlock provides arbitrary logic for the hosting
 * root view manipulation, and expectErrorBlock provides arbitrary
 * logic for processing errors (nil will cause any error to fail the test).
 *
 * @param test Selector of the test, usually just `_cmd`.
 * @param moduleName Name of the JS component as registered by `AppRegistry.registerComponent` in JS.
 * @param initialProps props that are passed into the component when rendered.
 * @param configurationBlock A block that takes the hosting root view and performs arbitrary manipulation after its creation.
 * @param expectErrorBlock A block that takes the error message and returns NO to fail the test.
 */
- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(RCTRootView *rootView))configurationBlock
expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock;

@end

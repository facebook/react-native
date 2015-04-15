/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 * Use the RCTInitRunnerForApp macro for typical usage.
 *
 * Add this to your test target's gcc preprocessor macros:
 *
 *   FB_REFERENCE_IMAGE_DIR="\"$(SOURCE_ROOT)/$(PROJECT_NAME)Tests/ReferenceImages\""
 */
#define RCTInitRunnerForApp(app__) [[RCTTestRunner alloc] initWithApp:(app__) referenceDir:@FB_REFERENCE_IMAGE_DIR]

@interface RCTTestRunner : NSObject

@property (nonatomic, assign) BOOL recordMode;
@property (nonatomic, strong) NSURL *scriptURL;

/**
 * Initialize a runner.  It's recommended that you use the RCTInitRunnerForApp
 * macro instead of calling this directly.
 *
 * @param app The path to the app bundle without suffixes, e.g. IntegrationTests/IntegrationTestsApp
 * @param referencesDir The path for snapshot references images. The RCTInitRunnerForApp macro uses
 *        FB_REFERENCE_IMAGE_DIR for this automatically.
 */
- (instancetype)initWithApp:(NSString *)app referenceDir:(NSString *)referenceDir;

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
 * or requesting different behaviors, and expectErrorRegex verifies that the
 * error you expected was thrown.
 *
 * @param test Selector of the test, usually just `_cmd`.
 * @param moduleName Name of the JS component as registered by `AppRegistry.registerComponent` in JS.
 * @param initialProps props that are passed into the component when rendered.
 * @param expectErrorRegex A regex that must match the error thrown.  If no error is thrown, the test fails.
 */
- (void)runTest:(SEL)test module:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorRegex:(NSString *)expectErrorRegex;

/**
 * Same as runTest:, but allows for passing initialProps for providing mock data
 * or requesting different behaviors, and expectErrorBlock provides arbitrary
 * logic for processing errors (nil will cause any error to fail the test).
 *
 * @param test Selector of the test, usually just `_cmd`.
 * @param moduleName Name of the JS component as registered by `AppRegistry.registerComponent` in JS.
 * @param initialProps props that are passed into the component when rendered.
 * @param expectErrorBlock A block that takes the error message and returns NO to fail the test.
 */
- (void)runTest:(SEL)test module:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock;

@end

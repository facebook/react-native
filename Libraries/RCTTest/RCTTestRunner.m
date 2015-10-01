/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTestRunner.h"

#import "FBSnapshotTestController.h"
#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTRootView.h"
#import "RCTTestModule.h"
#import "RCTUtils.h"
#import "RCTContextExecutor.h"

static const NSTimeInterval kTestTimeoutSeconds = 60;
static const NSTimeInterval kTestTeardownTimeoutSeconds = 30;

@implementation RCTTestRunner
{
  FBSnapshotTestController *_testController;
  RCTBridgeModuleProviderBlock _moduleProvider;
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(RCTBridgeModuleProviderBlock)block
{
  RCTAssertParam(app);
  RCTAssertParam(referenceDirectory);

  if ((self = [super init])) {

    NSString *sanitizedAppName = [app stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    sanitizedAppName = [sanitizedAppName stringByReplacingOccurrencesOfString:@"\\" withString:@"-"];
    _testController = [[FBSnapshotTestController alloc] initWithTestName:sanitizedAppName];
    _testController.referenceImagesDirectory = referenceDirectory;
    _moduleProvider = [block copy];

#if RUNNING_ON_CI
    _scriptURL = [[NSBundle bundleForClass:[RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
    RCTAssert(_scriptURL != nil, @"Could not locate main.jsBundle");
#else
    _scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", app]];
#endif
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)setRecordMode:(BOOL)recordMode
{
  _testController.recordMode = recordMode;
}

- (BOOL)recordMode
{
  return _testController.recordMode;
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
{
  [self runTest:test module:moduleName initialProps:nil expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary *)initialProps expectErrorRegex:(NSString *)errorRegex
{
  [self runTest:test module:moduleName initialProps:initialProps expectErrorBlock:^BOOL(NSString *error){
    return [error rangeOfString:errorRegex options:NSRegularExpressionSearch].location != NSNotFound;
  }];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary *)initialProps expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock
{
  __weak id weakJSContext;

  @autoreleasepool {
    __block NSString *error = nil;
    RCTSetLogFunction(^(RCTLogLevel level, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      if (level >= RCTLogLevelError) {
        error = message;
      }
    });

    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_scriptURL
                                              moduleProvider:_moduleProvider
                                               launchOptions:nil];

    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProps];
    rootView.frame = CGRectMake(0, 0, 320, 2000); // Constant size for testing on multiple devices

    NSString *testModuleName = RCTBridgeModuleNameForClass([RCTTestModule class]);
    RCTTestModule *testModule = rootView.bridge.modules[testModuleName];
    RCTAssert(_testController != nil, @"_testController should not be nil");
    testModule.controller = _testController;
    testModule.testSelector = test;
    testModule.view = rootView;

    UIViewController *vc = [UIApplication sharedApplication].delegate.window.rootViewController;
    vc.view = [UIView new];
    [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized

    NSDate *date = [NSDate dateWithTimeIntervalSinceNow:kTestTimeoutSeconds];
    while (date.timeIntervalSinceNow > 0 && testModule.status == RCTTestStatusPending && error == nil) {
      [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    }

    // Take a weak reference to the JS context, so we track its deallocation later
    // (we can only do this now, since it's been lazily initialized)
    id jsExecutor = [bridge valueForKeyPath:@"batchedBridge.javaScriptExecutor"];
    if ([jsExecutor isKindOfClass:[RCTContextExecutor class]]) {
      weakJSContext = [jsExecutor valueForKey:@"context"];
    }
    [rootView removeFromSuperview];

    RCTSetLogFunction(RCTDefaultLogFunction);

    NSArray *nonLayoutSubviews = [vc.view.subviews filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id subview, NSDictionary *bindings) {
      return ![NSStringFromClass([subview class]) isEqualToString:@"_UILayoutGuide"];
    }]];
    RCTAssert(nonLayoutSubviews.count == 0, @"There shouldn't be any other views: %@", nonLayoutSubviews);

    if (expectErrorBlock) {
      RCTAssert(expectErrorBlock(error), @"Expected an error but nothing matched.");
    } else {
      RCTAssert(error == nil, @"RedBox error: %@", error);
      RCTAssert(testModule.status != RCTTestStatusPending, @"Test didn't finish within %0.f seconds", kTestTimeoutSeconds);
      RCTAssert(testModule.status == RCTTestStatusPassed, @"Test failed");
    }
    [bridge invalidate];
  }

  // Wait for the executor to have shut down completely before returning
  NSDate *teardownTimeout = [NSDate dateWithTimeIntervalSinceNow:kTestTeardownTimeoutSeconds];
  while (teardownTimeout.timeIntervalSinceNow > 0 && weakJSContext) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  RCTAssert(!weakJSContext, @"JS context was not deallocated after being invalidated");
}

@end

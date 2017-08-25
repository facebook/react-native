/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTestRunner.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>

#import "FBSnapshotTestController.h"
#import "RCTTestModule.h"

static const NSTimeInterval kTestTimeoutSeconds = 120;

@implementation RCTTestRunner
{
  FBSnapshotTestController *_testController;
  RCTBridgeModuleListProvider _moduleProvider;
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(RCTBridgeModuleListProvider)block
{
  RCTAssertParam(app);
  RCTAssertParam(referenceDirectory);

  if ((self = [super init])) {
    if (!referenceDirectory.length) {
      referenceDirectory = [[NSBundle bundleForClass:self.class].resourcePath stringByAppendingPathComponent:@"ReferenceImages"];
    }

    NSString *sanitizedAppName = [app stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    sanitizedAppName = [sanitizedAppName stringByReplacingOccurrencesOfString:@"\\" withString:@"-"];
    _testController = [[FBSnapshotTestController alloc] initWithTestName:sanitizedAppName];
    _testController.referenceImagesDirectory = referenceDirectory;
    _moduleProvider = [block copy];

    if (getenv("CI_USE_PACKAGER")) {
      _scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", app]];
    } else {
      _scriptURL = [[NSBundle bundleForClass:[RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
    }
    RCTAssert(_scriptURL != nil, @"No scriptURL set");
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
  [self runTest:test module:moduleName initialProps:nil configurationBlock:nil expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(RCTRootView *rootView))configurationBlock
{
  [self runTest:test module:moduleName initialProps:initialProps configurationBlock:configurationBlock expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(RCTRootView *rootView))configurationBlock
expectErrorRegex:(NSString *)errorRegex
{
  BOOL(^expectErrorBlock)(NSString *error)  = ^BOOL(NSString *error){
    return [error rangeOfString:errorRegex options:NSRegularExpressionSearch].location != NSNotFound;
  };

  [self runTest:test module:moduleName initialProps:initialProps configurationBlock:configurationBlock expectErrorBlock:expectErrorBlock];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(RCTRootView *rootView))configurationBlock
expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock
{
  __weak RCTBridge *batchedBridge;

  @autoreleasepool {
    __block NSString *error = nil;
    RCTLogFunction defaultLogFunction = RCTGetLogFunction();
    RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      defaultLogFunction(level, source, fileName, lineNumber, message);
      if (level >= RCTLogLevelError) {
        error = message;
      }
    });

    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_scriptURL
                                              moduleProvider:_moduleProvider
                                               launchOptions:nil];
    batchedBridge = [bridge batchedBridge];


    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProps];
#if TARGET_OS_TV
    rootView.frame = CGRectMake(0, 0, 1920, 1080); // Standard screen size for tvOS
#else
    rootView.frame = CGRectMake(0, 0, 320, 2000); // Constant size for testing on multiple devices
#endif

    RCTTestModule *testModule = [rootView.bridge moduleForClass:[RCTTestModule class]];
    RCTAssert(_testController != nil, @"_testController should not be nil");
    testModule.controller = _testController;
    testModule.testSelector = test;
    testModule.testSuffix = _testSuffix;
    testModule.view = rootView;

    UIViewController *vc = RCTSharedApplication().delegate.window.rootViewController;
    vc.view = [UIView new];
    [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized

    if (configurationBlock) {
      configurationBlock(rootView);
    }

    NSDate *date = [NSDate dateWithTimeIntervalSinceNow:kTestTimeoutSeconds];
    while (date.timeIntervalSinceNow > 0 && testModule.status == RCTTestStatusPending && error == nil) {
      [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    }

    [rootView removeFromSuperview];

    RCTSetLogFunction(defaultLogFunction);

#if RCT_DEV
    NSArray<UIView *> *nonLayoutSubviews = [vc.view.subviews filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id subview, NSDictionary *bindings) {
      return ![NSStringFromClass([subview class]) isEqualToString:@"_UILayoutGuide"];
    }]];

    RCTAssert(nonLayoutSubviews.count == 0, @"There shouldn't be any other views: %@", nonLayoutSubviews);
#endif

    if (expectErrorBlock) {
      RCTAssert(expectErrorBlock(error), @"Expected an error but nothing matched.");
    } else {
      RCTAssert(error == nil, @"RedBox error: %@", error);
      RCTAssert(testModule.status != RCTTestStatusPending, @"Test didn't finish within %0.f seconds", kTestTimeoutSeconds);
      RCTAssert(testModule.status == RCTTestStatusPassed, @"Test failed");
    }

    [bridge invalidate];
  }

  // Wait for bridge to disappear before continuing to the next test
  NSDate *invalidateTimeout = [NSDate dateWithTimeIntervalSinceNow:30];
  while (invalidateTimeout.timeIntervalSinceNow > 0 && batchedBridge != nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  RCTAssert(batchedBridge == nil, @"Bridge should be deallocated after the test");
}

@end

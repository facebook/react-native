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
#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTTestModule.h"
#import "RCTUtils.h"

#define TIMEOUT_SECONDS 60

@interface RCTBridge (RCTTestRunner)

@property (nonatomic, weak) RCTBridge *batchedBridge;

@end

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
    _scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.includeRequire.runModule.bundle?dev=true", app]];
#endif
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init)

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
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_scriptURL
                                            moduleProvider:_moduleProvider
                                             launchOptions:nil];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:moduleName];
  rootView.initialProperties = initialProps;
  rootView.frame = CGRectMake(0, 0, 320, 2000); // Constant size for testing on multiple devices

  NSString *testModuleName = RCTBridgeModuleNameForClass([RCTTestModule class]);
  RCTTestModule *testModule = rootView.bridge.batchedBridge.modules[testModuleName];
  RCTAssert(_testController != nil, @"_testController should not be nil");
  testModule.controller = _testController;
  testModule.testSelector = test;
  testModule.view = rootView;

  UIViewController *vc = [UIApplication sharedApplication].delegate.window.rootViewController;
  vc.view = [[UIView alloc] init];
  [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized

  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  NSString *error = [[RCTRedBox sharedInstance] currentErrorMessage];
  while ([date timeIntervalSinceNow] > 0 && testModule.status == RCTTestStatusPending && error == nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    error = [[RCTRedBox sharedInstance] currentErrorMessage];
  }
  [rootView removeFromSuperview];

  NSArray *nonLayoutSubviews = [vc.view.subviews filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id subview, NSDictionary *bindings) {
    return ![NSStringFromClass([subview class]) isEqualToString:@"_UILayoutGuide"];
  }]];
  RCTAssert(nonLayoutSubviews.count == 0, @"There shouldn't be any other views: %@", nonLayoutSubviews);

  [[RCTRedBox sharedInstance] dismiss];
  if (expectErrorBlock) {
    RCTAssert(expectErrorBlock(error), @"Expected an error but nothing matched.");
  } else {
    RCTAssert(error == nil, @"RedBox error: %@", error);
    RCTAssert(testModule.status != RCTTestStatusPending, @"Test didn't finish within %d seconds", TIMEOUT_SECONDS);
    RCTAssert(testModule.status == RCTTestStatusPassed, @"Test failed");
  }
}

@end

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
#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTTestModule.h"
#import "RCTUtils.h"

#define TIMEOUT_SECONDS 240

@interface RCTRootView (Testing)

- (instancetype)_initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                    launchOptions:(NSDictionary *)launchOptions
                   moduleProvider:(RCTBridgeModuleProviderBlock)moduleProvider;

@end

@implementation RCTTestRunner
{
  FBSnapshotTestController *_snapshotController;
}

- (instancetype)initWithApp:(NSString *)app referenceDir:(NSString *)referenceDir
{
  if ((self = [super init])) {
    NSString *sanitizedAppName = [app stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    sanitizedAppName = [sanitizedAppName stringByReplacingOccurrencesOfString:@"\\" withString:@"-"];
    _snapshotController = [[FBSnapshotTestController alloc] initWithTestName:sanitizedAppName];
    _snapshotController.referenceImagesDirectory = referenceDir;
    _script = [NSString stringWithFormat:@"http://localhost:8081/%@.includeRequire.runModule.bundle?dev=true", app];
  }
  return self;
}

- (void)setRecordMode:(BOOL)recordMode
{
  _snapshotController.recordMode = recordMode;
}

- (BOOL)recordMode
{
  return _snapshotController.recordMode;
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
{
  [self runTest:test module:moduleName initialProps:nil expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorRegex:(NSRegularExpression *)errorRegex
{
  [self runTest:test module:moduleName initialProps:initialProps expectErrorBlock:^BOOL(NSString *error){
    return [errorRegex numberOfMatchesInString:error options:0 range:NSMakeRange(0, [error length])] > 0;
  }];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock
{
  UIViewController *vc = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
  if ([vc.view isKindOfClass:[RCTRootView class]]) {
    [(RCTRootView *)vc.view invalidate]; // Make sure the normal app view doesn't interfere
  }
  vc.view = [[UIView alloc] init];

  RCTTestModule *testModule = [[RCTTestModule alloc] initWithSnapshotController:_snapshotController view:nil];
  testModule.testSelector = test;

  RCTRootView *rootView = [[RCTRootView alloc] _initWithBundleURL:[NSURL URLWithString:_script]
                                                      moduleName:moduleName
                                                   launchOptions:nil
                                                   moduleProvider:^{
                                                     return @[testModule];
                                                   }];
  [testModule setValue:rootView forKey:@"_view"];
  rootView.frame = CGRectMake(0, 0, 320, 2000);
  [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized
  rootView.initialProperties = initialProps;

  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  NSString *error = [[RCTRedBox sharedInstance] currentErrorMessage];
  while ([date timeIntervalSinceNow] > 0 && ![testModule isDone] && error == nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:date];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:date];
    error = [[RCTRedBox sharedInstance] currentErrorMessage];
  }
  [rootView invalidate];
  [rootView removeFromSuperview];
  RCTAssert(vc.view.subviews.count == 0, @"There shouldn't be any other views: %@", vc.view);
  vc.view = nil;
  [[RCTRedBox sharedInstance] dismiss];
  if (expectErrorBlock) {
    RCTAssert(expectErrorBlock(error), @"Expected an error but nothing matched.");
  } else if (error) {
    RCTAssert(error == nil, @"RedBox error: %@", error);
  } else {
    RCTAssert([testModule isDone], @"Test didn't finish within %d seconds", TIMEOUT_SECONDS);
  }
}

@end

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTestRunner.h"

#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTTestModule.h"
#import "RCTUtils.h"

#define TIMEOUT_SECONDS 240

@implementation RCTTestRunner

- (instancetype)initWithApp:(NSString *)app
{
  if (self = [super init]) {
    _script = [NSString stringWithFormat:@"http://localhost:8081/%@.includeRequire.runModule.bundle?dev=true", app];
  }
  return self;
}

- (void)runTest:(NSString *)moduleName
{
  [self runTest:moduleName initialProps:nil expectErrorBlock:nil];
}

- (void)runTest:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorRegex:(NSRegularExpression *)errorRegex
{
  [self runTest:moduleName initialProps:initialProps expectErrorBlock:^BOOL(NSString *error){
    return [errorRegex numberOfMatchesInString:error options:0 range:NSMakeRange(0, [error length])] > 0;
  }];
}

- (void)runTest:(NSString *)moduleName initialProps:(NSDictionary *)initialProps expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock
{
  RCTTestModule *testModule = [[RCTTestModule alloc] init];
  RCTRootView *rootView = [[RCTRootView alloc] init];
  UIViewController *vc = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
  vc.view = rootView;
  rootView.moduleProvider = ^(void){
    return @[testModule];
  };
  rootView.moduleName = moduleName;
  rootView.initialProperties = initialProps;
  rootView.scriptURL = [NSURL URLWithString:_script];

  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  NSString *error = [[RCTRedBox sharedInstance] currentErrorMessage];
  while ([date timeIntervalSinceNow] > 0 && ![testModule isDone] && error == nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:date];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:date];
    error = [[RCTRedBox sharedInstance] currentErrorMessage];
  }
  [[RCTRedBox sharedInstance] dismiss];
  if (expectErrorBlock) {
    RCTAssert(expectErrorBlock(error), @"Expected an error but got none.");
  } else if (error) {
    RCTAssert(error == nil, @"RedBox error: %@", error);
  } else {
    RCTAssert([testModule isDone], @"Test didn't finish within %d seconds", TIMEOUT_SECONDS);
  }
}

@end

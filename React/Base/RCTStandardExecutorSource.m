// Copyright 2015-present Facebook. All rights reserved.

#import "RCTStandardExecutorSource.h"

#import "RCTContextExecutor.h"
#import "RCTJavaScriptExecutor.h"
#import "RCTLog.h"
#import "RCTWebViewExecutor.h"

@implementation RCTStandardExecutorSource

- (instancetype)init
{
  if (self = [super init]) {
    _executorType = RCTStandardExecutorTypeDefault;
  }
  return self;
}

- (id<RCTJavaScriptExecutor>)executor
{
  switch (_executorType) {
    case RCTStandardExecutorTypeDefault:
      return [[RCTContextExecutor alloc] init];
    case RCTStandardExecutorTypeUIWebView: {
      Class executorClass = NSClassFromString(@"RCTWebViewExecutor");
      if (!executorClass) {
        RCTLogError(@"Safari debugger is available only in development mode");
        executorClass = [RCTContextExecutor class];
      }
      return [[executorClass alloc] init];
    }
    case RCTStandardExecutorTypeWebSocket: {
      Class executorClass = NSClassFromString(@"RCTWebSocketExecutor");
      if (!executorClass) {
        [[[UIAlertView alloc] initWithTitle:@"Chrome Debugger Unavailable"
                                    message:@"You need to include the RCTWebSocket library to enable Chrome debugging"
                                   delegate:nil
                          cancelButtonTitle:@"OK"
                          otherButtonTitles:nil] show];
        executorClass = [RCTContextExecutor class];
      }
      return [[executorClass alloc] init];
    }
  }
}

@end

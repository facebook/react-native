// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTExceptionsManager.h"

#import "RCTRedBox.h"

@implementation RCTExceptionsManager

- (void)reportUnhandledExceptionWithMessage:(NSString *)message stack:(NSArray *)stack
{
  RCT_EXPORT(reportUnhandledException);

  [[RCTRedBox sharedInstance] showErrorMessage:message withStack:stack];
}

- (void)updateExceptionMessage:(NSString *)message stack:(NSArray *)stack
{
  RCT_EXPORT(updateExceptionMessage);

  [[RCTRedBox sharedInstance] updateErrorMessage:message withStack:stack];
}

@end

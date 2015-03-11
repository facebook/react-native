// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTExceptionsManager.h"

#import "RCTRedBox.h"

@implementation RCTExceptionsManager
{
  __weak id<RCTExceptionsManagerDelegate> _delegate;
}

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [super init])) {
    _delegate = delegate;
  }
  return self;
}

- (instancetype)init
{
  return [self initWithDelegate:nil];
}

- (void)reportUnhandledExceptionWithMessage:(NSString *)message stack:(NSArray *)stack
{
  RCT_EXPORT(reportUnhandledException);

  if (_delegate) {
    [_delegate unhandledJSExceptionWithMessage:message stack:stack];
  } else {
    [[RCTRedBox sharedInstance] showErrorMessage:message withStack:stack];
  }
}

- (void)updateExceptionMessage:(NSString *)message stack:(NSArray *)stack
{
  RCT_EXPORT(updateExceptionMessage);

  [[RCTRedBox sharedInstance] updateErrorMessage:message withStack:stack];
}

@end

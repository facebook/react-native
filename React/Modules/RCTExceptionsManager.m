/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

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

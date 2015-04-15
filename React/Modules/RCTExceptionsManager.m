/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTExceptionsManager.h"

#import "RCTLog.h"
#import "RCTRedBox.h"
#import "RCTRootView.h"

@implementation RCTExceptionsManager
{
  __weak id<RCTExceptionsManagerDelegate> _delegate;
  NSUInteger _reloadRetries;
}

#ifndef DEBUG
static NSUInteger RCTReloadRetries = 0;
#endif

RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [super init])) {
    _delegate = delegate;
    _maxReloadAttempts = 0;
  }
  return self;
}

- (instancetype)init
{
  return [self initWithDelegate:nil];
}

RCT_EXPORT_METHOD(reportUnhandledException:(NSString *)message
                  stack:(NSArray *)stack)
{
  if (_delegate) {
    [_delegate unhandledJSExceptionWithMessage:message stack:stack];
    return;
  }

#ifdef DEBUG
    [[RCTRedBox sharedInstance] showErrorMessage:message withStack:stack];
#else
  if (RCTReloadRetries < _maxReloadAttempts) {
    RCTReloadRetries++;
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification object:nil];
    });
  } else {
    NSError *error;
    const NSUInteger MAX_SANITIZED_LENGTH = 75;
    // Filter out numbers so the same base errors are mapped to the same categories independent of incorrect values.
    NSString *pattern = @"[+-]?\\d+[,.]?\\d*";
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:pattern options:0 error:&error];
    RCTAssert(error == nil, @"Bad regex pattern: %@", pattern);
    NSString *sanitizedMessage = [regex stringByReplacingMatchesInString:message
                                                                 options:0
                                                                   range:NSMakeRange(0, message.length)
                                                            withTemplate:@"<num>"];
    if (sanitizedMessage.length > MAX_SANITIZED_LENGTH) {
      sanitizedMessage = [[sanitizedMessage substringToIndex:MAX_SANITIZED_LENGTH] stringByAppendingString:@"..."];
    }
    NSMutableString *prettyStack = [@"\n" mutableCopy];
    for (NSDictionary *frame in stack) {
      [prettyStack appendFormat:@"%@@%@:%@\n", frame[@"methodName"], frame[@"lineNumber"], frame[@"column"]];
    }

    NSString *name = [@"Unhandled JS Exception: " stringByAppendingString:sanitizedMessage];
    [NSException raise:name format:@"Message: %@, stack: %@", message, prettyStack];
  }
#endif
}

RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray *)stack)
{
  [[RCTRedBox sharedInstance] updateErrorMessage:message withStack:stack];
}

@end

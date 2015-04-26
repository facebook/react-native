/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTExceptionsManager.h"

#import "RCTDefines.h"
#import "RCTLog.h"
#import "RCTRedBox.h"
#import "RCTRootView.h"

@implementation RCTExceptionsManager
{
  __weak id<RCTExceptionsManagerDelegate> _delegate;
  NSUInteger _reloadRetries;
}

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

#if RCT_DEBUG // Red box is only available in debug mode

  [[RCTRedBox sharedInstance] showErrorMessage:message withStack:stack];

#else

  static NSUInteger reloadRetries = 0;
  const NSUInteger maxMessageLength = 75;

  if (reloadRetries < _maxReloadAttempts) {

    reloadRetries++;
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                        object:nil];

  } else {

    // Filter out numbers so the same base errors are mapped to the same categories independent of incorrect values.
    NSString *pattern = @"[+-]?\\d+[,.]?\\d*";
    NSString *sanitizedMessage = [message stringByReplacingOccurrencesOfString:pattern withString:@"<num>" options:NSRegularExpressionSearch range:(NSRange){0, message.length}];

    if (sanitizedMessage.length > maxMessageLength) {
      sanitizedMessage = [[sanitizedMessage substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
    }

    NSMutableString *prettyStack = [NSMutableString stringWithString:@"\n"];
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

#if RCT_DEBUG // Red box is only available in debug mode

    [[RCTRedBox sharedInstance] updateErrorMessage:message withStack:stack];

#endif

}

@end

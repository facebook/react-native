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

@synthesize bridge = _bridge;

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

RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // TODO(#7070533): report a soft error to the server
  if (_delegate) {
    if ([_delegate respondsToSelector:@selector(handleSoftJSExceptionWithMessage:stack:exceptionId:)]) {
      [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
    } else {
      [_delegate handleSoftJSExceptionWithMessage:message stack:stack];
    }
    return;
  }
  [_bridge.redBox showErrorMessage:message withStack:stack];
}

RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  if (_delegate) {
    if ([_delegate respondsToSelector:@selector(handleFatalJSExceptionWithMessage:stack:exceptionId:)]) {
      [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
    } else {
      [_delegate handleFatalJSExceptionWithMessage:message stack:stack];
    }
    return;
  }

  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (!RCT_DEBUG) {

    static NSUInteger reloadRetries = 0;
    const NSUInteger maxMessageLength = 75;

    if (reloadRetries < _maxReloadAttempts) {

      reloadRetries++;
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                          object:nil];

    } else {

      if (message.length > maxMessageLength) {
        message = [[message substringToIndex:maxMessageLength] stringByAppendingString:@"..."];
      }

      NSMutableString *prettyStack = [NSMutableString stringWithString:@"\n"];
      for (NSDictionary *frame in stack) {
        [prettyStack appendFormat:@"%@@%@:%@\n", frame[@"methodName"], frame[@"lineNumber"], frame[@"column"]];
      }

      NSString *name = [@"Unhandled JS Exception: " stringByAppendingString:message];
      [NSException raise:name format:@"Message: %@, stack: %@", message, prettyStack];
    }
  }
}

RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  if (_delegate) {
    if ([_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
      [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
    } else {
      [_delegate updateJSExceptionWithMessage:message stack:stack];
    }
    return;
  }

  [_bridge.redBox updateErrorMessage:message withStack:stack];
}

// Deprecated.  Use reportFatalException directly instead.
RCT_EXPORT_METHOD(reportUnhandledException:(NSString *)message
                  stack:(NSArray *)stack)
{
  [self reportFatalException:message stack:stack exceptionId:@-1];
}
@end

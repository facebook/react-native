/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTExceptionsManager.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTRedBox.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTRootView.h>

#import "CoreModulesPlugins.h"

@interface RCTExceptionsManager () <NativeExceptionsManagerSpec>

@end

@implementation RCTExceptionsManager

@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [self init])) {
    _delegate = delegate;
  }
  return self;
}

- (void)reportSoft:(NSString *)message
              stack:(NSArray<NSDictionary *> *)stack
        exceptionId:(double)exceptionId
    extraDataAsJSON:(nullable NSString *)extraDataAsJSON
{
  if (RCTRedBoxGetEnabled()) {
    RCTRedBox *redbox = [_moduleRegistry moduleForName:"RedBox"];
    [redbox showErrorMessage:message withStack:stack errorCookie:(int)exceptionId];
  }

  if (_delegate) {
    [_delegate handleSoftJSExceptionWithMessage:message
                                          stack:stack
                                    exceptionId:[NSNumber numberWithDouble:exceptionId]
                                extraDataAsJSON:extraDataAsJSON];
  }
}

- (void)reportFatal:(NSString *)message
              stack:(NSArray<NSDictionary *> *)stack
        exceptionId:(double)exceptionId
    extraDataAsJSON:(nullable NSString *)extraDataAsJSON
{
  if (RCTRedBoxGetEnabled()) {
    RCTRedBox *redbox = [_moduleRegistry moduleForName:"RedBox"];
    [redbox showErrorMessage:message withStack:stack errorCookie:(int)exceptionId];
  }

  if (_delegate) {
    [_delegate handleFatalJSExceptionWithMessage:message
                                           stack:stack
                                     exceptionId:[NSNumber numberWithDouble:exceptionId]
                                 extraDataAsJSON:extraDataAsJSON];
  }

  static NSUInteger reloadRetries = 0;
  if (!RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
    reloadRetries++;
    RCTTriggerReloadCommandListeners(@"JS Crash Reload");
  } else if (!RCT_DEV) {
    NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
    NSDictionary *errorInfo =
        @{NSLocalizedDescriptionKey : description, RCTJSStackTraceKey : stack, RCTJSExtraDataKey : extraDataAsJSON};
    RCTFatal([NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo]);
  }
}

RCT_EXPORT_METHOD(reportSoftException
                  : (NSString *)message stack
                  : (NSArray<NSDictionary *> *)stack exceptionId
                  : (double)exceptionId)
{
  [self reportSoft:message stack:stack exceptionId:exceptionId extraDataAsJSON:nil];
}

RCT_EXPORT_METHOD(reportFatalException
                  : (NSString *)message stack
                  : (NSArray<NSDictionary *> *)stack exceptionId
                  : (double)exceptionId)
{
  [self reportFatal:message stack:stack exceptionId:exceptionId extraDataAsJSON:nil];
}

RCT_EXPORT_METHOD(updateExceptionMessage
                  : (NSString *)message stack
                  : (NSArray<NSDictionary *> *)stack exceptionId
                  : (double)exceptionId)
{
  if (RCTRedBoxGetEnabled()) {
    RCTRedBox *redbox = [_moduleRegistry moduleForName:"RedBox"];
    [redbox updateErrorMessage:message withStack:stack errorCookie:(int)exceptionId];
  }

  if (_delegate && [_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }
}

// Deprecated.  Use reportFatalException directly instead.
RCT_EXPORT_METHOD(reportUnhandledException : (NSString *)message stack : (NSArray<NSDictionary *> *)stack)
{
  [self reportFatalException:message stack:stack exceptionId:-1];
}

RCT_EXPORT_METHOD(dismissRedbox) {}

RCT_EXPORT_METHOD(reportException : (JS::NativeExceptionsManager::ExceptionData &)data)
{
  NSString *message = data.message();
  double exceptionId = data.id_();

  // Reserialize data.stack() into an array of untyped dictionaries.
  // TODO: (moti) T53588496 Replace `(NSArray<NSDictionary *> *)stack` in
  // reportFatalException etc with a typed interface.
  NSMutableArray<NSDictionary *> *stackArray = [NSMutableArray<NSDictionary *> new];
  for (auto frame : data.stack()) {
    NSMutableDictionary *frameDict = [NSMutableDictionary new];
    if (frame.column().has_value()) {
      frameDict[@"column"] = @(frame.column().value());
    }
    frameDict[@"file"] = frame.file();
    if (frame.lineNumber().has_value()) {
      frameDict[@"lineNumber"] = @(frame.lineNumber().value());
    }
    frameDict[@"methodName"] = frame.methodName();
    if (frame.collapse().has_value()) {
      frameDict[@"collapse"] = @(frame.collapse().value());
    }
    [stackArray addObject:frameDict];
  }

  NSDictionary *extraData = (NSDictionary *)data.extraData();
  NSString *extraDataAsJSON = RCTJSONStringify(extraData, NULL);

  if (data.isFatal()) {
    [self reportFatal:message stack:stackArray exceptionId:exceptionId extraDataAsJSON:extraDataAsJSON];
  } else {
    [self reportSoft:message stack:stackArray exceptionId:exceptionId extraDataAsJSON:extraDataAsJSON];
  }
}

- (void)reportJsException:(nullable NSString *)message
                    stack:(nullable NSArray<NSDictionary *> *)stack
              exceptionId:(double)exceptionId
                  isFatal:(bool)isFatal
{
  if (isFatal) {
    [self reportFatalException:message stack:stack exceptionId:exceptionId];
  } else {
    [self reportSoftException:message stack:stack exceptionId:exceptionId];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeExceptionsManagerSpecJSI>(params);
}

@end

Class RCTExceptionsManagerCls(void)
{
  return RCTExceptionsManager.class;
}

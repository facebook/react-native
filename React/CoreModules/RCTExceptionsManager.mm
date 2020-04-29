<<<<<<< HEAD
/**
=======
/*
>>>>>>> fb/0.62-stable
 * Copyright (c) Facebook, Inc. and its affiliates.
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
<<<<<<< HEAD
=======
#import <React/RCTReloadCommand.h>
>>>>>>> fb/0.62-stable
#import <React/RCTRootView.h>

#import "CoreModulesPlugins.h"

@interface RCTExceptionsManager() <NativeExceptionsManagerSpec>

@end

@implementation RCTExceptionsManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [self init])) {
    _delegate = delegate;
  }
  return self;
}

<<<<<<< HEAD
=======
- (void)reportSoft: (NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(double)exceptionId suppressRedBox: (BOOL) suppressRedBox {
    if (!suppressRedBox) {
        [_bridge.redBox showErrorMessage:message withStack:stack errorCookie:((int)exceptionId)];
    }

    if (_delegate) {
      [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
    }
}

- (void)reportFatal: (NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(double)exceptionId suppressRedBox: (BOOL) suppressRedBox {
    if (!suppressRedBox) {
        [_bridge.redBox showErrorMessage:message withStack:stack errorCookie:((int)exceptionId)];
    }

    if (_delegate) {
      [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
    }

    static NSUInteger reloadRetries = 0;
    if (!RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
      reloadRetries++;
      RCTTriggerReloadCommandListeners(@"JS Crash Reload");
    } else if (!RCT_DEV || !suppressRedBox) {
      NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
      NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, RCTJSStackTraceKey: stack };
      RCTFatal([NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo]);
    }
}


>>>>>>> fb/0.62-stable
RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double)exceptionId)
{
<<<<<<< HEAD
  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (_delegate) {
    [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }
=======
  [self reportSoft:message stack:stack exceptionId:exceptionId suppressRedBox:NO];
>>>>>>> fb/0.62-stable
}

RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double) exceptionId)
{
<<<<<<< HEAD
  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (_delegate) {
    [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }

  static NSUInteger reloadRetries = 0;
  if (!RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
    reloadRetries++;
    [_bridge reload];
  } else {
    NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
    NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, RCTJSStackTraceKey: stack };
    RCTFatal([NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo]);
  }
=======
  [self reportFatal:message stack:stack exceptionId:exceptionId suppressRedBox:NO];
>>>>>>> fb/0.62-stable
}

RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double)exceptionId)
{
<<<<<<< HEAD
  [_bridge.redBox updateErrorMessage:message withStack:stack];
=======
  [_bridge.redBox updateErrorMessage:message withStack:stack errorCookie:((int)exceptionId)];
>>>>>>> fb/0.62-stable

  if (_delegate && [_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }
}

// Deprecated.  Use reportFatalException directly instead.
RCT_EXPORT_METHOD(reportUnhandledException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack)
{
  [self reportFatalException:message stack:stack exceptionId:-1];
}

RCT_EXPORT_METHOD(dismissRedbox)
{

}

RCT_EXPORT_METHOD(reportException:(JS::NativeExceptionsManager::ExceptionData &)data)
{
<<<<<<< HEAD

}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:
(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker
=======
  NSString *message = data.message();
  double exceptionId = data.id_();
  id<NSObject> extraData = data.extraData();

  // Reserialize data.stack() into an array of untyped dictionaries.
  // TODO: (moti) T53588496 Replace `(NSArray<NSDictionary *> *)stack` in
  // reportFatalException etc with a typed interface.
  NSMutableArray<NSDictionary *> *stackArray = [NSMutableArray<NSDictionary *> new];
  for (auto frame: data.stack()) {
    NSMutableDictionary * frameDict = [NSMutableDictionary new];
    if (frame.column().hasValue()) {
      frameDict[@"column"] = @(frame.column().value());
    }
    frameDict[@"file"] = frame.file();
    if (frame.lineNumber().hasValue()) {
        frameDict[@"lineNumber"] = @(frame.lineNumber().value());
    }
    frameDict[@"methodName"] = frame.methodName();
    if (frame.collapse().hasValue()) {
        frameDict[@"collapse"] = @(frame.collapse().value());
    }
    [stackArray addObject:frameDict];
  }
  NSDictionary *dict = (NSDictionary *)extraData;
    BOOL suppressRedBox = [[dict objectForKey:@"suppressRedBox"] boolValue];

  if (data.isFatal()) {
    [self reportFatal:message stack:stackArray exceptionId:exceptionId suppressRedBox:suppressRedBox];
  } else {
    [self reportSoft:message stack:stackArray exceptionId:exceptionId suppressRedBox:suppressRedBox];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:
(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
>>>>>>> fb/0.62-stable
{
  return std::make_shared<facebook::react::NativeExceptionsManagerSpecJSI>(self, jsInvoker);
}

@end

Class RCTExceptionsManagerCls(void)
{
  return RCTExceptionsManager.class;
}

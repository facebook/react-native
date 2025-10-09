/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTAssert.h>
#import <React/RCTDefines.h>
#import <React/RCTUtils.h>

@class RCTModuleRegistry;
@class RCTCallableJSModules;

#ifndef RCTLOG_ENABLED
#define RCTLOG_ENABLED 1
#endif

/**
 * Thresholds for logs to display a redbox. You can override these values when debugging
 * in order to tweak the default logging behavior.
 */
#ifndef RCTLOG_REDBOX_LEVEL
#define RCTLOG_REDBOX_LEVEL RCTLogLevelError
#endif

/**
 * Logging macros. Use these to log information, warnings and errors in your
 * own code.
 */
#define RCTLog(...) _RCTLog(RCTLogLevelInfo, __VA_ARGS__)
#define RCTLogTrace(...) _RCTLog(RCTLogLevelTrace, __VA_ARGS__)
#define RCTLogInfo(...) _RCTLog(RCTLogLevelInfo, __VA_ARGS__)
#define RCTLogAdvice(string, ...) RCTLogWarn([@"(ADVICE) " stringByAppendingString:(NSString *)string], __VA_ARGS__)
#define RCTLogWarn(...) _RCTLog(RCTLogLevelWarning, __VA_ARGS__)
#define RCTLogError(...) _RCTLog(RCTLogLevelError, __VA_ARGS__)

/**
 * An enum representing the severity of the log message.
 */
typedef NS_ENUM(NSInteger, RCTLogLevel) {
  RCTLogLevelTrace = 0,
  RCTLogLevelInfo = 1,
  RCTLogLevelWarning = 2,
  RCTLogLevelError = 3,
  RCTLogLevelFatal = 4
};

/**
 * An enum representing the source of a log message.
 */
typedef NS_ENUM(NSInteger, RCTLogSource) { RCTLogSourceNative = 1, RCTLogSourceJavaScript = 2 };

/**
 * A block signature to be used for custom logging functions. In most cases you
 * will want to pass these arguments to the RCTFormatLog function in order to
 * generate a string.
 */
typedef void (^RCTLogFunction)(
    RCTLogLevel level,
    RCTLogSource source,
    NSString *fileName,
    NSNumber *lineNumber,
    NSString *message);

/**
 * A method to generate a string from a collection of log data. To omit any
 * particular data from the log, just pass nil or zero for the argument.
 */
RCT_EXTERN NSString *
RCTFormatLog(NSDate *timestamp, RCTLogLevel level, NSString *fileName, NSNumber *lineNumber, NSString *message);

/**
 * A method to generate a string RCTLogLevel
 */
RCT_EXTERN NSString *RCTFormatLogLevel(RCTLogLevel /*level*/);

/**
 * A method to generate a string from a RCTLogSource
 */
RCT_EXTERN NSString *RCTFormatLogSource(RCTLogSource /*source*/);

/**
 * The default logging function used by RCTLogXX.
 */
extern RCTLogFunction RCTDefaultLogFunction;

/**
 * These methods get and set the global logging threshold. This is the level
 * below which logs will be ignored. Default is RCTLogLevelInfo for debug and
 * RCTLogLevelError for production.
 */
RCT_EXTERN void RCTSetLogThreshold(RCTLogLevel threshold);
RCT_EXTERN RCTLogLevel RCTGetLogThreshold(void);

/**
 * These methods get and set the global logging function called by the RCTLogXX
 * macros. You can use these to replace the standard behavior with custom log
 * functionality.
 */
RCT_EXTERN void RCTSetLogFunction(RCTLogFunction logFunction);
RCT_EXTERN RCTLogFunction RCTGetLogFunction(void);

/**
 * This appends additional code to the existing log function, without replacing
 * the existing functionality. Useful if you just want to forward logs to an
 * extra service without changing the default behavior.
 */
RCT_EXTERN void RCTAddLogFunction(RCTLogFunction logFunction);

/**
 * This method temporarily overrides the log function while performing the
 * specified block. This is useful for testing purposes (to detect if a given
 * function logs something) or to suppress or override logging temporarily.
 */
RCT_EXTERN void RCTPerformBlockWithLogFunction(void (^block)(void), RCTLogFunction logFunction);

/**
 * This method adds a conditional prefix to any messages logged within the scope
 * of the passed block. This is useful for adding additional context to log
 * messages. The block will be performed synchronously on the current thread.
 */
RCT_EXTERN void RCTPerformBlockWithLogPrefix(void (^block)(void), NSString *prefix);

/**
 * These methods allows static methods in RCTLog to call NativeModules and TurboModules.
 * TODO(T112035275) After Bridgeless mixed mode is removed, we can merge these methods
 */
RCT_EXTERN void RCTLogSetBridgeModuleRegistry(RCTModuleRegistry *moduleRegistry);
RCT_EXTERN void RCTLogSetBridgelessModuleRegistry(RCTModuleRegistry *moduleRegistry);

/**
 * This methods allows static methods in RCTLog to call JS methods.
 * TODO(T112035275) After Bridgeless mixed mode is removed, we can merge these methods
 */
RCT_EXTERN void RCTLogSetBridgeCallableJSModules(RCTCallableJSModules *callableJSModules);
RCT_EXTERN void RCTLogSetBridgelessCallableJSModules(RCTCallableJSModules *callableJSModules);

/**
 * Private logging function - ignore this.
 */
#if RCTLOG_ENABLED
#define _RCTLog(lvl, ...) _RCTLogNativeInternal(lvl, __FILE__, __LINE__, __VA_ARGS__)
#else
#define _RCTLog(lvl, ...) \
  do {                    \
  } while (0)
#endif

RCT_EXTERN void
_RCTLogNativeInternal(RCTLogLevel /*level*/, const char * /*fileName*/, int /*lineNumber*/, NSString * /*format*/, ...)
    NS_FORMAT_FUNCTION(4, 5);
RCT_EXTERN void _RCTLogJavaScriptInternal(RCTLogLevel /*level*/, NSString * /*message*/);

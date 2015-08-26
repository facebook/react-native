/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTAssert.h"
#import "RCTDefines.h"

/**
 * Thresholds for logs to raise an assertion, or display redbox, respectively.
 * You can override these values when debugging in order to tweak the default
 * logging behavior.
 */
#define RCTLOG_FATAL_LEVEL RCTLogLevelMustFix
#define RCTLOG_REDBOX_LEVEL RCTLogLevelError

/**
 * An enum representing the severity of the log message.
 */
typedef NS_ENUM(NSInteger, RCTLogLevel) {
  RCTLogLevelInfo = 1,
  RCTLogLevelWarning = 2,
  RCTLogLevelError = 3,
  RCTLogLevelMustFix = 4
};

/**
 * A block signature to be used for custom logging functions. In most cases you
 * will want to pass these arguments to the RCTFormatLog function in order to
 * generate a string.
 */
typedef void (^RCTLogFunction)(
  RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
);

/**
 * A method to generate a string from a collection of log data. To omit any
 * particular data from the log, just pass nil or zero for the argument.
 */
RCT_EXTERN NSString *RCTFormatLog(
  NSDate *timestamp,
  RCTLogLevel level,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *message
);

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
 * Private logging function - ignore this.
 */
#define _RCTLog(lvl, ...) do { \
if (lvl >= RCTLOG_FATAL_LEVEL) { RCTAssert(NO, __VA_ARGS__); } \
_RCTLogFormat(lvl, __FILE__, __LINE__, __VA_ARGS__); } while (0)
RCT_EXTERN void _RCTLogFormat(RCTLogLevel, const char *, int, NSString *, ...) NS_FORMAT_FUNCTION(4,5);

/**
 * Logging macros. Use these to log information, warnings and errors in your
 * own code.
 */
#define RCTLog(...) _RCTLog(RCTLogLevelInfo, __VA_ARGS__)
#define RCTLogInfo(...) _RCTLog(RCTLogLevelInfo, __VA_ARGS__)
#define RCTLogWarn(...) _RCTLog(RCTLogLevelWarning, __VA_ARGS__)
#define RCTLogError(...) _RCTLog(RCTLogLevelError, __VA_ARGS__)
#define RCTLogMustFix(...) _RCTLog(RCTLogLevelMustFix, __VA_ARGS__)

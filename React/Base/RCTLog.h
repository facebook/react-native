/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssert.h"
#import "RCTRedBox.h"

#define RCTLOG_INFO 1
#define RCTLOG_WARN 2
#define RCTLOG_ERROR 3
#define RCTLOG_MUSTFIX 4

// If set to e.g. `RCTLOG_ERROR`, will assert after logging the first error.
#if DEBUG
#define RCTLOG_FATAL_LEVEL RCTLOG_MUSTFIX
#define RCTLOG_REDBOX_LEVEL RCTLOG_ERROR
#else
#define RCTLOG_FATAL_LEVEL (RCTLOG_MUSTFIX + 1)
#define RCTLOG_REDBOX_LEVEL (RCTLOG_MUSTFIX + 1)
#endif

// If defined, only log messages that match this regex will fatal
#define RCTLOG_FATAL_REGEX nil

extern __unsafe_unretained NSString *RCTLogLevels[];

#define _RCTLog(_level, ...) do {                                                                                                          \
  NSString *__RCTLog__levelStr = RCTLogLevels[_level - 1];                                                                                 \
  NSString *__RCTLog__msg = RCTLogObjects(RCTLogFormat(__FILE__, __LINE__, __PRETTY_FUNCTION__, __VA_ARGS__), __RCTLog__levelStr);         \
  if (_level >= RCTLOG_FATAL_LEVEL) {                                                                                                      \
    BOOL __RCTLog__fail = YES;                                                                                                             \
    if (RCTLOG_FATAL_REGEX) {                                                                                                              \
      NSRegularExpression *__RCTLog__regex = [NSRegularExpression regularExpressionWithPattern:RCTLOG_FATAL_REGEX options:0 error:NULL];   \
      __RCTLog__fail = [__RCTLog__regex numberOfMatchesInString:__RCTLog__msg options:0 range:NSMakeRange(0, [__RCTLog__msg length])] > 0; \
    }                                                                                                                                      \
    RCTCAssert(!__RCTLog__fail, @"RCTLOG_FATAL_LEVEL %@: %@", __RCTLog__levelStr, __RCTLog__msg);                                          \
  }                                                                                                                                        \
  if (_level >= RCTLOG_REDBOX_LEVEL) {                                                                                                     \
    [[RCTRedBox sharedInstance] showErrorMessage:__RCTLog__msg];                                                                           \
  }                                                                                                                                        \
} while (0)

#define RCTLog(...) _RCTLog(RCTLOG_INFO, __VA_ARGS__)
#define RCTLogInfo(...) _RCTLog(RCTLOG_INFO, __VA_ARGS__)
#define RCTLogWarn(...) _RCTLog(RCTLOG_WARN, __VA_ARGS__)
#define RCTLogError(...) _RCTLog(RCTLOG_ERROR, __VA_ARGS__)
#define RCTLogMustFix(...) _RCTLog(RCTLOG_MUSTFIX, __VA_ARGS__)

#ifdef __cplusplus
extern "C" {
#endif

NSString *RCTLogObjects(NSArray *objects, NSString *level);
NSArray *RCTLogFormat(const char *file, int lineNumber, const char *funcName, NSString *format, ...) NS_FORMAT_FUNCTION(4,5);

void RCTInjectLogFunction(void (^logFunction)(NSString *msg));

#ifdef __cplusplus
}
#endif

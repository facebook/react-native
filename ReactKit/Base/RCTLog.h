// Copyright 2004-present Facebook. All Rights Reserved.

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

#define _RCTLog(__RCTLog__level, ...) do {                                                                                                       \
  NSString *__RCTLog__levelStr;                                                                                                                  \
  switch(__RCTLog__level) {                                                                                                                      \
    case RCTLOG_INFO: __RCTLog__levelStr = @"info"; break;                                                                                       \
    case RCTLOG_WARN: __RCTLog__levelStr = @"warn"; break;                                                                                       \
    case RCTLOG_ERROR: __RCTLog__levelStr = @"error"; break;                                                                                     \
    case RCTLOG_MUSTFIX: __RCTLog__levelStr = @"mustfix"; break;                                                                                 \
  }                                                                                                                                              \
  NSString *__RCTLog__msg = _RCTLogObjects(RCTLogFormat(__VA_ARGS__), __RCTLog__levelStr);                                                       \
  if (__RCTLog__level >= RCTLOG_FATAL_LEVEL) {                                                                                                   \
    BOOL __RCTLog__fail = YES;                                                                                                                   \
    if (RCTLOG_FATAL_REGEX) {                                                                                                                    \
      NSError *__RCTLog__e;                                                                                                                      \
      NSRegularExpression *__RCTLog__regex = [NSRegularExpression regularExpressionWithPattern:RCTLOG_FATAL_REGEX options:0 error:&__RCTLog__e]; \
      __RCTLog__fail = [__RCTLog__regex numberOfMatchesInString:__RCTLog__msg options:0 range:NSMakeRange(0, [__RCTLog__msg length])] > 0;       \
    }                                                                                                                                            \
    RCTCAssert(!__RCTLog__fail, @"RCTLOG_FATAL_LEVEL %@: %@", __RCTLog__levelStr, __RCTLog__msg);                                                \
  }                                                                                                                                              \
  if (__RCTLog__level >= RCTLOG_REDBOX_LEVEL) {                                                                                                  \
    RCTRedBox *__RCTLog__redBox = [RCTRedBox sharedInstance];                                                                                    \
    [__RCTLog__redBox showErrorMessage:__RCTLog__msg];                                                                                           \
  }                                                                                                                                              \
} while (0)

#define RCTLog(...) _RCTLog(RCTLOG_INFO, __VA_ARGS__)
#define RCTLogInfo(...) _RCTLog(RCTLOG_INFO, __VA_ARGS__)
#define RCTLogWarn(...) _RCTLog(RCTLOG_WARN, __VA_ARGS__)
#define RCTLogError(...) _RCTLog(RCTLOG_ERROR, __VA_ARGS__)
#define RCTLogMustFix(...) _RCTLog(RCTLOG_MUSTFIX, __VA_ARGS__)

#define RCTLogFormat(...) _RCTLogFormat(__FILE__, __LINE__, __PRETTY_FUNCTION__, __VA_ARGS__)
#define RCTLogFormatString(...) _RCTLogFormatString(__FILE__, __LINE__, __PRETTY_FUNCTION__, __VA_ARGS__)

#ifdef __cplusplus
extern "C" {
#endif

NSString *_RCTLogObjects(NSArray *objects, NSString *level);
NSArray *_RCTLogFormat(const char *file, int lineNumber, const char *funcName, NSString *format, ...) NS_FORMAT_FUNCTION(4,5);
NSString *_RCTLogFormatString(const char *file, int lineNumber, const char *funcName, NSString *format, ...) NS_FORMAT_FUNCTION(4,5);

#ifdef __cplusplus
}
#endif

typedef void (^RCTLogFunction)(NSString *format, NSString *str);
void RCTInjectLogFunction(RCTLogFunction func);

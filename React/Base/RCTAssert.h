/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTDefines.h"

/**
 * The default error domain to be used for React errors.
 */
RCT_EXTERN NSString *const RCTErrorDomain;

/**
 * A block signature to be used for custom assertion handling.
 */
typedef void (^RCTAssertFunction)(
  NSString *condition,
  NSString *fileName,
  NSNumber *lineNumber,
  NSString *function,
  NSString *message
);

/**
 * This is the main assert macro that you should use.
 */
#define RCTAssert(condition, ...) do { \
  if ((condition) == 0) { \
    _RCTAssertFormat(#condition, __FILE__, __LINE__, __func__, __VA_ARGS__); \
    if (RCT_NSASSERT) { \
      [[NSAssertionHandler currentHandler] handleFailureInFunction:@(__func__) \
        file:@(__FILE__) lineNumber:__LINE__ description:__VA_ARGS__]; \
    } \
  } \
} while (false)
RCT_EXTERN void _RCTAssertFormat(
  const char *, const char *, int, const char *, NSString *, ...
) NS_FORMAT_FUNCTION(5,6);

/**
 * Convenience macro for asserting that a parameter is non-nil/non-zero.
 */
#define RCTAssertParam(name) RCTAssert(name, \
@"'%s' is a required parameter", #name)

/**
 * Convenience macro for asserting that we're running on main thread.
 */
#define RCTAssertMainThread() RCTAssert([NSThread isMainThread], \
@"This function must be called on the main thread")

/**
 * These methods get and set the current assert function called by the RCTAssert
 * macros. You can use these to replace the standard behavior with custom log
 * functionality.
 */
RCT_EXTERN void RCTSetAssertFunction(RCTAssertFunction assertFunction);
RCT_EXTERN RCTAssertFunction RCTGetAssertFunction(void);

/**
 * This appends additional code to the existing assert function, without
 * replacing the existing functionality. Useful if you just want to forward
 * assert info to an extra service without changing the default behavior.
 */
RCT_EXTERN void RCTAddAssertFunction(RCTAssertFunction assertFunction);

/**
 * This method temporarily overrides the assert function while performing the
 * specified block. This is useful for testing purposes (to detect if a given
 * function asserts something) or to suppress or override assertions temporarily.
 */
RCT_EXTERN void RCTPerformBlockWithAssertFunction(void (^block)(void), RCTAssertFunction assertFunction);

/**
 * Get the current thread's name (or the current queue, if in debug mode)
 */
RCT_EXTERN NSString *RCTCurrentThreadName(void);

/**
 * Convenience macro to assert which thread is currently running (DEBUG mode only)
 */
#if DEBUG

#define RCTAssertThread(thread, format...) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wdeprecated-declarations\"") \
RCTAssert( \
  [(id)thread isKindOfClass:[NSString class]] ? \
    [RCTCurrentThreadName() isEqualToString:(NSString *)thread] : \
    [(id)thread isKindOfClass:[NSThread class]] ? \
      [NSThread currentThread] ==  (NSThread *)thread : \
      dispatch_get_current_queue() == (dispatch_queue_t)thread, \
  format); \
_Pragma("clang diagnostic pop")

#else

#define RCTAssertThread(thread, format...)

#endif
